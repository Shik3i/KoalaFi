import * as Tone from 'tone';

export class MasterEffectsPipeline {
	// Master bus nodes
	masterFilter: Tone.Filter;
	compressor: Tone.Compressor;
	limiter: Tone.Limiter;
	mainVolume: Tone.Volume;

	// Tape emulation saturation
	saturationNode: Tone.Distortion;

	// Auxiliary spatial effects
	delayNode: Tone.FeedbackDelay;
	reverbNode: Tone.Reverb;

	// Sub buses
	musicBus: Tone.Volume;
	ambienceBus: Tone.Volume;

	constructor() {
		// 1. Core outputs (Default volume safe and comfortable)
		this.mainVolume = new Tone.Volume(-6).toDestination();
		this.limiter = new Tone.Limiter(-1).connect(this.mainVolume); // Peak clipper

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
		}).connect(this.compressor);

		// 2. Aux sends
		this.delayNode = new Tone.FeedbackDelay({
			delayTime: '8n.',
			feedback: 0.35,
			wet: 0.15
		}).connect(this.compressor);

		this.reverbNode = new Tone.Reverb({
			decay: 2.2,
			wet: 0.25
		}).connect(this.compressor);

		// 3. Sub buses
		// Music bus routes through saturation before compressor
		this.musicBus = new Tone.Volume(0).connect(this.saturationNode);
		this.musicBus.connect(this.delayNode);
		this.musicBus.connect(this.reverbNode);

		// Ambience bus bypasses delay/reverb and saturation to stay clear
		this.ambienceBus = new Tone.Volume(-2).connect(this.masterFilter);
	}

	/**
	 * Safe master gain adjust
	 */
	setMasterVolume(level: number) {
		const vol = level === 0 ? -96 : Tone.gainToDb(level);
		this.mainVolume.volume.setTargetAtTime(vol, Tone.now(), 0.05);
	}

	updateParams(sleepyLevel: number) {
		// High sleepy makes the master output warmer / lowpassed
		const maxFreq = 16000;
		const minFreq = 1200;
		const targetFreq = maxFreq - sleepyLevel * (maxFreq - minFreq);
		this.masterFilter.frequency.setTargetAtTime(targetFreq, Tone.now(), 0.25);
	}

	dispose() {
		this.masterFilter.dispose();
		this.compressor.dispose();
		this.limiter.dispose();
		this.saturationNode.dispose();
		this.mainVolume.dispose();
		this.delayNode.dispose();
		this.reverbNode.dispose();
		this.musicBus.dispose();
		this.ambienceBus.dispose();
	}
}
