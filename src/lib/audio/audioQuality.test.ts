import { describe, expect, it } from 'vitest';
import { analysePcm, passesAudioQualityGate } from './audioQuality';

describe('audio quality metrics', () => {
	it('measures healthy alternating PCM without DC or clipping', () => {
		const metrics = analysePcm([new Float32Array([0.1, -0.1, 0.2, -0.2, 0.05, -0.05])]);

		expect(metrics.peak).toBeCloseTo(0.2);
		expect(metrics.dcOffset).toBeCloseTo(0);
		expect(metrics.clippedSampleRatio).toBe(0);
		expect(metrics.crestFactorDb).toBeGreaterThan(2);
		expect(passesAudioQualityGate(metrics)).toBe(true);
	});

	it('rejects silent, clipped, and DC-biased buffers', () => {
		expect(passesAudioQualityGate(analysePcm([new Float32Array(32)]))).toBe(false);
		expect(passesAudioQualityGate(analysePcm([new Float32Array([1, -1, 0.2, -0.2])]))).toBe(false);
		expect(passesAudioQualityGate(analysePcm([new Float32Array([0.2, 0.2, 0.2, 0.2])]))).toBe(
			false
		);
	});
});
