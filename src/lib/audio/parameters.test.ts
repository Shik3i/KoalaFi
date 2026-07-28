import { describe, expect, it } from 'vitest';
import { getMelodyFilterRange } from './parameters';

describe('audio parameter mapping', () => {
	it('keeps the melody filter modulation centered on the focus cutoff', () => {
		expect(getMelodyFilterRange(0)).toEqual({ min: 420, max: 580 });
		expect(getMelodyFilterRange(1)).toEqual({ min: 1750, max: 2050 });
	});

	it('clamps out-of-range focus values', () => {
		expect(getMelodyFilterRange(-1)).toEqual(getMelodyFilterRange(0));
		expect(getMelodyFilterRange(2)).toEqual(getMelodyFilterRange(1));
	});
});
