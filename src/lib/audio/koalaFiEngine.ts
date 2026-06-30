import * as Tone from 'tone';
import type { KoalaFiState } from '../state/koalaFiState';
import { generatePattern } from './generator';
import { ChordsInstrument, BassInstrument, MelodyInstrument } from './instruments';
import { DrumsInstrument } from './drums';
import { AmbienceGenerator } from './ambience';
import { MasterEffectsPipeline } from './effects';
import { AudioScheduler } from './transport';

export class KoalaFiEngine {
	private initialized = false;
	private seed: string = '';
	private generatorVersion = 1;
	private bpm = 75;
	private key = '';
	private scale = '';

	private effects: MasterEffectsPipeline | null = null;
	private chords: ChordsInstrument | null = null;
	private bass: BassInstrument | null = null;
	private melody: MelodyInstrument | null = null;
	private drums: DrumsInstrument | null = null;
	private ambience: AmbienceGenerator | null = null;
	private scheduler: AudioScheduler | null = null;

	async initializeAudio() {
		if (this.initialized) return;

		// Start Tone.js Audio Context (browser policy requirement)
		await withTimeout(Tone.start(), 5000, 'Audio context start timed out.');

		// Create effects pipeline
		this.effects = new MasterEffectsPipeline();

		// Create instruments routed to the music bus
		this.chords = new ChordsInstrument(this.effects.musicBus);
		this.bass = new BassInstrument(this.effects.musicBus);
		this.melody = new MelodyInstrument(this.effects.musicBus);

		// Create drums routed to the music bus
		this.drums = new DrumsInstrument(this.effects.musicBus);

		// Create ambience generator routed to the ambience bus
		this.ambience = new AmbienceGenerator(this.effects.ambienceBus);

		// Create scheduler
		this.scheduler = new AudioScheduler(this.chords, this.bass, this.melody, this.drums);

		// Default BPM setting on transport
		Tone.Transport.bpm.value = this.bpm;

		this.initialized = true;
		console.log('KoalaFi audio engine successfully initialized');
	}

	start() {
		if (!this.initialized) return;
		this.effects?.resumeOutput();
		Tone.Transport.start();
	}

	stop() {
		if (!this.initialized) return;
		Tone.Transport.stop();
		this.effects?.silenceNow();
		this.chords?.releaseAll();
		this.bass?.releaseAll();
		this.melody?.releaseAll();
		this.drums?.releaseAll();
		this.ambience?.releaseAll();
	}

	toggle() {
		if (!this.initialized) return;
		if (Tone.Transport.state === 'started') {
			this.stop();
		} else {
			this.start();
		}
	}

	get playbackState() {
		return Tone.Transport.state;
	}

	/**
	 * Applies the full application state to the audio engine.
	 * Regenerates patterns only if seed, generatorVersion, key, or scale changes.
	 */
	applyState(state: KoalaFiState) {
		if (!this.initialized) return;

		// 1. Detect if sequence needs to be regenerated
		const seedChanged = this.seed !== state.seed;
		const versionChanged = this.generatorVersion !== state.generatorVersion;
		const keyChanged = this.key !== state.music.key;
		const scaleChanged = this.scale !== state.music.scale;

		if (seedChanged || versionChanged || keyChanged || scaleChanged || this.chords === null) {
			this.seed = state.seed;
			this.generatorVersion = state.generatorVersion;
			this.key = state.music.key;
			this.scale = state.music.scale;

			// Regenerate the 64-bar pattern deterministically
			const pattern = generatePattern(this.seed, state.music);
			this.scheduler?.loadPattern(pattern);
		}

		// 2. Adjust transport tempo
		if (Tone.Transport.bpm.value !== state.music.bpm) {
			Tone.Transport.bpm.value = state.music.bpm;
		}

		// 3. Update real-time musical parameters (Volume, Cutoffs, Complexity)
		if (this.chords) this.chords.updateParams(state.music.chords, state.music.cozy);
		if (this.bass) this.bass.updateParams(state.music.bass, state.music.sleepy);
		if (this.melody) {
			this.melody.updateParams(state.music.melody, state.music.focus);
			this.scheduler?.setMelodyComplexity(state.music.melody);
		}
		if (this.scheduler) {
			this.scheduler.setSwing(state.music.jazzy);
		}
		if (this.drums) this.drums.updateParams(state.music.drums, state.music.energy);

		// 4. Update ambience volumes
		if (this.ambience) {
			this.ambience.updateParams(state.ambience);
		}

		// 5. Update master effects (brightness, filter cutoff based on sleepy level)
		if (this.effects) {
			this.effects.updateParams(state.music.sleepy);
		}
	}

	/**
	 * Sets the playhead directly from a rough-clock start parameter.
	 */
	setPlayheadFromRoughSync(state: KoalaFiState) {
		if (!this.initialized || !this.scheduler) return;
		if (state.sync.mode === 'rough-clock' && state.sync.startedAtUtc) {
			this.scheduler.setPlayheadFromRoughSync(state.sync.startedAtUtc, state.music.bpm);
		}
	}

	dispose() {
		this.stop();

		if (this.scheduler) {
			this.scheduler.clear();
			this.scheduler = null;
		}
		if (this.chords) {
			this.chords.dispose();
			this.chords = null;
		}
		if (this.bass) {
			this.bass.dispose();
			this.bass = null;
		}
		if (this.melody) {
			this.melody.dispose();
			this.melody = null;
		}
		if (this.drums) {
			this.drums.dispose();
			this.drums = null;
		}
		if (this.ambience) {
			this.ambience.dispose();
			this.ambience = null;
		}
		if (this.effects) {
			this.effects.dispose();
			this.effects = null;
		}

		this.initialized = false;
	}
}

// Global audio engine singleton
export const audioEngine = new KoalaFiEngine();

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	const timeout = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
	});

	return Promise.race([promise, timeout]).finally(() => {
		if (timeoutId) clearTimeout(timeoutId);
	});
}
