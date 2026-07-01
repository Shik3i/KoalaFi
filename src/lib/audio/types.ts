export type NoteEvent = {
	time: string; // e.g. "0:0:0" or "0.25"
	note: string; // e.g. "C4"
	duration: string; // e.g. "8n"
	velocity?: number; // e.g. 0.8
	gate?: number; // density gate value (0..1)
};

export type ChordEvent = {
	time: string;
	notes: string[];
	duration: string;
	velocity?: number;
};

export type DrumEvent = {
	time: string;
	type: 'kick' | 'snare' | 'hihat';
	velocity?: number;
};

export type SeededPattern = {
	chords: ChordEvent[]; // Flat array of chord events
	bassline: NoteEvent[];
	melody: NoteEvent[];
	drums: DrumEvent[];
};
