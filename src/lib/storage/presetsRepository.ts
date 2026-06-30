import { getDB } from './db';
import type { KoalaFiState } from '../state/koalaFiState';

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
		await db.put('userPresets', {
			...preset,
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

		await db.put('userPresets', {
			...preset,
			name,
			state: {
				...preset.state,
				title: name
			},
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
