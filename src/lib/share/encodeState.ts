import type { KoalaFiState } from '../state/koalaFiState';

/**
 * Encodes the KoalaFiState into a compact, URL-safe Base64 string.
 */
export function encodeState(state: KoalaFiState): string {
	try {
		const compactObj = {
			v: state.schemaVersion,
			g: state.generatorVersion,
			s: state.seed,
			p: state.presetId,
			t: state.title,
			sm: state.sync.mode,
			ss: state.sync.startedAtUtc,
			m: [
				state.music.enabled ? 1 : 0,
				state.music.bpm,
				state.music.key,
				state.music.scale,
				Math.round(state.music.focus * 100),
				Math.round(state.music.cozy * 100),
				Math.round(state.music.sleepy * 100),
				Math.round(state.music.jazzy * 100),
				Math.round(state.music.energy * 100),
				Math.round(state.music.melody * 100),
				Math.round(state.music.drums * 100),
				Math.round(state.music.bass * 100),
				Math.round(state.music.chords * 100)
			],
			a: [
				Math.round(state.ambience.rain * 100),
				Math.round(state.ambience.ocean * 100),
				Math.round(state.ambience.wind * 100),
				Math.round(state.ambience.vinyl * 100),
				Math.round(state.ambience.whiteNoise * 100),
				Math.round(state.ambience.pinkNoise * 100),
				Math.round(state.ambience.brownNoise * 100)
			],
			vi: [
				state.visual.theme,
				state.visual.motion,
				Math.round(state.visual.brightness * 100),
				Math.round(state.visual.glow * 100)
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
