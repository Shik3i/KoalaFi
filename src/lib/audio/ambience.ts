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
	private oceanLFO: Tone.LFO;
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

		// 2. Ocean waves: Pink noise modulated by a slow LFO (rolling volume)
		this.oceanVol = new Tone.Volume(-96).connect(output);
		this.oceanGain = new Tone.Gain(0).connect(this.oceanVol);
		this.oceanNoise = new Tone.Noise('pink').connect(this.oceanGain);
		this.oceanLFO = new Tone.LFO({
			frequency: 0.07, // ~14s wave cycle
			min: 0.05,
			max: 0.8,
			type: 'triangle'
		});
		this.oceanLFO.connect(this.oceanGain.gain);

		// 3. Whistling Wind: Brown noise passed through high-resonance bandpass filter modulated by LFO
		this.windVol = new Tone.Volume(-96).connect(output);
		this.windFilter = new Tone.Filter({
			type: 'bandpass',
			frequency: 450,
			Q: 5.0
		}).connect(this.windVol);
		this.windNoise = new Tone.Noise('brown').connect(this.windFilter);
		this.windLFO = new Tone.LFO({
			frequency: 0.04, // Whistle speed
			min: 250,
			max: 650,
			type: 'sine'
		});
		this.windLFO.connect(this.windFilter.frequency);

		// 4. Rain: Continuous bandpass pink noise + tiny highpass droplet impulses
		this.rainVol = new Tone.Volume(-96).connect(output);
		this.rainFilter = new Tone.Filter({
			type: 'bandpass',
			frequency: 1200,
			Q: 1.0
		}).connect(this.rainVol);
		this.rainNoise = new Tone.Noise('pink').connect(this.rainFilter);

		this.rainDropletFilter = new Tone.Filter({
			type: 'highpass',
			frequency: 6000,
			Q: 2.0
		}).connect(this.rainVol);
		this.rainDroplets = new Tone.NoiseSynth({
			noise: { type: 'pink' },
			envelope: {
				attack: 0.001,
				decay: 0.006,
				sustain: 0
			}
		}).connect(this.rainDropletFilter);

		// 5. Vinyl Crackle: Low-frequency dust rumble + sharp random static pops
		this.vinylVol = new Tone.Volume(-96).connect(output);
		this.vinylFilter = new Tone.Filter({
			type: 'lowpass',
			frequency: 150
		}).connect(this.vinylVol);
		this.vinylNoise = new Tone.Noise('brown').connect(this.vinylFilter);

		this.vinylCrackleFilter = new Tone.Filter({
			type: 'bandpass',
			frequency: 4000,
			Q: 3.0
		}).connect(this.vinylVol);
		this.vinylCrackle = new Tone.NoiseSynth({
			noise: { type: 'white' },
			envelope: {
				attack: 0.001,
				decay: 0.002,
				sustain: 0
			}
		}).connect(this.vinylCrackleFilter);

		// Start raw generators
		this.whiteNoise.start();
		this.pinkNoise.start();
		this.brownNoise.start();
		this.oceanNoise.start();
		this.oceanLFO.start();
		this.windNoise.start();
		this.windLFO.start();
		this.rainNoise.start();
		this.vinylNoise.start();

		// Schedule droplet & crackle trigger loops in Tone.js transport
		this.startScheduling();
	}

	private startScheduling() {
		// Schedule repeating event for rain droplets (runs in Tone.Transport context)
		this.rainLoopId = Tone.Transport.scheduleRepeat((time) => {
			// Deterministic trigger pattern based on clock ticks
			// Use time to compute a pseudo-random trigger index
			const seed = Math.sin(time * 1000) * 10000;
			const rnd = seed - Math.floor(seed);
			if (rnd > 0.4) {
				this.rainDroplets.triggerAttack(time, rnd * 0.15);
			}
		}, '16n');

		// Schedule repeating event for vinyl crackles (fewer, sharp pops)
		this.vinylLoopId = Tone.Transport.scheduleRepeat((time) => {
			const seed = Math.cos(time * 500) * 10000;
			const rnd = seed - Math.floor(seed);
			if (rnd > 0.85) {
				// Trigger a double crackle pop
				this.vinylCrackle.triggerAttack(time, rnd * 0.3);
				if (rnd > 0.93) {
					this.vinylCrackle.triggerAttack(time + 0.015, rnd * 0.2);
				}
			}
		}, '8n');
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

		this.whiteVol.volume.setTargetAtTime(getDb(state.whiteNoise, -18), Tone.now(), 0.1);
		this.pinkVol.volume.setTargetAtTime(getDb(state.pinkNoise, -18), Tone.now(), 0.1);
		this.brownVol.volume.setTargetAtTime(getDb(state.brownNoise, -18), Tone.now(), 0.1);

		this.oceanVol.volume.setTargetAtTime(getDb(state.ocean, -8), Tone.now(), 0.1);
		this.windVol.volume.setTargetAtTime(getDb(state.wind, -10), Tone.now(), 0.1);
		this.rainVol.volume.setTargetAtTime(getDb(state.rain, -10), Tone.now(), 0.1);
		this.vinylVol.volume.setTargetAtTime(getDb(state.vinyl, -12), Tone.now(), 0.1);
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
		this.oceanLFO.dispose();
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
