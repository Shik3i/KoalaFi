export type NoteEvent = {
	time: string; // e.g. "0:0:0" or "0.25"
	note: string; // e.g. "C4"
	duration: string; // e.g. "8n"
	velocity?: number; // e.g. 0.8
};

export type DrumEvent = {
	time: string;
	type: 'kick' | 'snare' | 'hihat';
	velocity?: number;
};

export type SeededPattern = {
	chords: NoteEvent[][]; // chords over bars: [chordIndex][notes]
	bassline: NoteEvent[];
	melody: NoteEvent[];
	drums: DrumEvent[];
};
