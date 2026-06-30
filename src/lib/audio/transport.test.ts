import { describe, it, expect } from 'vitest';
import { AudioScheduler } from './transport';
import type { ChordsInstrument, BassInstrument, MelodyInstrument } from './instruments';
import type { DrumsInstrument } from './drums';

describe('AudioScheduler Deterministic Swing and Humanization', () => {
	const mockChords = {} as unknown as ChordsInstrument;
	const mockBass = {} as unknown as BassInstrument;
	const mockMelody = {} as unknown as MelodyInstrument;
	const mockDrums = {} as unknown as DrumsInstrument;

	it('should return 0 swing delay when swingIntensity is 0', () => {
		const scheduler = new AudioScheduler(mockChords, mockBass, mockMelody, mockDrums);
		scheduler.setSwing(0.0);

		const delay = scheduler['getSwingDelay']('0:1:2');
		expect(delay).toBe(0);
	});

	it('should calculate deterministic non-zero delay on off-beats when swing is enabled', () => {
		const scheduler = new AudioScheduler(mockChords, mockBass, mockMelody, mockDrums);
		scheduler.setSwing(0.8);

		const delayOffbeat1 = scheduler['getSwingDelay']('0:1:1'); // 16th off-beat
		const delayOffbeat2 = scheduler['getSwingDelay']('0:1:3'); // 16th off-beat
		const delayOnbeat = scheduler['getSwingDelay']('0:1:0'); // On-beat

		expect(delayOffbeat1).toBeGreaterThan(0);
		expect(delayOffbeat2).toBeGreaterThan(0);
		expect(delayOnbeat).toBe(0);

		// Verify determinism: same input must yield same delay
		expect(scheduler['getSwingDelay']('0:1:1')).toBe(delayOffbeat1);
	});

	it('should calculate deterministic humanized velocity wobbles', () => {
		const scheduler = new AudioScheduler(mockChords, mockBass, mockMelody, mockDrums);

		const vel1 = scheduler['getHumanizedVelocity'](0.6, '0:1:2', 'C4');
		const vel2 = scheduler['getHumanizedVelocity'](0.6, '0:1:2', 'C4');
		const velDifferent = scheduler['getHumanizedVelocity'](0.6, '0:1:3', 'D4');

		expect(vel1).toBe(vel2); // Same inputs -> same velocity
		expect(vel1).not.toBe(0.6); // Wobble must be applied
		expect(vel1).not.toBe(velDifferent); // Different inputs -> different velocity

		// Ensure output is clamped to safe limits
		expect(vel1).toBeGreaterThanOrEqual(0.15);
		expect(vel1).toBeLessThanOrEqual(0.95);
	});
});
