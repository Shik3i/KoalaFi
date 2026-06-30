const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const SCALES = {
	major: [0, 2, 4, 5, 7, 9, 11],
	minor: [0, 2, 3, 5, 7, 8, 10],
	pentatonic: [0, 3, 5, 7, 10], // Pentatonic minor
	dorian: [0, 2, 3, 5, 7, 9, 10]
};

export function getScaleNotes(
	key: string,
	scaleType: keyof typeof SCALES,
	octave: number
): string[] {
	let rootIndex = CHROMATIC.indexOf(key);
	if (rootIndex === -1) {
		// Check if flat spelling
		const mapFlat: Record<string, string> = {
			Db: 'C#',
			Eb: 'D#',
			Gb: 'F#',
			Ab: 'G#',
			Bb: 'A#',
			F: 'F'
		};
		const mapped = mapFlat[key];
		rootIndex = mapped ? CHROMATIC.indexOf(mapped) : 0;
	}

	const intervals = SCALES[scaleType] || SCALES.minor;
	return intervals.map((interval) => {
		const idx = (rootIndex + interval) % 12;
		const octOffset = Math.floor((rootIndex + interval) / 12);
		return `${CHROMATIC[idx]}${octave + octOffset}`;
	});
}

/**
 * Helper to build a 7th/9th chord based on a scale degree (1-7, represented as 0-6 index).
 * Uses standard diatonic thirds stacking.
 */
export function getDiatonicChord(
	key: string,
	scaleType: 'major' | 'minor' | 'dorian' | 'pentatonic',
	degree: number, // 0 to 6
	octave: number,
	add9th = false
): string[] {
	// Pentatonic scale is 5-note, map to minor for diatonic spelling
	const actualScale = scaleType === 'pentatonic' ? 'minor' : scaleType;

	// Get notes over 2 octaves to allow stacking
	const scaleNotesBase = getScaleNotes(key, actualScale, octave);
	const scaleNotesHigh = getScaleNotes(key, actualScale, octave + 1);
	const scaleNotes = [...scaleNotesBase, ...scaleNotesHigh];

	const notes = [
		scaleNotes[degree], // Root
		scaleNotes[degree + 2], // 3rd
		scaleNotes[degree + 4], // 5th
		scaleNotes[degree + 6] // 7th
	];

	if (add9th && scaleNotes[degree + 8]) {
		notes.push(scaleNotes[degree + 8]); // 9th
	}

	return notes;
}
