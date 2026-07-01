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
			generatorVersion: 3,
			seed: 'sunset-focus-seed',
			presetId: 'sunset-focus',
			title: 'Sunset Focus',
			sync: { mode: 'none' },
			music: {
				enabled: false,
				bpm: 72,
				key: 'G',
				scale: 'dorian',
				focus: 0.5,
				cozy: 0.6,
				sleepy: 0.1,
				jazzy: 0.5,
				energy: 0.3,
				melody: 0.25, // Low melody
				drums: 0.35, // Gentle drums
				bass: 0.5, // Audible bass
				chords: 0.6 // Warm chords
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
			generatorVersion: 3,
			seed: 'rainy-coding-seed',
			presetId: 'rainy-coding',
			title: 'Rainy Coding',
			sync: { mode: 'none' },
			music: {
				enabled: false,
				bpm: 78,
				key: 'A',
				scale: 'minor',
				focus: 0.4,
				cozy: 0.7,
				sleepy: 0.1,
				jazzy: 0.4,
				energy: 0.3,
				melody: 0.3, // Low melody
				drums: 0.3, // Gentle beat
				bass: 0.5, // Warm bass
				chords: 0.55 // Warm chords
			},
			ambience: {
				rain: 0.65, // Rain audible but not dominant
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
			generatorVersion: 3,
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
				cozy: 0.8,
				sleepy: 0.2,
				jazzy: 0.8, // Jazzy swing
				energy: 0.4,
				melody: 0.4, // Occasional melody phrase
				drums: 0.4,
				bass: 0.6, // Soft bass movement
				chords: 0.7 // More chord comping
			},
			ambience: {
				rain: 0.0,
				ocean: 0.0,
				wind: 0.0,
				vinyl: 0.5, // Tasteful vinyl
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
			generatorVersion: 3,
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
				melody: 0.0, // No melody
				drums: 0.0, // Less beat-driven
				bass: 0.2, // Minimal bass
				chords: 0.6 // Slow chord movement
			},
			ambience: {
				rain: 0.0,
				ocean: 0.7, // Ocean ambience
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
			generatorVersion: 3,
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
				cozy: 0.9, // Cozy chords
				sleepy: 0.4,
				jazzy: 0.5,
				energy: 0.2,
				melody: 0.3, // Calm melody phrases
				drums: 0.2, // Light beat
				bass: 0.4,
				chords: 0.6
			},
			ambience: {
				rain: 0.3,
				ocean: 0.0,
				wind: 0.2,
				vinyl: 0.3, // Subtle ambience
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
			generatorVersion: 3,
			seed: 'deep-sleep-seed',
			presetId: 'deep-sleep',
			title: 'Deep Sleep',
			sync: { mode: 'none' },
			music: {
				enabled: false,
				bpm: 60,
				key: 'D',
				scale: 'minor',
				focus: 0.1,
				cozy: 0.7,
				sleepy: 0.9, // Very slow movement
				jazzy: 0.2,
				energy: 0.0,
				melody: 0.0, // No distracting melody
				drums: 0.0, // No drums
				bass: 0.2, // Minimal bass
				chords: 0.5 // Soft pads
			},
			ambience: {
				rain: 0.2,
				ocean: 0.1,
				wind: 0.2,
				vinyl: 0.0, // No vinyl pops in sleep
				whiteNoise: 0.0,
				pinkNoise: 0.3,
				brownNoise: 0.7 // Brown noise
			},
			visual: {
				theme: 'minimal-dark',
				motion: 'off',
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
			generatorVersion: 3,
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
				cozy: 0.2, // Subtle pad movement
				sleepy: 1.0,
				jazzy: 0.0,
				energy: 0.0,
				melody: 0.0, // No melody
				drums: 0.0, // No drums
				bass: 0.0,
				chords: 0.2 // Very soft chords
			},
			ambience: {
				rain: 0.0,
				ocean: 0.0,
				wind: 0.0,
				vinyl: 0.0,
				whiteNoise: 0.0,
				pinkNoise: 0.0,
				brownNoise: 0.95 // Heavy brown noise
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
			generatorVersion: 3,
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
				drums: 0.0, // No drums
				bass: 0.0,
				chords: 0.3 // Soft chords
			},
			ambience: {
				rain: 0.8, // Rain-led ambient
				ocean: 0.0,
				wind: 0.2,
				vinyl: 0.2, // Soft vinyl
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
			generatorVersion: 3,
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
				sleepy: 0.7,
				jazzy: 0.3,
				energy: 0.1,
				melody: 0.1, // Minimal melody
				drums: 0.0, // No drums
				bass: 0.1,
				chords: 0.4
			},
			ambience: {
				rain: 0.0,
				ocean: 0.0,
				wind: 0.7, // Gentle wind
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
			generatorVersion: 3,
			seed: 'neon-coast-seed',
			presetId: 'neon-coast',
			title: 'Neon Coast',
			sync: { mode: 'none' },
			music: {
				enabled: false,
				bpm: 85, // More energy
				key: 'D',
				scale: 'minor',
				focus: 0.7,
				cozy: 0.3,
				sleepy: 0.0,
				jazzy: 0.3,
				energy: 0.8, // Synthwave energy
				melody: 0.7, // More melody
				drums: 0.7, // Clear beat
				bass: 0.7, // Audible bass
				chords: 0.7 // More movement
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
