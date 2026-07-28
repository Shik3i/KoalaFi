export type AudioQualityMetrics = {
	peak: number;
	rms: number;
	dcOffset: number;
	clippedSampleRatio: number;
	crestFactorDb: number;
};

export function analysePcm(channels: Float32Array[]): AudioQualityMetrics {
	let sampleCount = 0;
	let peak = 0;
	let sum = 0;
	let sumSquares = 0;
	let clippedSamples = 0;

	for (const channel of channels) {
		for (const sample of channel) {
			const magnitude = Math.abs(sample);
			sampleCount += 1;
			peak = Math.max(peak, magnitude);
			sum += sample;
			sumSquares += sample * sample;
			if (magnitude >= 0.999) clippedSamples += 1;
		}
	}

	if (sampleCount === 0) {
		return { peak: 0, rms: 0, dcOffset: 0, clippedSampleRatio: 0, crestFactorDb: 0 };
	}

	const rms = Math.sqrt(sumSquares / sampleCount);

	return {
		peak,
		rms,
		dcOffset: Math.abs(sum / sampleCount),
		clippedSampleRatio: clippedSamples / sampleCount,
		crestFactorDb: rms > 0 && peak > 0 ? 20 * Math.log10(peak / rms) : 0
	};
}

export function passesAudioQualityGate(metrics: AudioQualityMetrics): boolean {
	return (
		metrics.peak >= 0.01 &&
		metrics.peak < 0.999 &&
		metrics.rms >= 0.001 &&
		metrics.rms < 0.4 &&
		metrics.dcOffset < 0.01 &&
		metrics.clippedSampleRatio === 0 &&
		metrics.crestFactorDb >= 2
	);
}
