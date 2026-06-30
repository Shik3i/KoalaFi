import * as Tone from 'tone';
import type { SeededPattern } from './types';
import type { ChordsInstrument, BassInstrument, MelodyInstrument } from './instruments';
import type { DrumsInstrument } from './drums';

export class AudioScheduler {
	private chordsPart: Tone.Part | null = null;
	private bassPart: Tone.Part | null = null;
	private drumsPart: Tone.Part | null = null;
	private melodyPart: Tone.Part | null = null;

	// Track slider complexity thresholds
	private melodyComplexity = 0.5;

	constructor(
		private chordsInst: ChordsInstrument,
		private bassInst: BassInstrument,
		private leadInst: MelodyInstrument,
		private drumsInst: DrumsInstrument
	) {}

	/**
	 * Loads a pre-generated 64-bar pattern into Tone.js Parts.
	 */
	loadPattern(pattern: SeededPattern) {
		this.clear();

		const loopEnd = '64m'; // 64 bars loop length

		// 1. Chords Part
		const flatChords = pattern.chords.flat();
		this.chordsPart = new Tone.Part((time, event) => {
			this.chordsInst.trigger([event.note], event.duration, time, event.velocity || 0.5);
		}, flatChords);
		this.chordsPart.loop = true;
		this.chordsPart.loopEnd = loopEnd;
		this.chordsPart.start(0);

		// 2. Bass Part
		this.bassPart = new Tone.Part((time, event) => {
			this.bassInst.trigger(event.note, event.duration, time, event.velocity || 0.6);
		}, pattern.bassline);
		this.bassPart.loop = true;
		this.bassPart.loopEnd = loopEnd;
		this.bassPart.start(0);

		// 3. Drums Part
		this.drumsPart = new Tone.Part((time, event) => {
			if (event.type === 'kick') {
				this.drumsInst.triggerKick(time, event.velocity || 0.8);
			} else if (event.type === 'snare') {
				this.drumsInst.triggerSnare(time, event.velocity || 0.8);
			} else if (event.type === 'hihat') {
				this.drumsInst.triggerHihat(time, event.velocity || 0.4);
			}
		}, pattern.drums);
		this.drumsPart.loop = true;
		this.drumsPart.loopEnd = loopEnd;
		this.drumsPart.start(0);

		// 4. Melody Part (procedural density gate)
		this.melodyPart = new Tone.Part((time, event) => {
			// event.velocity is mapped as a priority score in range [0, 1]
			// We only play notes whose priority score is below or equal to our melodyComplexity setting
			if (event.velocity !== undefined && event.velocity <= this.melodyComplexity) {
				// Play leadpluck with a standardized velocity
				this.leadInst.trigger(event.note, event.duration, time, 0.6);
			}
		}, pattern.melody);
		this.melodyPart.loop = true;
		this.melodyPart.loopEnd = loopEnd;
		this.melodyPart.start(0);
	}

	setMelodyComplexity(val: number) {
		this.melodyComplexity = val;
	}

	/**
	 * Sets the transport clock based on rough-sync starting point.
	 */
	setPlayheadFromRoughSync(startedAtUtc: string, bpm: number) {
		try {
			if (!Number.isFinite(bpm) || bpm <= 0) return;

			const startedTime = new Date(startedAtUtc).getTime();
			if (Number.isNaN(startedTime)) return;

			const elapsedMs = Date.now() - startedTime;
			if (elapsedMs <= 0 || Number.isNaN(elapsedMs)) return;

			const elapsedSec = elapsedMs / 1000;

			// A loop is 64 bars of 4 beats = 256 beats total.
			// At a given BPM, one beat is (60 / BPM) seconds.
			const secondsPerBeat = 60 / bpm;
			const totalLoopSeconds = 256 * secondsPerBeat;

			// Calculate active loop position in seconds
			const activePosition = elapsedSec % totalLoopSeconds;

			Tone.Transport.stop();
			Tone.Transport.seconds = activePosition;
		} catch (err) {
			console.error('Failed to set playhead from rough-sync:', err);
		}
	}

	clear() {
		if (this.chordsPart) {
			this.chordsPart.dispose();
			this.chordsPart = null;
		}
		if (this.bassPart) {
			this.bassPart.dispose();
			this.bassPart = null;
		}
		if (this.drumsPart) {
			this.drumsPart.dispose();
			this.drumsPart = null;
		}
		if (this.melodyPart) {
			this.melodyPart.dispose();
			this.melodyPart = null;
		}
	}
}
