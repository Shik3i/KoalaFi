import * as Tone from 'tone';

export class ChordsInstrument {
	synth: Tone.PolySynth;
	filter: Tone.Filter;
	gain: Tone.Volume;

	constructor(output: Tone.InputNode) {
		this.gain = new Tone.Volume(-12).connect(output);
		this.filter = new Tone.Filter({
			type: 'lowpass',
			frequency: 600,
			Q: 1
		}).connect(this.gain);

		this.synth = new Tone.PolySynth(Tone.Synth, {
			oscillator: {
				type: 'sine' // Soft rhodes keys tone
			},
			envelope: {
				attack: 0.12,
				decay: 0.8,
				sustain: 0.6,
				release: 1.5
			}
		}).connect(this.filter);
	}

	trigger(notes: string[], duration: string, time: number, velocity: number) {
		this.synth.triggerAttackRelease(notes, duration, time, velocity);
	}

	updateParams(chordsLevel: number, cozyLevel: number) {
		// Cozy level makes it warmer by lowering cutoff frequency
		const cutoff = 400 + (1 - cozyLevel) * 1200;
		this.filter.frequency.setTargetAtTime(cutoff, Tone.now(), 0.1);

		// Scale volume
		const vol = chordsLevel === 0 ? -96 : Tone.gainToDb(chordsLevel) - 12;
		this.gain.volume.setTargetAtTime(vol, Tone.now(), 0.05);
	}

	dispose() {
		this.synth.dispose();
		this.filter.dispose();
		this.gain.dispose();
	}
}

export class BassInstrument {
	synth: Tone.MonoSynth;
	gain: Tone.Volume;

	constructor(output: Tone.InputNode) {
		this.gain = new Tone.Volume(-6).connect(output);
		this.synth = new Tone.MonoSynth({
			oscillator: {
				type: 'triangle' // Pure warm sub bass
			},
			filter: {
				type: 'lowpass',
				frequency: 120,
				Q: 1
			},
			envelope: {
				attack: 0.05,
				decay: 0.4,
				sustain: 0.8,
				release: 0.8
			},
			filterEnvelope: {
				attack: 0.02,
				decay: 0.1,
				sustain: 0.5,
				release: 0.5,
				baseFrequency: 100,
				octaves: 1.5
			}
		}).connect(this.gain);
	}

	trigger(note: string, duration: string, time: number, velocity: number) {
		this.synth.triggerAttackRelease(note, duration, time, velocity);
	}

	updateParams(bassLevel: number, sleepyLevel: number) {
		// Sleepy level dampens bass (lower filter frequency)
		const baseFreq = 80 + (1 - sleepyLevel) * 120;
		this.synth.filter.frequency.setTargetAtTime(baseFreq, Tone.now(), 0.1);

		// Scale volume
		const vol = bassLevel === 0 ? -96 : Tone.gainToDb(bassLevel) - 8;
		this.gain.volume.setTargetAtTime(vol, Tone.now(), 0.05);
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

	constructor(output: Tone.InputNode) {
		this.gain = new Tone.Volume(-14).connect(output);
		this.filter = new Tone.Filter({
			type: 'lowpass',
			frequency: 1000,
			Q: 1
		}).connect(this.gain);

		this.synth = new Tone.Synth({
			oscillator: {
				type: 'triangle' // Gentle plucks
			},
			envelope: {
				attack: 0.05,
				decay: 0.25,
				sustain: 0.3,
				release: 0.8
			}
		}).connect(this.filter);
	}

	trigger(note: string, duration: string, time: number, velocity: number) {
		this.synth.triggerAttackRelease(note, duration, time, velocity);
	}

	updateParams(melodyLevel: number, focusLevel: number) {
		// Focus level increases plucky brightness
		const cutoff = 600 + focusLevel * 1600;
		this.filter.frequency.setTargetAtTime(cutoff, Tone.now(), 0.1);

		// Scale volume
		const vol = melodyLevel === 0 ? -96 : Tone.gainToDb(melodyLevel) - 10;
		this.gain.volume.setTargetAtTime(vol, Tone.now(), 0.05);
	}

	dispose() {
		this.synth.dispose();
		this.filter.dispose();
		this.gain.dispose();
	}
}
