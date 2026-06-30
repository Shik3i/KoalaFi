import { SeededRNG } from './rng';
import { getDiatonicChord, getScaleNotes } from './theory';
import type { NoteEvent, DrumEvent, SeededPattern } from './types';
import type { KoalaFiState } from '../state/koalaFiState';

/**
 * Deterministically generates a 64-bar musical sequence based on seed and state.
 * Structure:
 * - 4 chords in a loop (each 2 bars = 8 bar base loop)
 * - Section Intro (Bars 0-8): Ambience, soft chords, sub bass. No drums, no melody.
 * - Section Build (Bars 8-16): Adds light drums (no hats), light melody.
 * - Section Main (Bars 16-32): Full drums (hi-hats), full melody, warm comping.
 * - Section Recap (Bars 32-40): Full drums, melody drops out for first 4 bars, then returns.
 * - Section Breakdown (Bars 40-48): Drums drop out completely. Chords/Melody play softly.
 * - Section Outro (Bars 48-64): Ambient pads, no drums, no melody.
 */
export function generatePattern(seedStr: string, musicState: KoalaFiState['music']): SeededPattern {
	const rng = new SeededRNG(seedStr);
	const { key, scale } = musicState;

	// 1. Pick a chord progression template based on the scale type
	const progressionTemplates = {
		major: [
			[0, 3, 4, 3], // I - IV - V - IV
			[1, 4, 0, 3], // ii - V - I - IV
			[0, 5, 3, 4], // I - vi - IV - V
			[3, 4, 0, 0] // IV - V - I - I
		],
		minor: [
			[0, 3, 6, 4], // i - iv - VII - v
			[0, 5, 2, 6], // i - VI - III - VII
			[0, 3, 5, 4], // i - iv - bVI - v
			[0, 6, 3, 4] // i - VII - iv - v
		],
		dorian: [
			[0, 3, 6, 4], // i - IV - VII - v
			[0, 5, 0, 3], // i - VI - i - IV
			[0, 6, 3, 5] // i - VII - IV - vi
		],
		pentatonic: [
			[0, 2, 3, 2],
			[0, 3, 2, 1],
			[0, 2, 0, 3]
		]
	};

	const templates = progressionTemplates[scale] || progressionTemplates.minor;
	const degrees = rng.choice(templates); // e.g. [0, 3, 6, 4]

	// Spell the 4 base chords
	const chordVoicings: string[][] = [];
	for (let i = 0; i < 4; i++) {
		const deg = degrees[i];
		const add9th = rng.next() > 0.4;
		const chordNotes = getDiatonicChord(key, scale, deg, 3, add9th); // Octave 3 base
		chordVoicings.push(chordNotes);
	}

	const chords: NoteEvent[][] = [];
	const bassline: NoteEvent[] = [];
	const drums: DrumEvent[] = [];
	const melody: NoteEvent[] = [];

	const melodyScaleNotes = [
		...getScaleNotes(key, scale, 4), // Octave 4 lead
		...getScaleNotes(key, scale, 5) // Octave 5 lead
	];

	// Pre-generate 4-bar call-and-response melodic rhythm templates
	const templatesCount = 4;
	const rhythmTemplates: { beats: number[][]; activeBars: boolean[] }[] = [];
	for (let t = 0; t < templatesCount; t++) {
		const beats: number[][] = [];
		const activeBars: boolean[] = [];
		for (let b = 0; b < 4; b++) {
			// Structured phrasing: bar 2 is always a rest (silence) to create breathing room
			if (b === 2) {
				activeBars.push(false);
				beats.push([]);
			} else {
				activeBars.push(rng.next() > 0.35); // ~65% active melody per bar
				const notesCount = rng.intRange(2, 4);
				const possibleBeats = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5];
				const selectedBeats = rng.shuffle(possibleBeats).slice(0, notesCount).sort();
				beats.push(selectedBeats);
			}
		}
		rhythmTemplates.push({ beats, activeBars });
	}

	// State tracking for stepwise melody motion
	let lastMelodyIndex = Math.floor(melodyScaleNotes.length / 2);

	// Generate bar-by-bar events for 64 bars
	for (let bar = 0; bar < 64; bar++) {
		const chordIndex = Math.floor((bar % 8) / 2); // 4 chords, each 2 bars

		// Determine arrangement section
		let section: 'intro' | 'build' | 'main' | 'recap' | 'breakdown' | 'outro';
		if (bar < 8) section = 'intro';
		else if (bar < 16) section = 'build';
		else if (bar < 32) section = 'main';
		else if (bar < 40) section = 'recap';
		else if (bar < 48) section = 'breakdown';
		else section = 'outro';

		let hasDrums = false;
		let hasMelody = false;
		const hasChords = true;
		const hasBass = true;

		switch (section) {
			case 'intro':
				hasDrums = false;
				hasMelody = false;
				break;
			case 'build':
				hasDrums = true;
				hasMelody = rng.next() > 0.5;
				break;
			case 'main':
				hasDrums = true;
				hasMelody = true;
				break;
			case 'recap':
				hasDrums = true;
				hasMelody = bar >= 36; // Melody drops out for the first 4 bars of recap
				break;
			case 'breakdown':
				hasDrums = false;
				hasMelody = rng.next() > 0.3;
				break;
			case 'outro':
				hasDrums = false;
				hasMelody = false;
				break;
		}

		// A. Generate Chords Events
		if (hasChords) {
			const chordsForBar: NoteEvent[] = [];

			// Apply Drop-2 style voicing transposition deterministic adjustment on alternate bars
			const currentChordNotes = [...chordVoicings[chordIndex]];
			if (bar % 2 === 1 && currentChordNotes.length > 2) {
				// Shift the third of the chord down an octave for subtle texture motion
				const note = currentChordNotes[2];
				const octave = parseInt(note.slice(-1), 10);
				currentChordNotes[2] = note.slice(0, -1) + (octave - 1);
			}

			// If sleepy preset active or outro, keep it as static long pads
			if (musicState.sleepy > 0.5 || section === 'outro') {
				currentChordNotes.forEach((note) => {
					chordsForBar.push({
						time: `${bar}:0:0`,
						note,
						duration: '1m',
						velocity: rng.range(0.42, 0.52)
					});
				});
			} else {
				// Gentle rhythmic comping variations based on bar index
				const compingType = bar % 4;
				if (compingType === 0) {
					// Whole note pad
					currentChordNotes.forEach((note) => {
						chordsForBar.push({
							time: `${bar}:0:0`,
							note,
							duration: '1m',
							velocity: rng.range(0.42, 0.52)
						});
					});
				} else if (compingType === 1) {
					// Soft syncopation on beats 0 and 2.5
					currentChordNotes.forEach((note) => {
						chordsForBar.push({
							time: `${bar}:0:0`,
							note,
							duration: '2n',
							velocity: rng.range(0.42, 0.52)
						});
						chordsForBar.push({
							time: `${bar}:2:2`,
							note,
							duration: '4n',
							velocity: rng.range(0.32, 0.42)
						});
					});
				} else if (compingType === 2) {
					// Standard lofi comping on beats 0 and 2
					currentChordNotes.forEach((note) => {
						chordsForBar.push({
							time: `${bar}:0:0`,
							note,
							duration: '2n',
							velocity: rng.range(0.42, 0.52)
						});
						chordsForBar.push({
							time: `${bar}:2:0`,
							note,
							duration: '2n',
							velocity: rng.range(0.35, 0.45)
						});
					});
				} else {
					// Soft off-beat entry on beat 0.5 and beat 3
					currentChordNotes.forEach((note) => {
						chordsForBar.push({
							time: `${bar}:0:2`,
							note,
							duration: '2n.',
							velocity: rng.range(0.38, 0.48)
						});
						chordsForBar.push({
							time: `${bar}:3:0`,
							note,
							duration: '4n',
							velocity: rng.range(0.32, 0.42)
						});
					});
				}
			}
			chords.push(chordsForBar);
		} else {
			chords.push([]);
		}

		// B. Generate Bassline Events
		if (hasBass) {
			const rootNote = chordVoicings[chordIndex][0];
			const bassRoot = rootNote.replace(/[0-9]/g, '2'); // low octave
			const bassFifth = chordVoicings[chordIndex][1]
				? chordVoicings[chordIndex][1].replace(/[0-9]/g, '2')
				: bassRoot;

			if (musicState.sleepy > 0.5 || section === 'outro') {
				// Long static bass notes for sleep/outro
				bassline.push({
					time: `${bar}:0:0`,
					note: bassRoot,
					duration: '1m',
					velocity: rng.range(0.55, 0.65)
				});
			} else {
				// Dynamic walking / syncopated bass rhythm
				const bassRhythm = bar % 4;
				if (bassRhythm === 0) {
					bassline.push({
						time: `${bar}:0:0`,
						note: bassRoot,
						duration: '1m',
						velocity: rng.range(0.55, 0.65)
					});
				} else if (bassRhythm === 1) {
					bassline.push({
						time: `${bar}:0:0`,
						note: bassRoot,
						duration: '2n',
						velocity: rng.range(0.58, 0.68)
					});
					bassline.push({
						time: `${bar}:2:0`,
						note: bassFifth,
						duration: '2n',
						velocity: rng.range(0.5, 0.6)
					});
				} else if (bassRhythm === 2) {
					bassline.push({
						time: `${bar}:0:0`,
						note: bassRoot,
						duration: '2n',
						velocity: rng.range(0.58, 0.68)
					});
					if (rng.next() > 0.45) {
						bassline.push({
							time: `${bar}:2:2`,
							note: bassFifth,
							duration: '4n',
							velocity: rng.range(0.46, 0.56)
						});
					}
				} else {
					bassline.push({
						time: `${bar}:0:0`,
						note: bassRoot,
						duration: '2n.',
						velocity: rng.range(0.58, 0.68)
					});
					bassline.push({
						time: `${bar}:3:0`,
						note: bassFifth,
						duration: '4n',
						velocity: rng.range(0.48, 0.58)
					});
				}
			}
		}

		// C. Generate Drums Events
		if (hasDrums) {
			const isLastBarOfBlock = (bar + 1) % 8 === 0;

			// 1. Kick Drum
			drums.push({ time: `${bar}:0:0`, type: 'kick', velocity: 0.85 });

			const kickRnd = rng.next();
			if (kickRnd > 0.6) {
				drums.push({ time: `${bar}:2:2`, type: 'kick', velocity: 0.65 });
			} else if (kickRnd > 0.35) {
				drums.push({ time: `${bar}:2:0`, type: 'kick', velocity: 0.75 });
			}

			// 2. Snare
			if (isLastBarOfBlock && rng.next() > 0.5) {
				// Snare fill
				drums.push({ time: `${bar}:1:0`, type: 'snare', velocity: 0.65 });
				drums.push({ time: `${bar}:1:2`, type: 'snare', velocity: 0.55 });
				drums.push({ time: `${bar}:2:0`, type: 'snare', velocity: 0.75 });
				drums.push({ time: `${bar}:3:0`, type: 'snare', velocity: 0.45 });
				drums.push({ time: `${bar}:3:2`, type: 'snare', velocity: 0.75 });
			} else {
				drums.push({ time: `${bar}:1:0`, type: 'snare', velocity: 0.75 });
				drums.push({ time: `${bar}:3:0`, type: 'snare', velocity: 0.75 });
			}

			// 3. Hi-hats (Only in main theme/recap, builds energy)
			const playHats = section === 'main' || section === 'recap';
			if (playHats) {
				for (let beat = 0; beat < 4; beat++) {
					drums.push({
						time: `${bar}:${beat}:0`,
						type: 'hihat',
						velocity: rng.range(0.35, 0.55)
					});
					if (rng.next() > 0.3) {
						drums.push({
							time: `${bar}:${beat}:2`,
							type: 'hihat',
							velocity: rng.range(0.2, 0.35)
						});
					}
				}
			}
		}

		// D. Generate Melody Phrases
		if (hasMelody) {
			const blockIndex = Math.floor(bar / 4);
			const barInBlock = bar % 4;

			const templateIdx = Math.floor((rng.next() * templatesCount + blockIndex) % templatesCount);
			const activeTemplate = rhythmTemplates[templateIdx];

			const playMelody = activeTemplate.activeBars[barInBlock];

			if (playMelody) {
				const selectedBeats = activeTemplate.beats[barInBlock];
				selectedBeats.forEach((beat) => {
					const beatInt = Math.floor(beat);
					const sixteenth = beat % 1 === 0.5 ? 2 : 0;
					const targetTime = `${bar}:${beatInt}:${sixteenth}`;

					// Stepwise scale movement (leads move naturally)
					const step = rng.choice([-2, -1, 0, 1, 2]);
					let nextIndex = lastMelodyIndex + step;
					nextIndex = Math.max(0, Math.min(melodyScaleNotes.length - 1, nextIndex));
					lastMelodyIndex = nextIndex;

					const note = melodyScaleNotes[nextIndex];
					const duration = rng.choice(['4n', '8n', '8n.']);
					const priority = rng.next();

					melody.push({
						time: targetTime,
						note,
						duration,
						velocity: priority
					});
				});
			}
		}
	}

	return {
		chords,
		bassline,
		drums,
		melody
	};
}
