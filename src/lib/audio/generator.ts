import { SeededRNG } from './rng';
import { getDiatonicChord, getScaleNotes } from './theory';
import type { NoteEvent, DrumEvent, SeededPattern } from './types';
import type { KoalaFiState } from '../state/koalaFiState';

/**
 * Deterministically generates a 64-bar musical sequence based on seed and state.
 * Structure:
 * - 4 chords in a loop (each 2 bars = 8 bar base loop)
 * - Section A (Bars 0-16): Intro, light chords, bass, basic drums, sparse melody
 * - Section B (Bars 16-32): Main theme, full chords, bass, full drums, full melody
 * - Section A (Bars 32-48): Recapitulation
 * - Section C (Bars 48-64): Outro, warm chords, sub bass, no drums, ambient melody
 */
export function generatePattern(seedStr: string, musicState: KoalaFiState['music']): SeededPattern {
	const rng = new SeededRNG(seedStr);
	const { key, scale } = musicState;

	// 1. Pick a chord progression template based on the scale type
	const progressionTemplates = {
		major: [
			[0, 3, 4, 3], // I - IV - V - IV (0-indexed scale degrees)
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

	// Spell the 4 chords. Chords will repeat in an 8-bar loop.
	// We stack thirds to build 7th or 9th chords.
	const chordVoicings: string[][] = [];
	for (let i = 0; i < 4; i++) {
		const deg = degrees[i];
		// Jazzy chords: use 7th/9th stacking. Add 9th depending on rng.
		const add9th = rng.next() > 0.4;
		const chordNotes = getDiatonicChord(key, scale, deg, 3, add9th); // Octave 3
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

	// Generate bar-by-bar events for 64 bars
	for (let bar = 0; bar < 64; bar++) {
		// 8-bar loop indices
		const chordIndex = Math.floor((bar % 8) / 2); // 4 chords, each 2 bars
		const currentChordNotes = chordVoicings[chordIndex];

		// Determine arrangement section
		let section: 'A' | 'B' | 'C' = 'A';
		if (bar >= 16 && bar < 32) section = 'B';
		else if (bar >= 48) section = 'C';

		// A. Generate Chords Events
		// Chords play once per bar, or twice per bar (syncopated)
		const playChords = () => {
			const chordsForBar: NoteEvent[] = [];
			const chordRhythm = rng.next();

			// Let's create a chord trigger event
			// Duration is 1 bar or 2 beats
			if (chordRhythm > 0.4 || section === 'C') {
				// Whole note chord
				currentChordNotes.forEach((note) => {
					chordsForBar.push({
						time: `${bar}:0:0`,
						note,
						duration: '1m',
						velocity: rng.range(0.4, 0.6)
					});
				});
			} else {
				// Two syncopated chord hits
				currentChordNotes.forEach((note) => {
					chordsForBar.push({
						time: `${bar}:0:0`,
						note,
						duration: '2n',
						velocity: rng.range(0.4, 0.6)
					});
					chordsForBar.push({
						time: `${bar}:2:0`,
						note,
						duration: '2n',
						velocity: rng.range(0.3, 0.5)
					});
				});
			}
			chords.push(chordsForBar);
		};
		playChords();

		// B. Generate Bassline Events
		// Bass plays chord root or fifths
		const rootNote = currentChordNotes[0]; // First note is root
		// Convert root note to lower octave (octave 2)
		const bassRoot = rootNote.replace(/[0-9]/g, '2');
		const bassFifth = currentChordNotes[2] ? currentChordNotes[2].replace(/[0-9]/g, '2') : bassRoot;

		const playBass = () => {
			const bassRhythm = rng.next();
			if (bassRhythm > 0.5 || section === 'C') {
				// Simple long bass note
				bassline.push({
					time: `${bar}:0:0`,
					note: bassRoot,
					duration: '1m',
					velocity: rng.range(0.5, 0.7)
				});
			} else {
				// Rhythmic walking bass / syncopation
				bassline.push({
					time: `${bar}:0:0`,
					note: bassRoot,
					duration: '2n',
					velocity: rng.range(0.6, 0.8)
				});

				// Maybe play fifth on beat 2.5
				if (rng.next() > 0.4) {
					bassline.push({
						time: `${bar}:2:2`,
						note: bassFifth,
						duration: '4n',
						velocity: rng.range(0.5, 0.7)
					});
				}
			}
		};
		playBass();

		// C. Generate Drums Events
		// Section C has no drums (ambient outro)
		if (section !== 'C') {
			const isLastBarOfBlock = (bar + 1) % 8 === 0;

			// 1. Kick Drum
			drums.push({ time: `${bar}:0:0`, type: 'kick', velocity: 0.9 });

			// Syncopated kicks
			const kickRnd = rng.next();
			if (kickRnd > 0.6) {
				drums.push({ time: `${bar}:2:2`, type: 'kick', velocity: 0.7 });
			} else if (kickRnd > 0.3) {
				drums.push({ time: `${bar}:2:0`, type: 'kick', velocity: 0.8 });
			}

			// 2. Snare / Clap (on 2 and 4)
			if (isLastBarOfBlock && rng.next() > 0.5) {
				// Last bar fill snare rolls!
				drums.push({ time: `${bar}:1:0`, type: 'snare', velocity: 0.7 });
				drums.push({ time: `${bar}:1:2`, type: 'snare', velocity: 0.6 });
				drums.push({ time: `${bar}:2:0`, type: 'snare', velocity: 0.8 });
				drums.push({ time: `${bar}:3:0`, type: 'snare', velocity: 0.5 });
				drums.push({ time: `${bar}:3:2`, type: 'snare', velocity: 0.8 });
			} else {
				drums.push({ time: `${bar}:1:0`, type: 'snare', velocity: 0.8 });
				drums.push({ time: `${bar}:3:0`, type: 'snare', velocity: 0.8 });
			}

			// 3. Hi-hats
			// Hi-hats on 8th notes, with a slight swing / velocity variation
			const playHats = section === 'B' || rng.next() > 0.3;
			if (playHats) {
				for (let beat = 0; beat < 4; beat++) {
					drums.push({ time: `${bar}:${beat}:0`, type: 'hihat', velocity: rng.range(0.4, 0.6) });
					// Off-beat hats
					if (rng.next() > 0.2) {
						drums.push({ time: `${bar}:${beat}:2`, type: 'hihat', velocity: rng.range(0.2, 0.4) });
					}
				}
			}
		}

		// D. Generate Melody Phrases
		// Let's create melodies! We want melodies that are pleasant and not too dense.
		const isMelodicBar = section === 'B' ? rng.next() > 0.2 : rng.next() > 0.5;
		if (isMelodicBar) {
			const melodyNotesCount = rng.intRange(2, 5);
			const possibleBeats = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5];
			const selectedBeats = rng.shuffle(possibleBeats).slice(0, melodyNotesCount).sort();

			selectedBeats.forEach((beat) => {
				const beatInt = Math.floor(beat);
				const sixteenth = beat % 1 === 0.5 ? 2 : 0;
				const targetTime = `${bar}:${beatInt}:${sixteenth}`;

				// Select a melody note from scale.
				// We often target chord tones (notes in the chord) to sound consonant.
				let note: string;
				if (rng.next() > 0.4) {
					// Play a scale note
					note = rng.choice(melodyScaleNotes);
				} else {
					// Play a chord note in a higher octave
					const chordNote = rng.choice(currentChordNotes);
					note = chordNote.replace(/[0-9]/g, '4'); // Map to octave 4
					if (rng.next() > 0.5) note = note.replace('4', '5'); // Or octave 5
				}

				// Store a "priority" in velocity (we will use this in playback to control note density based on the melody slider)
				// Note: we can use a custom property or just standard fields, let's use velocity as priority threshold.
				// If we assign a priority float in [0, 1] as velocity, then:
				// when playing, we only trigger the note if `musicState.melody >= note.velocity`.
				// This is perfectly deterministic and allows real-time slider control!
				const priority = rng.next(); // 0 to 1

				melody.push({
					time: targetTime,
					note,
					duration: rng.choice(['4n', '8n', '8n.']),
					velocity: priority // mapped as priority threshold
				});
			});
		}
	}

	return {
		chords,
		bassline,
		drums,
		melody
	};
}
