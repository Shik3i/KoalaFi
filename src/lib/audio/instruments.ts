import * as Tone from 'tone';
import { getMelodyFilterRange } from './parameters';

export class ChordsInstrument {
	synth: Tone.PolySynth;
	filter: Tone.Filter;
	gain: Tone.Volume;
	private vibrato: Tone.Vibrato;

	constructor(output: Tone.InputNode) {
		this.gain = new Tone.Volume(-12).connect(output);
		this.filter = new Tone.Filter({
			type: 'lowpass',
			frequency: 1450,
			Q: 0.7
		}).connect(this.gain);

		this.synth = new Tone.PolySynth(Tone.FMSynth, {
			harmonicity: 2.01,
			modulationIndex: 1.4,
			oscillator: { type: 'sine' },
			modulation: { type: 'triangle' },
			envelope: {
				attack: 0.025,
				decay: 0.5,
				sustain: 0.18,
				release: 0.75
			},
			modulationEnvelope: {
				attack: 0.01,
				decay: 0.28,
				sustain: 0.1,
				release: 0.45
			}
		});

		// Subtle tape wow and flutter vibrato
		this.vibrato = new Tone.Vibrato({
			frequency: 0.15, // Slow drift
			depth: 0.12 // Gentle pitch drift depth
		});

		this.synth.connect(this.vibrato);
		this.vibrato.connect(this.filter);
	}

	trigger(notes: string[], duration: string, time: number, velocity: number) {
		notes.forEach((note, idx) => {
			const delay = idx * 0.012; // 12ms natural strumming offset
			this.synth.triggerAttackRelease(note, duration, time + delay, velocity);
		});
	}

	updateParams(chordsLevel: number, cozyLevel: number, jazzyLevel: number) {
		// Cozy level makes it warmer by lowering cutoff frequency
		const cutoff = 700 + (1 - cozyLevel) * 1600;
		this.filter.frequency.setTargetAtTime(cutoff, Tone.now(), 0.1);

		// Jazzy level scales tape wow & flutter pitch vibrato depth
		const targetDepth = 0.04 + jazzyLevel * 0.16;
		this.vibrato.depth.setTargetAtTime(targetDepth, Tone.now(), 0.1);

		// Scale volume
		const vol = chordsLevel === 0 ? -96 : Tone.gainToDb(chordsLevel) - 6;
		this.gain.volume.setTargetAtTime(vol, Tone.now(), 0.05);
	}

	releaseAll() {
		this.synth.releaseAll(Tone.now());
	}

	dispose() {
		this.vibrato.dispose();
		this.synth.dispose();
		this.filter.dispose();
		this.gain.dispose();
	}
}

export class BassInstrument {
	synth: Tone.MonoSynth;
	gain: Tone.Volume;

	constructor(output: Tone.InputNode) {
		this.gain = new Tone.Volume(-3).connect(output);
		this.synth = new Tone.MonoSynth({
			oscillator: {
				type: 'sawtooth'
			},
			filter: {
				type: 'lowpass',
				frequency: 520,
				Q: 1.1
			},
			envelope: {
				attack: 0.008,
				decay: 0.16,
				sustain: 0.34,
				release: 0.16
			},
			filterEnvelope: {
				attack: 0.004,
				decay: 0.14,
				sustain: 0.22,
				release: 0.18,
				baseFrequency: 180,
				octaves: 2.5
			}
		}).connect(this.gain);
	}

	trigger(note: string, duration: string, time: number, velocity: number) {
		this.synth.triggerAttackRelease(note, duration, time, velocity);
	}

	updateParams(bassLevel: number, sleepyLevel: number) {
		// Sleepy level dampens bass (lower filter frequency)
		const baseFreq = 180 + (1 - sleepyLevel) * 520;
		this.synth.filter.frequency.setTargetAtTime(baseFreq, Tone.now(), 0.1);

		// Scale volume
		const vol = bassLevel === 0 ? -96 : Tone.gainToDb(bassLevel) - 1;
		this.gain.volume.setTargetAtTime(vol, Tone.now(), 0.05);
	}

	releaseAll() {
		this.synth.triggerRelease(Tone.now());
	}

	dispose() {
		this.synth.dispose();
		this.gain.dispose();
	}
}

export class MelodyInstrument {
	synth: Tone.Synth;
	filter: Tone.Filter;
	gain: Tone.Volume;
	private vibratoLFO: Tone.LFO;
	private filterLFO: Tone.LFO;

	constructor(output: Tone.InputNode) {
		this.gain = new Tone.Volume(-14).connect(output);
		this.filter = new Tone.Filter({
			type: 'lowpass',
			frequency: 1900,
			Q: 0.8
		}).connect(this.gain);

		this.synth = new Tone.Synth({
			oscillator: {
				type: 'triangle8'
			},
			envelope: {
				attack: 0.012,
				decay: 0.16,
				sustain: 0.06,
				release: 0.32
			}
		}).connect(this.filter);

		// Subtle pitch drift LFO
		this.vibratoLFO = new Tone.LFO({
			frequency: 0.18, // Slow drift
			min: -8, // -8 cents detune
			max: 8, // +8 cents detune
			type: 'sine'
		});
		this.vibratoLFO.connect(this.synth.detune);
		this.vibratoLFO.start();

		// Gentle filter cutoff modulation
		this.filterLFO = new Tone.LFO({
			frequency: 0.07, // Slow movement
			min: -150,
			max: 150,
			type: 'sine'
		});
		this.filterLFO.connect(this.filter.frequency);
		this.filterLFO.start();
	}

	trigger(note: string, duration: string, time: number, velocity: number) {
		this.synth.triggerAttackRelease(note, duration, time, velocity);
	}

	updateParams(melodyLevel: number, focusLevel: number) {
		// Keep the LFO centered around the focus-controlled cutoff. A directly connected
		// LFO owns the AudioParam, so writing the filter frequency itself has no effect.
		const range = getMelodyFilterRange(focusLevel);
		this.filterLFO.min = range.min;
		this.filterLFO.max = range.max;

		// Scale volume
		const vol = melodyLevel === 0 ? -96 : Tone.gainToDb(melodyLevel) - 5;
		this.gain.volume.setTargetAtTime(vol, Tone.now(), 0.05);
	}

	releaseAll() {
		this.synth.triggerRelease(Tone.now());
	}

	dispose() {
		this.vibratoLFO.dispose();
		this.filterLFO.dispose();
		this.synth.dispose();
		this.filter.dispose();
		this.gain.dispose();
	}
}
