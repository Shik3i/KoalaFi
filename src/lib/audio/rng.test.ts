import { describe, it, expect } from 'vitest';
import { SeededRNG } from './rng';
import { generatePattern } from './generator';
import { DEFAULT_STATE } from '../state/defaults';

describe('Mulberry32 Seeded RNG', () => {
	it('should generate identical float outputs given the same seed', () => {
		const rng1 = new SeededRNG('koalafi-test');
		const rng2 = new SeededRNG('koalafi-test');

		const seq1 = [rng1.next(), rng1.next(), rng1.next()];
		const seq2 = [rng2.next(), rng2.next(), rng2.next()];

		expect(seq1).toEqual(seq2);
	});

	it('should generate different float outputs given different seeds', () => {
		const rng1 = new SeededRNG('seed-a');
		const rng2 = new SeededRNG('seed-b');

		const seq1 = [rng1.next(), rng1.next(), rng1.next()];
		const seq2 = [rng2.next(), rng2.next(), rng2.next()];

		expect(seq1).not.toEqual(seq2);
	});

	it('should pick elements deterministically', () => {
		const items = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
		const rng1 = new SeededRNG('picker-seed');
		const rng2 = new SeededRNG('picker-seed');

		const pick1 = rng1.choice(items);
		const pick2 = rng2.choice(items);

		expect(pick1).toBe(pick2);
	});

	it('should shuffle arrays deterministically', () => {
		const list = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
		const rng1 = new SeededRNG('shuffle-seed');
		const rng2 = new SeededRNG('shuffle-seed');

		const shuffled1 = rng1.shuffle(list);
		const shuffled2 = rng2.shuffle(list);

		expect(shuffled1).toEqual(shuffled2);
	});
});

describe('Seeded Pattern Generator', () => {
	it('should generate identical patterns for the same seed and music settings', () => {
		const first = generatePattern('deterministic-seed', DEFAULT_STATE.music);
		const second = generatePattern('deterministic-seed', DEFAULT_STATE.music);

		expect(first).toEqual(second);
	});

	it('should generate different patterns for different seeds', () => {
		const first = generatePattern('deterministic-seed-a', DEFAULT_STATE.music);
		const second = generatePattern('deterministic-seed-b', DEFAULT_STATE.music);

		expect(first).not.toEqual(second);
	});

	it('should preserve the 64-bar arrangement', () => {
		const pattern = generatePattern('arrangement-seed', DEFAULT_STATE.music);
		const eventTimes = [
			...pattern.bassline.map((event) => event.time),
			...pattern.drums.map((event) => event.time),
			...pattern.melody.map((event) => event.time),
			...pattern.chords.map((event) => event.time)
		];

		expect(eventTimes.some((time) => time.startsWith('63:'))).toBe(true);
		expect(eventTimes.every((time) => Number(time.split(':')[0]) < 64)).toBe(true);
	});
});
