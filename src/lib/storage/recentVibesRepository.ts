import { getDB } from './db';
import type { KoalaFiState } from '../state/koalaFiState';

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
		const all = await db.getAll('recentVibes');
		// Sort descending by lastPlayedAt
		return all
			.sort((a, b) => new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime())
			.slice(0, limit);
	} catch (err) {
		console.error('Failed to query recent vibes:', err);
		return [];
	}
}

export async function logVibePlay(state: KoalaFiState): Promise<void> {
	try {
		const db = await getDB();
		const id = state.seed; // Use the seed as identifier
		const existing = (await db.get('recentVibes', id)) as RecentVibeRecord | undefined;
		const now = new Date().toISOString();

		if (existing) {
			existing.lastPlayedAt = now;
			existing.playCount += 1;
			existing.state = JSON.parse(JSON.stringify(state)); // update state in case music settings changed
			await db.put('recentVibes', existing);
		} else {
			const record: RecentVibeRecord = {
				id,
				state: JSON.parse(JSON.stringify(state)),
				firstPlayedAt: now,
				lastPlayedAt: now,
				playCount: 1
			};
			await db.put('recentVibes', record);
		}
	} catch (err) {
		console.error('Failed to log vibe play:', err);
	}
}
