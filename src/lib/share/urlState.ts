import type { KoalaFiState } from '../state/koalaFiState';
import { encodeState } from './encodeState';
import { decodeState } from './decodeState';

/**
 * Parses the current URL (either search query or hash) to extract and validate KoalaFiState.
 */
export function getStateFromUrl(urlStr: string): KoalaFiState | null {
	try {
		const url = new URL(urlStr);

		// Check search query parameter first, e.g. ?vibe=...
		let vibe = url.searchParams.get('vibe');
		if (!vibe) {
			// Check hash fragment, e.g. #vibe=... or just #...
			const hash = url.hash.replace(/^#/, '');
			if (hash) {
				if (hash.startsWith('vibe=')) {
					vibe = hash.slice(5);
				} else {
					vibe = hash;
				}
			}
		}

		if (!vibe) return null;
		return decodeState(vibe);
	} catch (err) {
		console.error('Failed to parse state from URL:', err);
		return null;
	}
}

/**
 * Generates a full URL representing the current state.
 * @param origin - The window.location.origin to use.
 * @param state - The state to share.
 * @param mode - 'none' for normal share, 'rough-clock' to sync starting time.
 */
export function generateShareUrl(
	origin: string,
	state: KoalaFiState,
	mode: 'none' | 'rough-clock'
): string {
	const clonedState = JSON.parse(JSON.stringify(state)) as KoalaFiState;

	if (mode === 'rough-clock') {
		clonedState.sync = {
			mode: 'rough-clock',
			startedAtUtc: new Date().toISOString()
		};
	} else {
		clonedState.sync = {
			mode: 'none'
		};
	}

	const encoded = encodeState(clonedState);
	// Using query param so it is clean and indexable/routable
	return `${origin}/?vibe=${encoded}`;
}

/**
 * Calculates the offset in seconds for clock-synchronized playbacks.
 */
export function getRoughSyncPlayhead(state: KoalaFiState): number {
	if (state.sync.mode !== 'rough-clock' || !state.sync.startedAtUtc) {
		return 0;
	}

	try {
		const startedTime = new Date(state.sync.startedAtUtc).getTime();
		if (Number.isNaN(startedTime)) return 0;
		const nowTime = Date.now();
		const elapsedMs = nowTime - startedTime;

		if (elapsedMs < 0 || Number.isNaN(elapsedMs)) return 0;

		// Convert to seconds
		return elapsedMs / 1000;
	} catch (err) {
		console.error('Error calculating rough-sync offset:', err);
		return 0;
	}
}
