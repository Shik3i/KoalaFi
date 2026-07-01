import * as Tone from 'tone';
import type { SeededPattern } from './types';
import type { ChordsInstrument, BassInstrument, MelodyInstrument } from './instruments';
import type { DrumsInstrument } from './drums';

export class AudioScheduler {
	private chordsPart: Tone.Part | null = null;
	private bassPart: Tone.Part | null = null;
	private drumsPart: Tone.Part | null = null;
	private melodyPart: Tone.Part | null = null;

	// Track slider complexity thresholds and swing
	private melodyComplexity = 0.5;
	private swingIntensity = 0.0;

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
			const delay = this.getSwingDelay(event.time) + this.getStrumDelay(event.note);
			const vel = this.getHumanizedVelocity(event.velocity || 0.5, event.time, event.note);
			this.chordsInst.trigger([event.note], event.duration, time + delay, vel);
		}, flatChords);
		this.chordsPart.loop = true;
		this.chordsPart.loopEnd = loopEnd;
		this.chordsPart.start(0);

		// 2. Bass Part
		this.bassPart = new Tone.Part((time, event) => {
			const delay = this.getSwingDelay(event.time);
			const vel = this.getHumanizedVelocity(event.velocity || 0.6, event.time, event.note);
			this.bassInst.trigger(event.note, event.duration, time + delay, vel);
		}, pattern.bassline);
		this.bassPart.loop = true;
		this.bassPart.loopEnd = loopEnd;
		this.bassPart.start(0);

		// 3. Drums Part
		this.drumsPart = new Tone.Part((time, event) => {
			const delay = this.getSwingDelay(event.time);
			const vel = this.getHumanizedVelocity(event.velocity || 0.8, event.time, event.type);
			if (event.type === 'kick') {
				this.drumsInst.triggerKick(time + delay, vel);
			} else if (event.type === 'snare') {
				this.drumsInst.triggerSnare(time + delay, vel);
			} else if (event.type === 'hihat') {
				this.drumsInst.triggerHihat(time + delay, vel);
			}
		}, pattern.drums);
		this.drumsPart.loop = true;
		this.drumsPart.loopEnd = loopEnd;
		this.drumsPart.start(0);

		// 4. Melody Part (procedural density gate)
		this.melodyPart = new Tone.Part((time, event) => {
			const gateVal = event.gate !== undefined ? event.gate : 0.5;
			if (gateVal <= this.melodyComplexity) {
				const delay = this.getSwingDelay(event.time);
				const vel = this.getHumanizedVelocity(event.velocity || 0.4, event.time, event.note);
				this.leadInst.trigger(event.note, event.duration, time + delay, vel);
			}
		}, pattern.melody);
		this.melodyPart.loop = true;
		this.melodyPart.loopEnd = loopEnd;
		this.melodyPart.start(0);
	}

	setMelodyComplexity(val: number) {
		this.melodyComplexity = val;
	}

	setSwing(val: number) {
		this.swingIntensity = val;
	}

	/**
	 * Safe, BPM-scaled deterministic swing microtime offset
	 */
	private getSwingDelay(timeString: string): number {
		if (this.swingIntensity <= 0) return 0;

		const parts = timeString.split(':');
		if (parts.length < 3) return 0;

		const beat = parseInt(parts[1], 10);
		const sixteenth = parseInt(parts[2], 10);

		// Swing off-beat sixteenth positions (1, 3) and off-beat eighths (2)
		const isOffbeat = sixteenth === 1 || sixteenth === 3 || (sixteenth === 2 && beat % 2 === 0);
		if (!isOffbeat) return 0;

		const bpm = Tone.Transport.bpm?.value || 120;
		const sixteenthDuration = 60 / (bpm * 4);
		// Max swing is clamped at 22% of a sixteenth note to avoid sloppy offsets
		return this.swingIntensity * 0.22 * sixteenthDuration;
	}

	private getStrumDelay(note: string): number {
		try {
			const midi = Tone.Frequency(note).toMidi();
			if (Number.isFinite(midi)) {
				// 1.5ms per semitone above MIDI 36 (C2)
				return Math.max(0, midi - 36) * 0.0015;
			}
		} catch {
			// fallback to 0
		}
		return 0;
	}

	/**
	 * Safe, deterministic hash-based velocity humanizer
	 */
	private getHumanizedVelocity(baseVal: number, timeString: string, identity: string): number {
		let hash = 0;
		const str = timeString + identity;
		for (let i = 0; i < str.length; i++) {
			hash = (hash << 5) - hash + str.charCodeAt(i);
			hash |= 0; // Convert to 32bit integer
		}
		// Subtly wobble velocity by up to ±0.04
		const wobble = ((Math.abs(hash) % 100) / 100) * 0.08 - 0.04;
		return Math.max(0.15, Math.min(0.95, baseVal + wobble));
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
