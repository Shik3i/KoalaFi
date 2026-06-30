import * as Tone from 'tone';

export class AmbienceGenerator {
	// Pure noise nodes
	private whiteNoise: Tone.Noise;
	private pinkNoise: Tone.Noise;
	private brownNoise: Tone.Noise;

	private whiteVol: Tone.Volume;
	private pinkVol: Tone.Volume;
	private brownVol: Tone.Volume;

	// Synthesized natural elements
	private oceanNoise: Tone.Noise;
	private oceanGain: Tone.Gain;
	private oceanFilter: Tone.Filter;
	private oceanLFO: Tone.LFO;
	private oceanFilterLFO: Tone.LFO;
	private oceanVol: Tone.Volume;

	private windNoise: Tone.Noise;
	private windFilter: Tone.Filter;
	private windLFO: Tone.LFO;
	private windVol: Tone.Volume;

	private rainNoise: Tone.Noise;
	private rainFilter: Tone.Filter;
	private rainVol: Tone.Volume;
	private rainDroplets: Tone.NoiseSynth;
	private rainDropletFilter: Tone.Filter;
	private rainLoopId: number | null = null;

	private vinylNoise: Tone.Noise;
	private vinylFilter: Tone.Filter;
	private vinylVol: Tone.Volume;
	private vinylCrackle: Tone.NoiseSynth;
	private vinylCrackleFilter: Tone.Filter;
	private vinylLoopId: number | null = null;

	constructor(output: Tone.InputNode) {
		// 1. Core noise colors
		this.whiteVol = new Tone.Volume(-96).connect(output);
		this.whiteNoise = new Tone.Noise('white').connect(this.whiteVol);

		this.pinkVol = new Tone.Volume(-96).connect(output);
		this.pinkNoise = new Tone.Noise('pink').connect(this.pinkVol);

		this.brownVol = new Tone.Volume(-96).connect(output);
		this.brownNoise = new Tone.Noise('brown').connect(this.brownVol);

		// 2. Ocean waves: Pink noise modulated by synchronized LFOs (modulating volume and lowpass cutoff in tandem)
		this.oceanVol = new Tone.Volume(-96).connect(output);
		this.oceanFilter = new Tone.Filter({
			type: 'lowpass',
			frequency: 350,
			Q: 0.5
		}).connect(this.oceanVol);
		this.oceanGain = new Tone.Gain(0).connect(this.oceanFilter);
		this.oceanNoise = new Tone.Noise('pink').connect(this.oceanGain);

		this.oceanLFO = new Tone.LFO({
			frequency: 0.05, // Slow 20s wave cycle
			min: 0.05,
			max: 0.7,
			type: 'triangle'
		});
		this.oceanLFO.connect(this.oceanGain.gain);

		this.oceanFilterLFO = new Tone.LFO({
			frequency: 0.05,
			min: 220, // Muffled wave retreat
			max: 680, // Brighter wave rush
			type: 'triangle'
		});
		this.oceanFilterLFO.connect(this.oceanFilter.frequency);

		// 3. Whistling Wind: Subtle, warm whistling wind
		this.windVol = new Tone.Volume(-96).connect(output);
		this.windFilter = new Tone.Filter({
			type: 'bandpass',
			frequency: 380,
			Q: 3.0 // lower Q for warmer feel
		}).connect(this.windVol);
		this.windNoise = new Tone.Noise('brown').connect(this.windFilter);
		this.windLFO = new Tone.LFO({
			frequency: 0.035, // Slow drifting whistle
			min: 200,
			max: 480,
			type: 'sine'
		});
		this.windLFO.connect(this.windFilter.frequency);

		// 4. Rain: Soft lowpass pink noise rumble + gentle droplets
		this.rainVol = new Tone.Volume(-96).connect(output);
		this.rainFilter = new Tone.Filter({
			type: 'lowpass',
			frequency: 780, // Soft patter frequency
			Q: 0.7
		}).connect(this.rainVol);
		this.rainNoise = new Tone.Noise('pink').connect(this.rainFilter);

		this.rainDropletFilter = new Tone.Filter({
			type: 'bandpass',
			frequency: 3200,
			Q: 1.0
		}).connect(this.rainVol);
		this.rainDroplets = new Tone.NoiseSynth({
			noise: { type: 'pink' }, // Pink noise for softer droplets
			envelope: {
				attack: 0.001,
				decay: 0.015, // Longer decay to prevent digital clicks
				sustain: 0
			}
		}).connect(this.rainDropletFilter);

		// 5. Vinyl Crackle: Rare, warm, dusty pops
		this.vinylVol = new Tone.Volume(-96).connect(output);
		this.vinylFilter = new Tone.Filter({
			type: 'lowpass',
			frequency: 120
		}).connect(this.vinylVol);
		this.vinylNoise = new Tone.Noise('brown').connect(this.vinylFilter);

		this.vinylCrackleFilter = new Tone.Filter({
			type: 'bandpass',
			frequency: 3800,
			Q: 2.0
		}).connect(this.vinylVol);
		this.vinylCrackle = new Tone.NoiseSynth({
			noise: { type: 'pink' },
			envelope: {
				attack: 0.001,
				decay: 0.004,
				sustain: 0
			}
		}).connect(this.vinylCrackleFilter);

		// Start generators
		this.whiteNoise.start();
		this.pinkNoise.start();
		this.brownNoise.start();
		this.oceanNoise.start();
		this.oceanLFO.start();
		this.oceanFilterLFO.start();
		this.windNoise.start();
		this.windLFO.start();
		this.rainNoise.start();
		this.vinylNoise.start();

		// Schedule droplet & crackle trigger loops
		this.startScheduling();
	}

	private startScheduling() {
		// Schedule repeating event for rain droplets
		this.rainLoopId = Tone.Transport.scheduleRepeat((time) => {
			const seed = Math.sin(time * 1000) * 10000;
			const rnd = seed - Math.floor(seed);
			if (rnd > 0.45) {
				this.rainDroplets.triggerAttack(time, rnd * 0.12);
			}
		}, '16n');

		// Schedule repeating event for sparse vinyl crackles (slowed down and gating for dust)
		this.vinylLoopId = Tone.Transport.scheduleRepeat((time) => {
			const seed = Math.cos(time * 220) * 10000;
			const rnd = seed - Math.floor(seed);
			if (rnd > 0.96) {
				// Sparse pops
				this.vinylCrackle.triggerAttack(time, rnd * 0.12);
				if (rnd > 0.985) {
					this.vinylCrackle.triggerAttack(time + 0.02, rnd * 0.08);
				}
			}
		}, '4n');
	}

	updateParams(state: {
		rain: number;
		ocean: number;
		wind: number;
		vinyl: number;
		whiteNoise: number;
		pinkNoise: number;
		brownNoise: number;
	}) {
		// Helper to map 0..1 to dB
		const getDb = (level: number, offset = -6) => {
			return level === 0 ? -96 : Tone.gainToDb(level) + offset;
		};

		// 0.8s time constant transition for smooth volume fades when changing presets
		const transitionTime = 0.8;
		const now = Tone.now();

		this.whiteVol.volume.setTargetAtTime(getDb(state.whiteNoise, -18), now, transitionTime);
		this.pinkVol.volume.setTargetAtTime(getDb(state.pinkNoise, -18), now, transitionTime);
		this.brownVol.volume.setTargetAtTime(getDb(state.brownNoise, -18), now, transitionTime);

		this.oceanVol.volume.setTargetAtTime(getDb(state.ocean, -8), now, transitionTime);
		this.windVol.volume.setTargetAtTime(getDb(state.wind, -10), now, transitionTime);
		this.rainVol.volume.setTargetAtTime(getDb(state.rain, -10), now, transitionTime);
		this.vinylVol.volume.setTargetAtTime(getDb(state.vinyl, -12), now, transitionTime);
	}

	releaseAll() {
		const now = Tone.now();
		this.rainDroplets.triggerRelease(now);
		this.vinylCrackle.triggerRelease(now);
	}

	dispose() {
		if (this.rainLoopId !== null) {
			Tone.Transport.clear(this.rainLoopId);
			this.rainLoopId = null;
		}
		if (this.vinylLoopId !== null) {
			Tone.Transport.clear(this.vinylLoopId);
			this.vinylLoopId = null;
		}

		this.whiteNoise.dispose();
		this.whiteVol.dispose();
		this.pinkNoise.dispose();
		this.pinkVol.dispose();
		this.brownNoise.dispose();
		this.brownVol.dispose();

		this.oceanNoise.dispose();
		this.oceanGain.dispose();
		this.oceanFilter.dispose();
		this.oceanLFO.dispose();
		this.oceanFilterLFO.dispose();
		this.oceanVol.dispose();

		this.windNoise.dispose();
		this.windFilter.dispose();
		this.windLFO.dispose();
		this.windVol.dispose();

		this.rainNoise.dispose();
		this.rainFilter.dispose();
		this.rainVol.dispose();
		this.rainDroplets.dispose();
		this.rainDropletFilter.dispose();

		this.vinylNoise.dispose();
		this.vinylFilter.dispose();
		this.vinylVol.dispose();
		this.vinylCrackle.dispose();
		this.vinylCrackleFilter.dispose();
	}
}
