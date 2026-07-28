import { SeededRNG } from './rng';
import { getDiatonicChord, getScaleNotes } from './theory';
import type { NoteEvent, ChordEvent, DrumEvent, SeededPattern } from './types';
import type { KoalaFiState } from '../state/koalaFiState';

type MelodyMotifNote = {
	position: number;
	degreeOffset: number;
	duration: '16n' | '8n' | '8n.' | '4n';
	gate: number;
};

const MELODY_RHYTHMS = [
	[0, 3, 6, 10, 14, 18, 22, 27, 30],
	[2, 4, 7, 12, 16, 19, 23, 26, 29],
	[0, 4, 6, 11, 15, 18, 20, 25, 29],
	[1, 5, 8, 10, 15, 17, 21, 24, 28]
];

const MELODY_CONTOURS = [
	[0, 1, 3, 2, 4, 2, 1, 2, 0],
	[0, 2, 1, 4, 3, 5, 3, 1, 2],
	[0, -1, 1, 3, 2, 4, 1, 2, 0],
	[0, 2, 4, 3, 1, 2, 0, -1, 0]
];

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

	const chords: ChordEvent[] = [];
	const bassline: NoteEvent[] = [];
	const drums: DrumEvent[] = [];
	const melody: NoteEvent[] = [];

	const melodyScaleNotes = [
		...getScaleNotes(key, scale, 4), // Octave 4 lead
		...getScaleNotes(key, scale, 5) // Octave 5 lead
	];
	const scaleLength = getScaleNotes(key, scale, 4).length;
	const callMotif = createMelodyMotif(rng);
	const answerMotif = createAnswerMotif(callMotif, rng);
	let phraseNumber = 0;

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
					chords.push({
						time: `${bar}:0:0`,
						notes: currentChordNotes,
						duration: '2m', // Retrigger every 2 bars to keep motion subtle
						velocity: rng.range(0.35, 0.45)
					});
				}
			} else if (musicState.focus > 0.6) {
				// Focus preset: sparse chords (single stab on beat 0)
				chords.push({
					time: `${bar}:0:0`,
					notes: currentChordNotes,
					duration: '2n',
					velocity: rng.range(0.32, 0.4)
				});
			} else {
				// General / Dusty Café comping: chord stab on beat 0:0, soft repeat on beat 1:2 or 2:2
				const repeatTime = bar % 2 === 0 ? '1:2' : '2:2'; // & of 2 vs & of 3
				// Main stab on beat 0:0
				chords.push({
					time: `${bar}:0:0`,
					notes: currentChordNotes,
					duration: '2n',
					velocity: rng.range(0.42, 0.5)
				});
				// Soft repeat
				if (rng.next() > 0.3) {
					chords.push({
						time: `${bar}:${repeatTime}`,
						notes: currentChordNotes,
						duration: '4n',
						velocity: rng.range(0.28, 0.35)
					});
				}
			}
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
		const isCallStart = barInBlock === 2;
		const isAnswerStart = barInBlock === 6 && section !== 'outro';

		if (hasMelody && melodyActiveSection && (isCallStart || isAnswerStart)) {
			const motif = isAnswerStart ? answerMotif : callMotif;
			melody.push(
				...renderMelodyMotif({
					motif,
					startBar: bar,
					phraseNumber,
					isAnswer: isAnswerStart,
					degrees,
					scaleNotes: melodyScaleNotes,
					scaleLength,
					rng
				})
			);
			phraseNumber += 1;
		}
	}

	return {
		chords,
		bassline,
		drums,
		melody
	};
}

function createMelodyMotif(rng: SeededRNG): MelodyMotifNote[] {
	const rhythm = rng.choice(MELODY_RHYTHMS);
	const contour = rng.choice(MELODY_CONTOURS);
	const peakIndex = contour.indexOf(Math.max(...contour));

	return rhythm.map((position, index) => {
		const gap = (rhythm[index + 1] ?? 32) - position;
		const isStructural = index === 0 || index === peakIndex || index === rhythm.length - 1;

		return {
			position,
			degreeOffset: contour[index],
			duration: durationForGap(gap, rng),
			gate: isStructural ? rng.range(0.03, 0.18) : rng.range(0.2, 0.82)
		};
	});
}

function createAnswerMotif(call: MelodyMotifNote[], rng: SeededRNG): MelodyMotifNote[] {
	let previousPosition = -1;
	const positions = call.map((note, index) => {
		const isLast = index === call.length - 1;
		const rhythmicShift = index > 0 && !isLast ? rng.choice([-1, 0, 0, 1]) : 0;
		const shifted = Math.max(0, Math.min(31, note.position + rhythmicShift));
		const position = Math.min(31, Math.max(previousPosition + 1, shifted));
		previousPosition = position;
		return position;
	});

	return call.map((note, index) => {
		const isLast = index === call.length - 1;
		const mirroredDegree = index < 2 ? note.degreeOffset + 1 : -note.degreeOffset;
		const gap = (positions[index + 1] ?? 32) - positions[index];

		return {
			position: positions[index],
			degreeOffset: isLast ? 0 : mirroredDegree,
			duration: durationForGap(gap, rng),
			gate: isLast ? rng.range(0.03, 0.12) : Math.max(0.08, note.gate - 0.08)
		};
	});
}

function renderMelodyMotif({
	motif,
	startBar,
	phraseNumber,
	isAnswer,
	degrees,
	scaleNotes,
	scaleLength,
	rng
}: {
	motif: MelodyMotifNote[];
	startBar: number;
	phraseNumber: number;
	isAnswer: boolean;
	degrees: number[];
	scaleNotes: string[];
	scaleLength: number;
	rng: SeededRNG;
}): NoteEvent[] {
	const chordIndex = Math.floor((startBar % 8) / 2);
	const chordDegree = degrees[chordIndex] % scaleLength;
	const registerLift = phraseNumber % 4 === 2 ? 2 : phraseNumber % 4 === 3 ? -1 : 0;
	const baseIndex = clamp(chordDegree + registerLift, 1, scaleNotes.length - 6);
	const variationIndex = 2 + (phraseNumber % Math.max(1, motif.length - 3));
	const variationStep = phraseNumber > 1 ? (phraseNumber % 2 === 0 ? 1 : -1) : 0;

	return motif.map((motifNote, index) => {
		const absoluteSixteenth = motifNote.position;
		const targetBar = startBar + Math.floor(absoluteSixteenth / 16);
		const withinBar = absoluteSixteenth % 16;
		const beat = Math.floor(withinBar / 4);
		const sixteenth = withinBar % 4;
		let noteIndex = baseIndex + motifNote.degreeOffset;

		if (index === variationIndex) noteIndex += variationStep;
		if (index === 0 || index === motif.length - 1) {
			const targetDegree = isAnswer && index === motif.length - 1 ? 0 : chordDegree;
			noteIndex = nearestScaleDegree(noteIndex, targetDegree, scaleLength, scaleNotes.length);
		}

		const structural = index === 0 || index === motif.length - 1;
		const velocity = structural ? rng.range(0.42, 0.55) : rng.range(0.24, 0.48);

		return {
			time: `${targetBar}:${beat}:${sixteenth}`,
			note: scaleNotes[clamp(noteIndex, 0, scaleNotes.length - 1)],
			duration: motifNote.duration,
			velocity,
			gate: motifNote.gate
		};
	});
}

function durationForGap(gapInSixteenths: number, rng: SeededRNG): MelodyMotifNote['duration'] {
	if (gapInSixteenths >= 6) return rng.choice(['4n', '8n.']);
	if (gapInSixteenths >= 3) return rng.choice(['8n', '8n.']);
	if (gapInSixteenths <= 1) return '16n';
	return rng.choice(['16n', '8n']);
}

function nearestScaleDegree(
	index: number,
	degree: number,
	scaleLength: number,
	noteCount: number
): number {
	const candidates: number[] = [];
	for (let octave = -1; octave <= 3; octave++) {
		const candidate = degree + octave * scaleLength;
		if (candidate >= 0 && candidate < noteCount) candidates.push(candidate);
	}

	return candidates.reduce((best, candidate) =>
		Math.abs(candidate - index) < Math.abs(best - index) ? candidate : best
	);
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}
