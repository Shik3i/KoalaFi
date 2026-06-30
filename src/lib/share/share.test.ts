import { describe, it, expect } from 'vitest';
import { encodeState } from './encodeState';
import { decodeState } from './decodeState';
import { migrateState } from '../state/migrations';
import { getRoughSyncPlayhead } from './urlState';
import { DEFAULT_STATE } from '../state/defaults';
import { BUILT_IN_PRESETS } from '../state/presets';
import type { KoalaFiState } from '../state/koalaFiState';

const TEST_STATE: KoalaFiState = {
	schemaVersion: 1,
	generatorVersion: 1,
	seed: 'test-vibe-seed',
	presetId: 'sunset-focus',
	title: 'Sunset Focus Test',
	sync: {
		mode: 'none'
	},
	music: {
		enabled: false,
		bpm: 78,
		key: 'F#',
		scale: 'dorian',
		focus: 0.6,
		cozy: 0.7,
		sleepy: 0.1,
		jazzy: 0.5,
		energy: 0.8,
		melody: 0.9,
		drums: 0.4,
		bass: 0.5,
		chords: 0.6
	},
	ambience: {
		rain: 0.4,
		ocean: 0.1,
		wind: 0.2,
		vinyl: 0.6,
		whiteNoise: 0.0,
		pinkNoise: 0.1,
		brownNoise: 0.3
	},
	visual: {
		theme: 'neon-coast',
		motion: 'reactive',
		brightness: 0.9,
		glow: 0.8
	}
};

describe('URL State Serialization', () => {
	it('should encode and decode state correctly matching input', () => {
		const encoded = encodeState(TEST_STATE);
		expect(encoded).toBeTruthy();
		expect(typeof encoded).toBe('string');

		const decoded = decodeState(encoded);
		expect(decoded).toBeTruthy();

		// Check key fields match
		expect(decoded?.seed).toBe(TEST_STATE.seed);
		expect(decoded?.music.bpm).toBe(TEST_STATE.music.bpm);
		expect(decoded?.music.scale).toBe(TEST_STATE.music.scale);
		expect(decoded?.visual.theme).toBe(TEST_STATE.visual.theme);
	});

	it('should handle corrupt input strings gracefully returning null', () => {
		const corruptLink = 'not-a-valid-base64-string!!!';
		const decoded = decodeState(corruptLink);
		expect(decoded).toBeNull();
	});

	it('should reject oversized encoded input', () => {
		expect(decodeState('a'.repeat(4097))).toBeNull();
	});
});

describe('State Migration and Validation', () => {
	it('should sanitize NaN and non-finite values back to defaults', () => {
		const corruptState = {
			seed: 'corrupt-test',
			music: {
				bpm: NaN,
				focus: Infinity,
				cozy: 'not-a-number'
			}
		};
		const migrated = migrateState(corruptState);
		expect(Number.isFinite(migrated.music.bpm)).toBe(true);
		expect(migrated.music.bpm).toBe(DEFAULT_STATE.music.bpm);
		expect(migrated.music.focus).toBe(DEFAULT_STATE.music.focus);
		expect(migrated.music.cozy).toBe(DEFAULT_STATE.music.cozy);
	});

	it('should sanitize invalid music key and invalid date string', () => {
		const corruptState = {
			music: {
				key: 'INVALID-KEY'
			},
			sync: {
				mode: 'rough-clock',
				startedAtUtc: 'not-a-date'
			}
		};
		const migrated = migrateState(corruptState);
		expect(migrated.music.key).toBe(DEFAULT_STATE.music.key);
		expect(migrated.sync.startedAtUtc).toBeUndefined();
	});

	it('should validate all built-in presets without changing their ids', () => {
		for (const preset of BUILT_IN_PRESETS) {
			const migrated = migrateState(preset.state);
			expect(migrated.presetId).toBe(preset.id);
			expect(migrated.schemaVersion).toBe(1);
			expect(migrated.generatorVersion).toBe(1);
		}
	});

	it('should clamp untrusted string lengths', () => {
		const migrated = migrateState({
			seed: 'x'.repeat(120),
			title: 't'.repeat(120),
			presetId: 'p'.repeat(120)
		});

		expect(migrated.seed.length).toBe(80);
		expect(migrated.title?.length).toBe(80);
		expect(migrated.presetId?.length).toBe(80);
	});

	it('should compute rough-clock playhead from UTC elapsed seconds', () => {
		const now = Date.now();
		const state = migrateState({
			...DEFAULT_STATE,
			sync: {
				mode: 'rough-clock',
				startedAtUtc: new Date(now - 12_500).toISOString()
			}
		});

		const playhead = getRoughSyncPlayhead(state);
		expect(playhead).toBeGreaterThanOrEqual(12);
		expect(playhead).toBeLessThan(13);
	});
});
