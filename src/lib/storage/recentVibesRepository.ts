import { getDB } from './db';
import type { KoalaFiState } from '../state/koalaFiState';
import { migrateState } from '../state/migrations';

export type RecentVibeRecord = {
	id: string; // Typically the seed or an auto-incrementing key
	state: KoalaFiState;
	firstPlayedAt: string;
	lastPlayedAt: string;
	playCount: number;
};

export async function getRecentVibes(limit = 20): Promise<RecentVibeRecord[]> {
	try {
		const db = await getDB();
		const safeLimit = Math.max(0, Math.min(100, Math.floor(limit)));
		if (safeLimit === 0) return [];

		const tx = db.transaction('recentVibes', 'readonly');
		const index = tx.objectStore('recentVibes').index('lastPlayedAt');
		const results: RecentVibeRecord[] = [];

		let cursor = await index.openCursor(null, 'prev');
		while (cursor && results.length < safeLimit) {
			results.push(cursor.value as RecentVibeRecord);
			cursor = await cursor.continue();
		}

		await tx.done;
		return results;
	} catch (err) {
		console.error('Failed to query recent vibes:', err);
		return [];
	}
}

export async function logVibePlay(state: KoalaFiState): Promise<void> {
	try {
		const db = await getDB();
		const safeState = migrateState(state);
		const id = safeState.seed; // Use the seed as identifier
		const tx = db.transaction('recentVibes', 'readwrite');
		const store = tx.objectStore('recentVibes');
		const existing = (await store.get(id)) as RecentVibeRecord | undefined;
		const now = new Date().toISOString();
		const nextState = JSON.parse(JSON.stringify(safeState));

		if (existing) {
			await store.put({
				...existing,
				lastPlayedAt: now,
				playCount: existing.playCount + 1,
				state: nextState
			});
		} else {
			const record: RecentVibeRecord = {
				id,
				state: nextState,
				firstPlayedAt: now,
				lastPlayedAt: now,
				playCount: 1
			};
			await store.put(record);
		}

		await tx.done;
	} catch (err) {
		console.error('Failed to log vibe play:', err);
	}
}
