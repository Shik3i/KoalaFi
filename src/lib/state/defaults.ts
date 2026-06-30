import type { KoalaFiState } from './koalaFiState';

export const DEFAULT_STATE: KoalaFiState = {
	schemaVersion: 1,
	generatorVersion: 1,

	seed: 'koala-vibe',
	presetId: 'sunset-focus',
	title: 'Sunset Focus',

	sync: {
		mode: 'none'
	},

	music: {
		enabled: false,
		bpm: 75,
		key: 'C',
		scale: 'minor',
		focus: 0.5,
		cozy: 0.5,
		sleepy: 0.3,
		jazzy: 0.5,
		energy: 0.4,
		melody: 0.5,
		drums: 0.5,
		bass: 0.5,
		chords: 0.5
	},

	ambience: {
		rain: 0.3,
		ocean: 0.0,
		wind: 0.0,
		vinyl: 0.2,
		whiteNoise: 0.0,
		pinkNoise: 0.0,
		brownNoise: 0.0
	},

	visual: {
		theme: 'sunset',
		motion: 'calm',
		brightness: 0.8,
		glow: 0.5
	}
};
