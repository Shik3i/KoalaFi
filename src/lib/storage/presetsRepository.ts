import { getDB } from './db';
import type { KoalaFiState } from '../state/koalaFiState';
import { migrateState } from '../state/migrations';

export type UserPresetRecord = {
	id: string;
	name: string;
	category: 'focus' | 'relax' | 'sleep' | 'ambient' | 'synthwave';
	state: KoalaFiState;
	createdAt: string;
	updatedAt: string;
	source: 'user' | 'built-in-copy';
	remoteId?: string;
	syncStatus?: 'local' | 'synced' | 'dirty' | 'deleted';
};

export async function getAllPresets(): Promise<UserPresetRecord[]> {
	try {
		const db = await getDB();
		return await db.getAll('userPresets');
	} catch (err) {
		console.error('Failed to get all presets:', err);
		return [];
	}
}

export async function getPreset(id: string): Promise<UserPresetRecord | undefined> {
	try {
		const db = await getDB();
		return await db.get('userPresets', id);
	} catch (err) {
		console.error(`Failed to get preset ${id}:`, err);
		return undefined;
	}
}

export async function savePreset(preset: UserPresetRecord): Promise<void> {
	try {
		const db = await getDB();
		const name = preset.name.trim().slice(0, 40) || 'Untitled Vibe';
		const state = migrateState({
			...preset.state,
			presetId: preset.id,
			title: name
		});

		await db.put('userPresets', {
			...preset,
			name,
			state,
			updatedAt: new Date().toISOString()
		});
	} catch (err) {
		console.error(`Failed to save preset ${preset.id}:`, err);
	}
}

export async function renamePreset(id: string, name: string): Promise<void> {
	try {
		const db = await getDB();
		const preset = (await db.get('userPresets', id)) as UserPresetRecord | undefined;
		if (!preset) return;
		const safeName = name.trim().slice(0, 40) || preset.name;

		await db.put('userPresets', {
			...preset,
			name: safeName,
			state: migrateState({
				...preset.state,
				title: safeName
			}),
			updatedAt: new Date().toISOString()
		});
	} catch (err) {
		console.error(`Failed to rename preset ${id}:`, err);
	}
}

export async function deletePreset(id: string): Promise<void> {
	try {
		const db = await getDB();
		await db.delete('userPresets', id);
	} catch (err) {
		console.error(`Failed to delete preset ${id}:`, err);
	}
}
