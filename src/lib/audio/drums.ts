import * as Tone from 'tone';

export class DrumsInstrument {
	kick: Tone.MembraneSynth;
	snare: Tone.NoiseSynth;
	snareFilter: Tone.Filter;
	hihat: Tone.NoiseSynth;
	hihatFilter: Tone.Filter;
	gain: Tone.Volume;

	constructor(output: Tone.InputNode) {
		this.gain = new Tone.Volume(-12).connect(output);

		// 1. Kick Drum (Deep sub sweep, slightly shorter decay for a tighter thud)
		this.kick = new Tone.MembraneSynth({
			envelope: {
				attack: 0.001,
				decay: 0.22,
				sustain: 0
			},
			oscillator: {
				type: 'sine'
			}
		}).connect(this.gain);

		// 2. Snare Drum (Bandpass filtered pink noise burst, lower cutoff and Q for a dusty clap)
		this.snareFilter = new Tone.Filter({
			type: 'bandpass',
			frequency: 750,
			Q: 0.8
		}).connect(this.gain);

		this.snare = new Tone.NoiseSynth({
			noise: {
				type: 'pink'
			},
			envelope: {
				attack: 0.002,
				decay: 0.18,
				sustain: 0
			}
		}).connect(this.snareFilter);

		// 3. Hi-hat (Highpass filtered pink noise burst for a softer, less aggressive tick)
		this.hihatFilter = new Tone.Filter({
			type: 'highpass',
			frequency: 6500,
			Q: 1.0
		}).connect(this.gain);

		this.hihat = new Tone.NoiseSynth({
			noise: {
				type: 'pink'
			},
			envelope: {
				attack: 0.001,
				decay: 0.04,
				sustain: 0
			}
		}).connect(this.hihatFilter);
	}

	triggerKick(time: number, velocity: number) {
		this.kick.triggerAttackRelease('C2', '8n', time, velocity * 0.85);
	}

	triggerSnare(time: number, velocity: number) {
		this.snare.triggerAttack(time, velocity * 0.55);
	}

	triggerHihat(time: number, velocity: number) {
		this.hihat.triggerAttack(time, velocity * 0.25);
	}

	updateParams(drumsLevel: number, energyLevel: number) {
		// Energy level makes hi-hats slightly longer / snappier
		const hhDecay = 0.03 + energyLevel * 0.06;
		this.hihat.envelope.decay = hhDecay;

		// Snare decay scales slightly with energy
		const snareDecay = 0.12 + energyLevel * 0.08;
		this.snare.envelope.decay = snareDecay;

		// Scale master drum volume
		const vol = drumsLevel === 0 ? -96 : Tone.gainToDb(drumsLevel) - 5;
		this.gain.volume.setTargetAtTime(vol, Tone.now(), 0.05);
	}

	releaseAll() {
		const now = Tone.now();
		this.kick.triggerRelease(now);
		this.snare.triggerRelease(now);
		this.hihat.triggerRelease(now);
	}

	dispose() {
		this.kick.dispose();
		this.snare.dispose();
		this.snareFilter.dispose();
		this.hihat.dispose();
		this.hihatFilter.dispose();
		this.gain.dispose();
	}
}
