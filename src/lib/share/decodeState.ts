import type { KoalaFiState } from '../state/koalaFiState';
import { migrateState } from '../state/migrations';

const MAX_ENCODED_STATE_LENGTH = 4096;

/**
 * Decodes a URL-safe Base64 string back into a validated KoalaFiState.
 * Returns null if the string is corrupt or invalid.
 */
export function decodeState(hash: string): KoalaFiState | null {
	if (!hash || hash.length > MAX_ENCODED_STATE_LENGTH) return null;

	try {
		// Restore base64 padding and standard chars
		let base64 = hash.replace(/-/g, '+').replace(/_/g, '/');
		while (base64.length % 4) {
			base64 += '=';
		}

		// Safe base64 decoding with URL percent decoding for UTF-8 support
		const rawJson = decodeURIComponent(
			atob(base64)
				.split('')
				.map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
				.join('')
		);

		const compactObj = JSON.parse(rawJson) as Record<string, unknown>;
		if (!compactObj || typeof compactObj !== 'object' || Array.isArray(compactObj)) return null;

		// Reconstruct rawState from shortened keys
		const rawState: Record<string, unknown> = {
			schemaVersion: compactObj.v,
			generatorVersion: compactObj.g,
			seed: compactObj.s,
			presetId: compactObj.p,
			title: compactObj.t,
			sync: {
				mode: compactObj.sm,
				startedAtUtc: compactObj.ss
			}
		};

		if (Array.isArray(compactObj.m)) {
			rawState.music = {
				enabled: compactObj.m[0] === 1,
				bpm: compactObj.m[1],
				key: compactObj.m[2],
				scale: compactObj.m[3],
				focus: compactObj.m[4] / 100,
				cozy: compactObj.m[5] / 100,
				sleepy: compactObj.m[6] / 100,
				jazzy: compactObj.m[7] / 100,
				energy: compactObj.m[8] / 100,
				melody: compactObj.m[9] / 100,
				drums: compactObj.m[10] / 100,
				bass: compactObj.m[11] / 100,
				chords: compactObj.m[12] / 100
			};
		}

		if (Array.isArray(compactObj.a)) {
			rawState.ambience = {
				rain: compactObj.a[0] / 100,
				ocean: compactObj.a[1] / 100,
				wind: compactObj.a[2] / 100,
				vinyl: compactObj.a[3] / 100,
				whiteNoise: compactObj.a[4] / 100,
				pinkNoise: compactObj.a[5] / 100,
				brownNoise: compactObj.a[6] / 100
			};
		}

		if (Array.isArray(compactObj.vi)) {
			rawState.visual = {
				theme: compactObj.vi[0],
				motion: compactObj.vi[1],
				brightness: compactObj.vi[2] / 100,
				glow: compactObj.vi[3] / 100
			};
		}

		// Run verification/migration mapping
		return migrateState(rawState);
	} catch {
		return null;
	}
}
