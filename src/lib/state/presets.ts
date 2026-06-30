import type { KoalaFiState } from './koalaFiState';

export type PresetCategory = 'focus' | 'relax' | 'sleep' | 'ambient' | 'synthwave';

export type BuiltInPreset = {
	id: string;
	name: string;
	category: PresetCategory;
	state: KoalaFiState;
};

export const BUILT_IN_PRESETS: BuiltInPreset[] = [
	{
		id: 'sunset-focus',
		name: 'Sunset Focus',
		category: 'focus',
		state: {
			schemaVersion: 1,
			generatorVersion: 2,
			seed: 'sunset-focus-seed',
			presetId: 'sunset-focus',
			title: 'Sunset Focus',
			sync: { mode: 'none' },
			music: {
				enabled: false,
				bpm: 72,
				key: 'G',
				scale: 'dorian',
				focus: 0.5, // Soft pluck filter
				cozy: 0.6, // Warm chords
				sleepy: 0.1,
				jazzy: 0.5, // Moderate swing
				energy: 0.3,
				melody: 0.4,
				drums: 0.3, // Quiet steady beat
				bass: 0.5,
				chords: 0.6
			},
			ambience: {
				rain: 0.1,
				ocean: 0.0,
				wind: 0.1,
				vinyl: 0.3,
				whiteNoise: 0.0,
				pinkNoise: 0.1,
				brownNoise: 0.0
			},
			visual: {
				theme: 'sunset',
				motion: 'calm',
				brightness: 0.8,
				glow: 0.6
			}
		}
	},
	{
		id: 'rainy-coding',
		name: 'Rainy Coding',
		category: 'focus',
		state: {
			schemaVersion: 1,
			generatorVersion: 2,
			seed: 'rainy-coding-seed',
			presetId: 'rainy-coding',
			title: 'Rainy Coding',
			sync: { mode: 'none' },
			music: {
				enabled: false,
				bpm: 78,
				key: 'A',
				scale: 'minor',
				focus: 0.4, // Warm plucks
				cozy: 0.7, // Warm lofi chords
				sleepy: 0.1,
				jazzy: 0.4,
				energy: 0.3,
				melody: 0.4, // Stable melody
				drums: 0.35, // Muffled beat
				bass: 0.5,
				chords: 0.5
			},
			ambience: {
				rain: 0.6, // Soothing low rain
				ocean: 0.0,
				wind: 0.2,
				vinyl: 0.4,
				whiteNoise: 0.0,
				pinkNoise: 0.0,
				brownNoise: 0.0
			},
			visual: {
				theme: 'night-rain',
				motion: 'calm',
				brightness: 0.6,
				glow: 0.4
			}
		}
	},
	{
		id: 'dusty-cafe',
		name: 'Dusty Café',
		category: 'focus',
		state: {
			schemaVersion: 1,
			generatorVersion: 2,
			seed: 'dusty-cafe-seed',
			presetId: 'dusty-cafe',
			title: 'Dusty Café',
			sync: { mode: 'none' },
			music: {
				enabled: false,
				bpm: 80,
				key: 'F',
				scale: 'pentatonic',
				focus: 0.5,
				cozy: 0.8, // Very cozy
				sleepy: 0.2,
				jazzy: 0.8, // High swing jazz feel
				energy: 0.4,
				melody: 0.5,
				drums: 0.45,
				bass: 0.6,
				chords: 0.7
			},
			ambience: {
				rain: 0.0,
				ocean: 0.0,
				wind: 0.0,
				vinyl: 0.4, // Dusty crackle present but subtle
				whiteNoise: 0.05,
				pinkNoise: 0.0,
				brownNoise: 0.0
			},
			visual: {
				theme: 'minimal-dark',
				motion: 'calm',
				brightness: 0.5,
				glow: 0.3
			}
		}
	},
	{
		id: 'ocean-calm',
		name: 'Ocean Calm',
		category: 'relax',
		state: {
			schemaVersion: 1,
			generatorVersion: 2,
			seed: 'ocean-calm-seed',
			presetId: 'ocean-calm',
			title: 'Ocean Calm',
			sync: { mode: 'none' },
			music: {
				enabled: false,
				bpm: 65,
				key: 'E',
				scale: 'major',
				focus: 0.3,
				cozy: 0.8,
				sleepy: 0.5,
				jazzy: 0.4,
				energy: 0.1,
				melody: 0.3,
				drums: 0.0, // Beatless ambient pads
				bass: 0.3,
				chords: 0.6
			},
			ambience: {
				rain: 0.0,
				ocean: 0.7, // Rich slow wave swell
				wind: 0.2,
				vinyl: 0.1,
				whiteNoise: 0.0,
				pinkNoise: 0.1,
				brownNoise: 0.1
			},
			visual: {
				theme: 'sunset',
				motion: 'calm',
				brightness: 0.7,
				glow: 0.5
			}
		}
	},
	{
		id: 'warm-window',
		name: 'Warm Window',
		category: 'relax',
		state: {
			schemaVersion: 1,
			generatorVersion: 2,
			seed: 'warm-window-seed',
			presetId: 'warm-window',
			title: 'Warm Window',
			sync: { mode: 'none' },
			music: {
				enabled: false,
				bpm: 70,
				key: 'C',
				scale: 'major',
				focus: 0.3,
				cozy: 0.9, // Super warm chords
				sleepy: 0.4,
				jazzy: 0.5,
				energy: 0.2,
				melody: 0.3, // Sparse melody
				drums: 0.1, // Very sparse rhythmic rimhits
				bass: 0.4,
				chords: 0.6
			},
			ambience: {
				rain: 0.3,
				ocean: 0.0,
				wind: 0.2,
				vinyl: 0.3,
				whiteNoise: 0.0,
				pinkNoise: 0.0,
				brownNoise: 0.0
			},
			visual: {
				theme: 'sunset',
				motion: 'calm',
				brightness: 0.7,
				glow: 0.5
			}
		}
	},
	{
		id: 'deep-sleep',
		name: 'Deep Sleep',
		category: 'sleep',
		state: {
			schemaVersion: 1,
			generatorVersion: 2,
			seed: 'deep-sleep-seed',
			presetId: 'deep-sleep',
			title: 'Deep Sleep',
			sync: { mode: 'none' },
			music: {
				enabled: false,
				bpm: 60,
				key: 'D',
				scale: 'minor',
				focus: 0.1, // Heavily low-passed synth
				cozy: 0.7,
				sleepy: 0.95, // Heavy master roll-off
				jazzy: 0.2,
				energy: 0.0,
				melody: 0.0, // No melody to avoid wake triggers
				drums: 0.0, // Beatless sleep pads
				bass: 0.2,
				chords: 0.5
			},
			ambience: {
				rain: 0.2,
				ocean: 0.1,
				wind: 0.2,
				vinyl: 0.0, // No pops in deep sleep
				whiteNoise: 0.0,
				pinkNoise: 0.3,
				brownNoise: 0.6 // Heavy soothing rumble
			},
			visual: {
				theme: 'minimal-dark',
				motion: 'off', // No movement
				brightness: 0.3,
				glow: 0.2
			}
		}
	},
	{
		id: 'brown-noise-night',
		name: 'Brown Noise Night',
		category: 'sleep',
		state: {
			schemaVersion: 1,
			generatorVersion: 2,
			seed: 'brown-noise-night-seed',
			presetId: 'brown-noise-night',
			title: 'Brown Noise Night',
			sync: { mode: 'none' },
			music: {
				enabled: false,
				bpm: 60,
				key: 'C',
				scale: 'minor',
				focus: 0.0,
				cozy: 0.0,
				sleepy: 1.0,
				jazzy: 0.0,
				energy: 0.0,
				melody: 0.0,
				drums: 0.0,
				bass: 0.0,
				chords: 0.0
			},
			ambience: {
				rain: 0.0,
				ocean: 0.0,
				wind: 0.0,
				vinyl: 0.0,
				whiteNoise: 0.0,
				pinkNoise: 0.0,
				brownNoise: 0.95 // Maximum comfortable sleep noise
			},
			visual: {
				theme: 'minimal-dark',
				motion: 'off',
				brightness: 0.2,
				glow: 0.1
			}
		}
	},
	{
		id: 'soft-rain',
		name: 'Soft Rain',
		category: 'ambient',
		state: {
			schemaVersion: 1,
			generatorVersion: 2,
			seed: 'soft-rain-seed',
			presetId: 'soft-rain',
			title: 'Soft Rain',
			sync: { mode: 'none' },
			music: {
				enabled: false,
				bpm: 72,
				key: 'C',
				scale: 'minor',
				focus: 0.0,
				cozy: 0.5,
				sleepy: 0.5,
				jazzy: 0.0,
				energy: 0.0,
				melody: 0.0,
				drums: 0.0,
				bass: 0.0,
				chords: 0.0
			},
			ambience: {
				rain: 0.7, // Pattering low-passed rain
				ocean: 0.0,
				wind: 0.2, // Warm breeze rumble
				vinyl: 0.2,
				whiteNoise: 0.0,
				pinkNoise: 0.1,
				brownNoise: 0.1
			},
			visual: {
				theme: 'night-rain',
				motion: 'calm',
				brightness: 0.5,
				glow: 0.3
			}
		}
	},
	{
		id: 'wind-down',
		name: 'Wind Down',
		category: 'ambient',
		state: {
			schemaVersion: 1,
			generatorVersion: 2,
			seed: 'wind-down-seed',
			presetId: 'wind-down',
			title: 'Wind Down',
			sync: { mode: 'none' },
			music: {
				enabled: false,
				bpm: 66,
				key: 'F',
				scale: 'dorian',
				focus: 0.2,
				cozy: 0.8,
				sleepy: 0.6,
				jazzy: 0.3,
				energy: 0.1,
				melody: 0.2,
				drums: 0.0,
				bass: 0.2,
				chords: 0.5
			},
			ambience: {
				rain: 0.0,
				ocean: 0.0,
				wind: 0.6, // Soft whistling wind
				vinyl: 0.1,
				whiteNoise: 0.0,
				pinkNoise: 0.3,
				brownNoise: 0.2
			},
			visual: {
				theme: 'sunset',
				motion: 'calm',
				brightness: 0.6,
				glow: 0.4
			}
		}
	},
	{
		id: 'neon-coast',
		name: 'Neon Coast',
		category: 'synthwave',
		state: {
			schemaVersion: 1,
			generatorVersion: 2,
			seed: 'neon-coast-seed',
			presetId: 'neon-coast',
			title: 'Neon Coast',
			sync: { mode: 'none' },
			music: {
				enabled: false,
				bpm: 88, // Upbeat tempo
				key: 'D',
				scale: 'minor',
				focus: 0.6,
				cozy: 0.4,
				sleepy: 0.0,
				jazzy: 0.3,
				energy: 0.7, // Solid synthwave energy
				melody: 0.75, // Bright theme
				drums: 0.7, // Energetic drum triggers
				bass: 0.7,
				chords: 0.7
			},
			ambience: {
				rain: 0.0,
				ocean: 0.2,
				wind: 0.0,
				vinyl: 0.1,
				whiteNoise: 0.05,
				pinkNoise: 0.0,
				brownNoise: 0.0
			},
			visual: {
				theme: 'neon-coast',
				motion: 'reactive',
				brightness: 0.9,
				glow: 0.8
			}
		}
	}
];
