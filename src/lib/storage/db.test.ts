import 'fake-indexeddb/auto';
import { beforeEach, describe, it, expect } from 'vitest';
import { deleteLocalDatabase, getDB } from './db';
import {
	savePreset,
	getAllPresets,
	getPreset,
	renamePreset,
	deletePreset,
	type UserPresetRecord
} from './presetsRepository';
import { getSetting, setSetting } from './settingsRepository';
import { logVibePlay, getRecentVibes } from './recentVibesRepository';
import { DEFAULT_STATE } from '../state/defaults';

describe('IndexedDB Storage Domain', () => {
	beforeEach(async () => {
		await deleteLocalDatabase();
	});

	it('should initialize the database object stores correctly', async () => {
		const db = await getDB();
		expect(db.name).toBe('koalafi');
		expect(db.objectStoreNames.contains('appSettings')).toBe(true);
		expect(db.objectStoreNames.contains('userPresets')).toBe(true);
		expect(db.objectStoreNames.contains('recentVibes')).toBe(true);
	});

	it('should save, retrieve, and delete user presets', async () => {
		const presetRecord: UserPresetRecord = {
			id: 'test-preset-id',
			name: 'Test Preset',
			category: 'focus',
			state: DEFAULT_STATE,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			source: 'user'
		};

		// Save
		await savePreset(presetRecord);

		// Retrieve all
		const allPresets = await getAllPresets();
		expect(allPresets.length).toBe(1);
		expect(allPresets[0].name).toBe('Test Preset');

		await renamePreset('test-preset-id', 'Renamed Preset');
		const renamed = await getPreset('test-preset-id');
		expect(renamed?.name).toBe('Renamed Preset');
		expect(renamed?.state.title).toBe('Renamed Preset');

		// Delete
		await deletePreset('test-preset-id');
		const afterDelete = await getAllPresets();
		expect(afterDelete.length).toBe(0);
	});

	it('should write and read application settings', async () => {
		// Read non-existent key returns default
		const testVal = await getSetting('theme_override', 'default-theme');
		expect(testVal).toBe('default-theme');

		// Write setting
		await setSetting('theme_override', 'neon-coast');

		// Read again
		const readVal = await getSetting('theme_override', 'default-theme');
		expect(readVal).toBe('neon-coast');
	});

	it('should log played seeds in recent vibes', async () => {
		const state = {
			...DEFAULT_STATE,
			seed: 'my-vibe-seed',
			title: 'Logged Vibe'
		};

		// Log play
		await logVibePlay(state);

		// Fetch history
		const history = await getRecentVibes();
		expect(history.length).toBeGreaterThan(0);
		expect(history[0].id).toBe('my-vibe-seed');
	});
});
