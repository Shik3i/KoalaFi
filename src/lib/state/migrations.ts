import type { KoalaFiState } from './koalaFiState';
import { DEFAULT_STATE } from './defaults';

/**
 * Migrates and validates an untrusted state object, ensuring
 * it conforms to the latest KoalaFiState structure and has safe ranges.
 */
export function migrateState(rawState: unknown): KoalaFiState {
	if (!rawState || typeof rawState !== 'object') {
		return JSON.parse(JSON.stringify(DEFAULT_STATE));
	}

	const src = rawState as Record<string, unknown>;

	const srcSync = isRecord(src.sync) ? src.sync : {};
	const srcMusic = isRecord(src.music) ? src.music : {};
	const srcAmbience = isRecord(src.ambience) ? src.ambience : {};
	const srcVisual = isRecord(src.visual) ? src.visual : {};

	const seed = safeString(src.seed, DEFAULT_STATE.seed, 80);
	const presetId = optionalString(src.presetId, 80);
	const title = optionalString(src.title, 80);

	const syncMode = srcSync.mode === 'rough-clock' ? 'rough-clock' : 'none';
	const startedAtUtc =
		typeof srcSync.startedAtUtc === 'string' && !Number.isNaN(Date.parse(srcSync.startedAtUtc))
			? new Date(srcSync.startedAtUtc).toISOString()
			: undefined;

	const allowedKeys = [
		'C',
		'C#',
		'Db',
		'D',
		'D#',
		'Eb',
		'E',
		'F',
		'F#',
		'Gb',
		'G',
		'G#',
		'Ab',
		'A',
		'A#',
		'Bb',
		'B'
	];
	const music = {
		enabled: typeof srcMusic.enabled === 'boolean' ? srcMusic.enabled : DEFAULT_STATE.music.enabled,
		bpm: clamp(safeNum(srcMusic.bpm, DEFAULT_STATE.music.bpm), 40, 140),
		key:
			typeof srcMusic.key === 'string' && allowedKeys.includes(srcMusic.key)
				? srcMusic.key
				: DEFAULT_STATE.music.key,
		scale:
			typeof srcMusic.scale === 'string' &&
			['minor', 'major', 'pentatonic', 'dorian'].includes(srcMusic.scale)
				? (srcMusic.scale as KoalaFiState['music']['scale'])
				: DEFAULT_STATE.music.scale,
		focus: clamp(safeNum(srcMusic.focus, DEFAULT_STATE.music.focus), 0, 1),
		cozy: clamp(safeNum(srcMusic.cozy, DEFAULT_STATE.music.cozy), 0, 1),
		sleepy: clamp(safeNum(srcMusic.sleepy, DEFAULT_STATE.music.sleepy), 0, 1),
		jazzy: clamp(safeNum(srcMusic.jazzy, DEFAULT_STATE.music.jazzy), 0, 1),
		energy: clamp(safeNum(srcMusic.energy, DEFAULT_STATE.music.energy), 0, 1),
		melody: clamp(safeNum(srcMusic.melody, DEFAULT_STATE.music.melody), 0, 1),
		drums: clamp(safeNum(srcMusic.drums, DEFAULT_STATE.music.drums), 0, 1),
		bass: clamp(safeNum(srcMusic.bass, DEFAULT_STATE.music.bass), 0, 1),
		chords: clamp(safeNum(srcMusic.chords, DEFAULT_STATE.music.chords), 0, 1)
	};

	const ambience = {
		rain: clamp(safeNum(srcAmbience.rain, DEFAULT_STATE.ambience.rain), 0, 1),
		ocean: clamp(safeNum(srcAmbience.ocean, DEFAULT_STATE.ambience.ocean), 0, 1),
		wind: clamp(safeNum(srcAmbience.wind, DEFAULT_STATE.ambience.wind), 0, 1),
		vinyl: clamp(safeNum(srcAmbience.vinyl, DEFAULT_STATE.ambience.vinyl), 0, 1),
		whiteNoise: clamp(safeNum(srcAmbience.whiteNoise, DEFAULT_STATE.ambience.whiteNoise), 0, 1),
		pinkNoise: clamp(safeNum(srcAmbience.pinkNoise, DEFAULT_STATE.ambience.pinkNoise), 0, 1),
		brownNoise: clamp(safeNum(srcAmbience.brownNoise, DEFAULT_STATE.ambience.brownNoise), 0, 1)
	};

	const visual = {
		theme:
			typeof srcVisual.theme === 'string' &&
			['sunset', 'night-rain', 'minimal-dark', 'neon-coast'].includes(srcVisual.theme)
				? (srcVisual.theme as KoalaFiState['visual']['theme'])
				: DEFAULT_STATE.visual.theme,
		motion:
			typeof srcVisual.motion === 'string' && ['off', 'calm', 'reactive'].includes(srcVisual.motion)
				? (srcVisual.motion as KoalaFiState['visual']['motion'])
				: DEFAULT_STATE.visual.motion,
		brightness: clamp(safeNum(srcVisual.brightness, DEFAULT_STATE.visual.brightness), 0, 1),
		glow: clamp(safeNum(srcVisual.glow, DEFAULT_STATE.visual.glow), 0, 1)
	};

	return {
		schemaVersion: 1,
		generatorVersion: 3,
		seed,
		presetId,
		title,
		sync: {
			mode: syncMode,
			startedAtUtc
		},
		music,
		ambience,
		visual
	};
}

function clamp(val: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, val));
}

function safeNum(val: unknown, fallback: number): number {
	return typeof val === 'number' && Number.isFinite(val) ? val : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeString(value: unknown, fallback: string, maxLength: number): string {
	if (typeof value !== 'string') return fallback;
	const trimmed = value.trim();
	return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

function optionalString(value: unknown, maxLength: number): string | undefined {
	if (typeof value !== 'string') return undefined;
	const trimmed = value.trim();
	return trimmed ? trimmed.slice(0, maxLength) : undefined;
}
