import type { KoalaFiState } from '../state/koalaFiState';
import { migrateState } from '../state/migrations';

/**
 * Encodes the KoalaFiState into a compact, URL-safe Base64 string.
 */
export function encodeState(state: KoalaFiState): string {
	try {
		const safeState = migrateState(state);
		const compactObj = {
			v: safeState.schemaVersion,
			g: safeState.generatorVersion,
			s: safeState.seed,
			p: safeState.presetId,
			t: safeState.title,
			sm: safeState.sync.mode,
			ss: safeState.sync.startedAtUtc,
			m: [
				safeState.music.enabled ? 1 : 0,
				safeState.music.bpm,
				safeState.music.key,
				safeState.music.scale,
				Math.round(safeState.music.focus * 100),
				Math.round(safeState.music.cozy * 100),
				Math.round(safeState.music.sleepy * 100),
				Math.round(safeState.music.jazzy * 100),
				Math.round(safeState.music.energy * 100),
				Math.round(safeState.music.melody * 100),
				Math.round(safeState.music.drums * 100),
				Math.round(safeState.music.bass * 100),
				Math.round(safeState.music.chords * 100)
			],
			a: [
				Math.round(safeState.ambience.rain * 100),
				Math.round(safeState.ambience.ocean * 100),
				Math.round(safeState.ambience.wind * 100),
				Math.round(safeState.ambience.vinyl * 100),
				Math.round(safeState.ambience.whiteNoise * 100),
				Math.round(safeState.ambience.pinkNoise * 100),
				Math.round(safeState.ambience.brownNoise * 100)
			],
			vi: [
				safeState.visual.theme,
				safeState.visual.motion,
				Math.round(safeState.visual.brightness * 100),
				Math.round(safeState.visual.glow * 100)
			]
		};

		const json = JSON.stringify(compactObj);

		// Convert to URL-safe Base64
		const base64 = btoa(
			encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => {
				return String.fromCharCode(parseInt(p1, 16));
			})
		);

		return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	} catch (err) {
		console.error('Failed to encode state:', err);
		return '';
	}
}
