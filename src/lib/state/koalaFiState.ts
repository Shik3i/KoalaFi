export type KoalaFiState = {
	schemaVersion: 1;
	generatorVersion: 3;

	seed: string;
	presetId?: string;
	title?: string;

	sync: {
		mode: 'none' | 'rough-clock';
		startedAtUtc?: string;
	};

	music: {
		enabled: boolean;
		bpm: number;
		key: string;
		scale: 'minor' | 'major' | 'pentatonic' | 'dorian';
		focus: number;
		cozy: number;
		sleepy: number;
		jazzy: number;
		energy: number;
		melody: number;
		drums: number;
		bass: number;
		chords: number;
	};

	ambience: {
		rain: number;
		ocean: number;
		wind: number;
		vinyl: number;
		whiteNoise: number;
		pinkNoise: number;
		brownNoise: number;
	};

	visual: {
		theme: 'sunset' | 'night-rain' | 'minimal-dark' | 'neon-coast';
		motion: 'off' | 'calm' | 'reactive';
		brightness: number;
		glow: number;
	};
};
