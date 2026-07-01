import * as Tone from 'tone';

export class MasterEffectsPipeline {
	// Master bus nodes
	masterFilter: Tone.Filter;
	compressor: Tone.Compressor;
	limiter: Tone.Limiter;
	mainVolume: Tone.Volume;
	analyser: Tone.Analyser;

	// Tape emulation saturation
	saturationNode: Tone.Distortion;

	// Auxiliary spatial effects
	delayNode: Tone.FeedbackDelay;
	reverbNode: Tone.Reverb;

	// Sub buses
	musicBus: Tone.Volume;
	ambienceBus: Tone.Volume;
	ambienceWidener: Tone.StereoWidener;

	constructor() {
		// 1. Core outputs (Default volume safe and comfortable)
		this.mainVolume = new Tone.Volume(-6).toDestination();
		this.analyser = new Tone.Analyser('waveform', 32);
		this.limiter = new Tone.Limiter(-1).connect(this.analyser); // Peak clipper
		this.analyser.connect(this.mainVolume);

		// Warm lowpass filter to emulate analog tape roll-off
		this.masterFilter = new Tone.Filter({
			type: 'lowpass',
			frequency: 16000,
			Q: 0.5
		}).connect(this.limiter);

		this.compressor = new Tone.Compressor({
			threshold: -16,
			ratio: 2.5,
			attack: 0.03,
			release: 0.08
		}).connect(this.masterFilter);

		// Subtle saturation/tape warmth node
		this.saturationNode = new Tone.Distortion({
			distortion: 0.06, // Very gentle saturation
			wet: 0.08
		});
		this.saturationNode.connect(this.compressor);

		// 2. Aux sends
		this.delayNode = new Tone.FeedbackDelay({
			delayTime: '8n.',
			feedback: 0.35,
			wet: 0.15
		});
		this.delayNode.connect(this.compressor);

		this.reverbNode = new Tone.Reverb({
			decay: 2.2,
			wet: 0.25
		});
		this.reverbNode.connect(this.compressor);

		// 3. Sub buses
		// Music bus routes through saturation before compressor
		this.musicBus = new Tone.Volume(0);
		this.musicBus.connect(this.saturationNode);
		this.musicBus.connect(this.delayNode);
		this.musicBus.connect(this.reverbNode);

		// Ambience bus bypasses delay/reverb and saturation to stay clear
		// We add a StereoWidener with 60% width to make the ambient environment feel wide and immersive
		this.ambienceWidener = new Tone.StereoWidener(0.6).connect(this.masterFilter);
		this.ambienceBus = new Tone.Volume(-2).connect(this.ambienceWidener);
	}

	/**
	 * Safe master gain adjust
	 */
	setMasterVolume(level: number) {
		const vol = level === 0 ? -96 : Tone.gainToDb(level);
		this.mainVolume.volume.setTargetAtTime(vol, Tone.now(), 0.05);
	}

	updateParams(sleepyLevel: number, cozyLevel: number) {
		// High sleepy makes the master output warmer / lowpassed
		const maxFreq = 16000;
		const minFreq = 1200;
		const targetFreq = maxFreq - sleepyLevel * (maxFreq - minFreq);
		this.masterFilter.frequency.setTargetAtTime(targetFreq, Tone.now(), 0.25);

		// Cozy level scales tape saturation wetness and distortion
		const targetDist = 0.02 + cozyLevel * 0.18; // distortion goes from 0.02 to 0.20
		const targetWet = 0.04 + cozyLevel * 0.16; // wet goes from 0.04 to 0.20
		this.saturationNode.distortion = targetDist;
		this.saturationNode.wet.setTargetAtTime(targetWet, Tone.now(), 0.1);
	}

	silenceNow() {
		const now = Tone.now();
		this.mainVolume.volume.cancelScheduledValues(now);
		this.mainVolume.volume.setValueAtTime(-96, now);
	}

	resumeOutput() {
		const now = Tone.now();
		this.mainVolume.volume.cancelScheduledValues(now);
		this.mainVolume.volume.setTargetAtTime(-6, now, 0.015);
	}

	getAnalyserEnergy(): number {
		try {
			const data = this.analyser.getValue() as Float32Array;
			if (!data || data.length === 0) return 0;
			let sumSq = 0;
			for (let i = 0; i < data.length; i++) {
				const val = data[i];
				sumSq += val * val;
			}
			const rms = Math.sqrt(sumSq / data.length);
			// Scale and clamp RMS for nice visual bounce reactivity
			const energy = rms * 4.0;
			return isNaN(energy) ? 0 : Math.max(0.0, Math.min(1.0, energy));
		} catch {
			return 0;
		}
	}

	dispose() {
		this.analyser.dispose();
		this.masterFilter.dispose();
		this.compressor.dispose();
		this.limiter.dispose();
		this.saturationNode.dispose();
		this.mainVolume.dispose();
		this.delayNode.dispose();
		this.reverbNode.dispose();
		this.musicBus.dispose();
		this.ambienceBus.dispose();
		this.ambienceWidener.dispose();
	}
}
