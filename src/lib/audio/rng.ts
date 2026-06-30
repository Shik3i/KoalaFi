/**
 * Seeded Mulberry32 pseudo-random number generator (PRNG).
 * Produces identical output sequences given the same seed string.
 */
export class SeededRNG {
	private state: number;

	constructor(seedStr: string) {
		// FNV-1a hash of the seed string to create a 32-bit state
		let h = 2166136261;
		for (let i = 0; i < seedStr.length; i++) {
			h = Math.imul(h ^ seedStr.charCodeAt(i), 16777619);
		}
		this.state = h >>> 0;
	}

	/**
	 * Generates a random float in [0, 1)
	 */
	next(): number {
		let t = (this.state += 0x6d2b79f5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}

	/**
	 * Generates a random float in [min, max)
	 */
	range(min: number, max: number): number {
		return min + this.next() * (max - min);
	}

	/**
	 * Generates a random integer in [min, max] (inclusive)
	 */
	intRange(min: number, max: number): number {
		return Math.floor(this.range(min, max + 1));
	}

	/**
	 * Selects a random element from an array
	 */
	choice<T>(arr: T[]): T {
		if (arr.length === 0) {
			throw new Error('Cannot pick from empty array');
		}
		const idx = this.intRange(0, arr.length - 1);
		return arr[idx];
	}

	/**
	 * Shuffles an array deterministically in place
	 */
	shuffle<T>(arr: T[]): T[] {
		const clone = [...arr];
		for (let i = clone.length - 1; i > 0; i--) {
			const j = this.intRange(0, i);
			const temp = clone[i];
			clone[i] = clone[j];
			clone[j] = temp;
		}
		return clone;
	}
}
export function createRNG(seed: string): SeededRNG {
	return new SeededRNG(seed);
}
