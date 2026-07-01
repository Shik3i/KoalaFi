import * as Tone from 'tone';

export class ChordsInstrument {
	synth: Tone.PolySynth;
	filter: Tone.Filter;
	gain: Tone.Volume;
	private vibrato: Tone.Vibrato;

	constructor(output: Tone.InputNode) {
		this.gain = new Tone.Volume(-12).connect(output);
		this.filter = new Tone.Filter({
			type: 'lowpass',
			frequency: 600,
			Q: 1
		}).connect(this.gain);

		this.synth = new Tone.PolySynth({
			voice: Tone.Synth,
			options: {
				oscillator: {
					type: 'sine' // Soft rhodes keys tone
				},
				envelope: {
					attack: 0.15, // Softer attack
					decay: 1.2, // Longer decay
					sustain: 0.5,
					release: 1.8 // Longer release for warm sustain
				}
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
		const cutoff = 350 + (1 - cozyLevel) * 1100;
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
		this.gain = new Tone.Volume(-6).connect(output);
		this.synth = new Tone.MonoSynth({
			oscillator: {
				type: 'triangle' // Pure warm sub bass
			},
			filter: {
				type: 'lowpass',
				frequency: 90,
				Q: 0.8
			},
			envelope: {
				attack: 0.18, // Slower attack for gentle sub swell
				decay: 0.5,
				sustain: 0.85,
				release: 1.0
			},
			filterEnvelope: {
				attack: 0.08,
				decay: 0.15,
				sustain: 0.6,
				release: 0.6,
				baseFrequency: 75,
				octaves: 1.2
			}
		}).connect(this.gain);
	}

	trigger(note: string, duration: string, time: number, velocity: number) {
		this.synth.triggerAttackRelease(note, duration, time, velocity);
	}

	updateParams(bassLevel: number, sleepyLevel: number) {
		// Sleepy level dampens bass (lower filter frequency)
		const baseFreq = 70 + (1 - sleepyLevel) * 100;
		this.synth.filter.frequency.setTargetAtTime(baseFreq, Tone.now(), 0.1);

		// Scale volume
		const vol = bassLevel === 0 ? -96 : Tone.gainToDb(bassLevel) - 4;
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
			frequency: 850,
			Q: 0.8
		}).connect(this.gain);

		this.synth = new Tone.Synth({
			oscillator: {
				type: 'triangle' // Gentle plucks
			},
			envelope: {
				attack: 0.08, // Softer attack
				decay: 0.35, // Longer decay
				sustain: 0.2,
				release: 1.2 // Dreamy release trail
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
		// Focus level increases plucky brightness
		const cutoff = 500 + focusLevel * 1400;
		this.filter.frequency.setTargetAtTime(cutoff, Tone.now(), 0.1);

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
