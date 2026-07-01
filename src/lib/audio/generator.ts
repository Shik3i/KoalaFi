import { SeededRNG } from './rng';
import { getDiatonicChord, getScaleNotes } from './theory';
import type { NoteEvent, DrumEvent, SeededPattern } from './types';
import type { KoalaFiState } from '../state/koalaFiState';

/**
 * Deterministically generates a 64-bar musical sequence based on seed and state.
 * Structure (64-bar Arrangement):
 * - 0–7: Intro (chords + ambience, minimal beat, e.g. soft kick/snare, no hats).
 * - 8–23: Main groove (full drums + bass + chords).
 * - 24–31: Melody enters (drums + bass + chords + melody phrase).
 * - 32–39: Dropout/reduced drums (no kick, only hats/snare, chords + bass + melody).
 * - 40–55: Full groove returns (drums + bass + chords + melody).
 * - 56–63: Outro/variation (softer chords + bass, lighter melody or drum fills, no hats).
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

	// State tracking for stepwise melody motion
	let lastMelodyIndex = Math.floor(melodyScaleNotes.length / 2);

	// Generate bar-by-bar events for 64 bars
	for (let bar = 0; bar < 64; bar++) {
		const chordIndex = Math.floor((bar % 8) / 2); // 4 chords, each 2 bars

		// Determine arrangement section
		let section: 'intro' | 'groove1' | 'melody1' | 'dropout' | 'groove2' | 'outro';
		if (bar < 8) section = 'intro';
		else if (bar < 24) section = 'groove1';
		else if (bar < 32) section = 'melody1';
		else if (bar < 40) section = 'dropout';
		else if (bar < 56) section = 'groove2';
		else section = 'outro';

		// Determine which parts play based on preset config (e.g. sleepy disables drums)
		const hasDrums = musicState.drums > 0.05 && musicState.sleepy <= 0.6;
		const hasBass = musicState.bass > 0.05;
		const hasMelody = musicState.melody > 0.05 && musicState.sleepy <= 0.6;
		const hasChords = true;

		// A. Generate Chords Events
		if (hasChords) {
			const chordsForBar: NoteEvent[] = [];
			const currentChordNotes = [...chordVoicings[chordIndex]];

			// Apply Drop-2 style voicing transposition deterministic adjustment on alternate bars
			if (bar % 2 === 1 && currentChordNotes.length > 2) {
				// Shift the third of the chord down an octave for subtle texture motion
				const note = currentChordNotes[2];
				const octave = parseInt(note.slice(-1), 10);
				currentChordNotes[2] = note.slice(0, -1) + (octave - 1);
			}

			// If sleepy preset active or in outro, keep it as slow long pads
			if (musicState.sleepy > 0.6) {
				if (bar % 2 === 0) {
					currentChordNotes.forEach((note) => {
						chordsForBar.push({
							time: `${bar}:0:0`,
							note,
							duration: '2m', // Retrigger every 2 bars to keep motion subtle
							velocity: rng.range(0.35, 0.45)
						});
					});
				}
			} else if (musicState.focus > 0.6) {
				// Focus preset: sparse chords (single stab on beat 0)
				currentChordNotes.forEach((note) => {
					chordsForBar.push({
						time: `${bar}:0:0`,
						note,
						duration: '2n',
						velocity: rng.range(0.32, 0.4)
					});
				});
			} else {
				// General / Dusty Café comping: chord stab on beat 0:0, soft repeat on beat 1:2 or 2:2
				const repeatTime = bar % 2 === 0 ? '1:2' : '2:2'; // & of 2 vs & of 3
				currentChordNotes.forEach((note) => {
					// Main stab on beat 0:0
					chordsForBar.push({
						time: `${bar}:0:0`,
						note,
						duration: '2n',
						velocity: rng.range(0.42, 0.5)
					});
					// Soft repeat
					if (rng.next() > 0.3) {
						chordsForBar.push({
							time: `${bar}:${repeatTime}`,
							note,
							duration: '4n',
							velocity: rng.range(0.28, 0.35)
						});
					}
				});
			}
			chords.push(chordsForBar);
		} else {
			chords.push([]);
		}

		// B. Generate Bassline Events
		if (hasBass) {
			const rootNote = chordVoicings[chordIndex][0];
			const bassRoot = rootNote.replace(/[0-9]/g, '2'); // low octave 2
			const bassFifth = chordVoicings[chordIndex][1]
				? chordVoicings[chordIndex][1].replace(/[0-9]/g, '2')
				: bassRoot;
			const bassOctave = rootNote.replace(/[0-9]/g, '3'); // octave 3

			if (musicState.sleepy > 0.6) {
				// Sleep presets: minimal bass, just a root note on beat 0 of bar 0 (every 4 bars)
				if (bar % 4 === 0) {
					bassline.push({
						time: `${bar}:0:0`,
						note: bassRoot,
						duration: '2n',
						velocity: rng.range(0.3, 0.4)
					});
				}
			} else {
				// Main groove bassline: short notes with rests!
				// Hit root near kick at beat 0:0
				bassline.push({
					time: `${bar}:0:0`,
					note: bassRoot,
					duration: '4n', // short note
					velocity: rng.range(0.55, 0.65)
				});

				// Deterministic passing notes with rests (gaps)
				// Occasional fifth/octave passing note
				const bassPatternType = bar % 2;
				if (bassPatternType === 0) {
					// Bar 1: root . . fifth . octave . .
					if (rng.next() > 0.4) {
						bassline.push({
							time: `${bar}:2:0`,
							note: bassFifth,
							duration: '8n',
							velocity: rng.range(0.45, 0.55)
						});
					}
					if (rng.next() > 0.5) {
						bassline.push({
							time: `${bar}:3:0`,
							note: bassOctave,
							duration: '8n',
							velocity: rng.range(0.4, 0.5)
						});
					}
				} else {
					// Bar 2: root . . . fifth . . .
					if (rng.next() > 0.4) {
						bassline.push({
							time: `${bar}:2:0`,
							note: bassFifth,
							duration: '8n',
							velocity: rng.range(0.45, 0.55)
						});
					}
					if (rng.next() > 0.7) {
						bassline.push({
							time: `${bar}:3:2`,
							note: bassRoot,
							duration: '8n',
							velocity: rng.range(0.4, 0.5)
						});
					}
				}
			}
		}

		// C. Generate Drums Events
		if (hasDrums) {
			const isLastBarOfBlock = (bar + 1) % 8 === 0;

			if (section === 'intro' || section === 'outro') {
				// Minimal beat (no hi-hats, soft kick/snare)
				drums.push({ time: `${bar}:0:0`, type: 'kick', velocity: 0.65 });
				drums.push({ time: `${bar}:1:0`, type: 'snare', velocity: 0.55 });
				drums.push({ time: `${bar}:3:0`, type: 'snare', velocity: 0.55 });
			} else if (section === 'dropout') {
				// Reduced section: no kick, only hats and soft snare
				drums.push({ time: `${bar}:1:0`, type: 'snare', velocity: 0.55 });
				drums.push({ time: `${bar}:3:0`, type: 'snare', velocity: 0.55 });
				// Soft hats
				for (let beat = 0; beat < 4; beat++) {
					drums.push({
						time: `${bar}:${beat}:2`,
						type: 'hihat',
						velocity: rng.range(0.2, 0.3)
					});
				}
			} else {
				// Full groove: kick, snare/clap, hats
				// 1. Kick on 1 and 3
				drums.push({ time: `${bar}:0:0`, type: 'kick', velocity: 0.8 });
				drums.push({ time: `${bar}:2:0`, type: 'kick', velocity: 0.7 });

				// Occasional kick before beat 3 or 4 (beat 1:3 or beat 2:3)
				const kickRnd = rng.next();
				if (kickRnd > 0.75) {
					drums.push({ time: `${bar}:1:3`, type: 'kick', velocity: 0.55 });
				} else if (kickRnd > 0.5) {
					drums.push({ time: `${bar}:2:3`, type: 'kick', velocity: 0.55 });
				}

				// 2. Snare
				if (isLastBarOfBlock && rng.next() > 0.5) {
					// Snare fill every 8/16 bars
					drums.push({ time: `${bar}:1:0`, type: 'snare', velocity: 0.65 });
					drums.push({ time: `${bar}:1:2`, type: 'snare', velocity: 0.5 });
					drums.push({ time: `${bar}:2:2`, type: 'snare', velocity: 0.6 });
					drums.push({ time: `${bar}:3:0`, type: 'snare', velocity: 0.5 });
					drums.push({ time: `${bar}:3:2`, type: 'snare', velocity: 0.7 });
				} else {
					drums.push({ time: `${bar}:1:0`, type: 'snare', velocity: 0.7 });
					drums.push({ time: `${bar}:3:0`, type: 'snare', velocity: 0.7 });
				}

				// 3. Hi-hats on off-beats (& of 1, 2, 3, 4)
				for (let beat = 0; beat < 4; beat++) {
					drums.push({
						time: `${bar}:${beat}:2`,
						type: 'hihat',
						velocity: rng.range(0.3, 0.45)
					});

					// Occasional ghost hi-hats on sixteenths 1 or 3
					if (rng.next() > 0.75) {
						const sixteenth = rng.choice([1, 3]);
						drums.push({
							time: `${bar}:${beat}:${sixteenth}`,
							type: 'hihat',
							velocity: rng.range(0.12, 0.2)
						});
					}
				}
			}
		}

		// D. Generate Melody Phrases
		const melodyActiveSection =
			section === 'melody1' ||
			section === 'dropout' ||
			section === 'groove2' ||
			section === 'outro';
		const barInBlock = bar % 8;
		const isPhraseBar = barInBlock === 2 || barInBlock === 3;
		const isAnswerBar = barInBlock === 6 || barInBlock === 7;

		const playMelody =
			hasMelody && melodyActiveSection && (isPhraseBar || (isAnswerBar && section !== 'outro'));

		if (playMelody) {
			const isCorePhrase = isPhraseBar;
			const notesCount = isCorePhrase ? rng.intRange(2, 3) : rng.intRange(1, 2);
			const possibleBeats = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5];
			const selectedBeats = rng.shuffle(possibleBeats).slice(0, notesCount).sort();

			selectedBeats.forEach((beat, idx) => {
				const beatInt = Math.floor(beat);
				const sixteenth = beat % 1 === 0.5 ? 2 : 0;
				const targetTime = `${bar}:${beatInt}:${sixteenth}`;

				// Stepwise scale movement (mostly stepwise, occasional leap)
				const moveRnd = rng.next();
				let step: number;
				if (moveRnd < 0.8) {
					step = rng.choice([-1, 0, 1]); // stepwise
				} else if (moveRnd < 0.95) {
					step = rng.choice([-2, 2]); // small leap
				} else {
					step = rng.choice([-3, 3, -4, 4]); // larger leap
				}

				let nextIndex = lastMelodyIndex + step;
				nextIndex = Math.max(0, Math.min(melodyScaleNotes.length - 1, nextIndex));
				lastMelodyIndex = nextIndex;

				const note = melodyScaleNotes[nextIndex];
				const duration = rng.choice(['4n', '8n', '8n.']);

				// Priority complexity gate
				const gate = rng.next();

				// Clamped velocity for playback:
				// core melody velocity: 0.35–0.55
				// decorative velocity: 0.18–0.32
				// The first note of a phrase is always core. Subsequent notes can be decorative.
				const isCoreNote = idx === 0 || rng.next() > 0.4;
				const velocity = isCoreNote ? rng.range(0.35, 0.55) : rng.range(0.18, 0.32);

				melody.push({
					time: targetTime,
					note,
					duration,
					velocity,
					gate
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
