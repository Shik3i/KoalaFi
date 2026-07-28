import { describe, it, expect } from 'vitest';
import { generatePattern } from './generator';
import { DEFAULT_STATE } from '../state/defaults';
import { BUILT_IN_PRESETS } from '../state/presets';
import type { NoteEvent } from './types';

describe('Seeded Pattern Generator v4', () => {
	it('should generate identical patterns for the same seed and state', () => {
		const first = generatePattern('test-seed-xyz', DEFAULT_STATE.music);
		const second = generatePattern('test-seed-xyz', DEFAULT_STATE.music);

		expect(first).toEqual(second);
	});

	it('should generate different patterns for different seeds', () => {
		const first = generatePattern('seed-1', DEFAULT_STATE.music);
		const second = generatePattern('seed-2', DEFAULT_STATE.music);

		expect(first).not.toEqual(second);
	});

	it('should contain events within the expected 64-bar loop bounds', () => {
		const pattern = generatePattern('loop-bound-seed', DEFAULT_STATE.music);

		const allEvents = [...pattern.bassline, ...pattern.drums, ...pattern.melody, ...pattern.chords];

		allEvents.forEach((event) => {
			const bar = parseInt(event.time.split(':')[0], 10);
			expect(bar).toBeGreaterThanOrEqual(0);
			expect(bar).toBeLessThan(64);
		});
	});

	it('should keep all velocities within safe bounds (0.0 to 1.0)', () => {
		const pattern = generatePattern('velocity-seed', DEFAULT_STATE.music);

		const allEvents = [...pattern.bassline, ...pattern.drums, ...pattern.melody, ...pattern.chords];

		allEvents.forEach((event) => {
			if (event.velocity !== undefined) {
				expect(event.velocity).toBeGreaterThanOrEqual(0);
				expect(event.velocity).toBeLessThanOrEqual(1.0);
			}
		});
	});

	it('should generate drums, bass, and chords for music-enabled presets', () => {
		// Sunset Focus preset retuned
		const sunsetFocus = BUILT_IN_PRESETS.find((p) => p.id === 'sunset-focus')!;
		const pattern = generatePattern(sunsetFocus.state.seed, sunsetFocus.state.music);

		expect(pattern.drums.length).toBeGreaterThan(0);
		expect(pattern.bassline.length).toBeGreaterThan(0);
		expect(pattern.chords.length).toBeGreaterThan(0);

		// Verify drums contain kick, snare, and hihat
		const drumTypes = new Set(pattern.drums.map((d) => d.type));
		expect(drumTypes.has('kick')).toBe(true);
		expect(drumTypes.has('snare')).toBe(true);
		expect(drumTypes.has('hihat')).toBe(true);
	});

	it('should generate melody phrase events when melody level is enabled', () => {
		const neonCoast = BUILT_IN_PRESETS.find((p) => p.id === 'neon-coast')!;
		const pattern = generatePattern(neonCoast.state.seed, neonCoast.state.music);

		expect(pattern.melody.length).toBeGreaterThan(0);

		// Check melody note velocity boundaries
		// core melody velocity: 0.35–0.55
		// decorative velocity: 0.18–0.32
		pattern.melody.forEach((event) => {
			expect(event.velocity).toBeGreaterThanOrEqual(0.18);
			expect(event.velocity).toBeLessThanOrEqual(0.55);
		});
	});

	it('should build recognizable two-bar motifs with pitch contour and variation', () => {
		const neonCoast = BUILT_IN_PRESETS.find((p) => p.id === 'neon-coast')!;
		const pattern = generatePattern(neonCoast.state.seed, neonCoast.state.music);
		const audibleMelody = pattern.melody.filter(
			(event) => (event.gate ?? 0) <= neonCoast.state.music.melody
		);
		const pitches = audibleMelody.map((event) => noteToMidi(event.note));

		expect(new Set(pitches).size).toBeGreaterThanOrEqual(7);
		expect(Math.max(...pitches) - Math.min(...pitches)).toBeGreaterThanOrEqual(12);

		const firstCall = phraseAt(pattern.melody, 26);
		const repeatedCall = phraseAt(pattern.melody, 42);
		expect(firstCall.length).toBeGreaterThanOrEqual(8);
		expect(firstCall.some((event) => parseInt(event.time.split(':')[0], 10) === 27)).toBe(true);
		expect(relativeRhythm(firstCall, 26)).toEqual(relativeRhythm(repeatedCall, 42));
		expect(firstCall.map((event) => event.note)).not.toEqual(
			repeatedCall.map((event) => event.note)
		);

		const intervals = firstCall.slice(1).map((event, index) => {
			return Math.abs(noteToMidi(event.note) - noteToMidi(firstCall[index].note));
		});
		expect(intervals.some((interval) => interval >= 3)).toBe(true);
		expect(Math.max(...intervals)).toBeLessThanOrEqual(12);
	});

	it('should generate no drum events or melody events for sleep presets', () => {
		const deepSleep = BUILT_IN_PRESETS.find((p) => p.id === 'deep-sleep')!;
		const pattern = generatePattern(deepSleep.state.seed, deepSleep.state.music);

		expect(pattern.drums.length).toBe(0);
		expect(pattern.melody.length).toBe(0);
	});

	it('should verify 64-bar arrangement sections differ in musical density', () => {
		const sunsetFocus = BUILT_IN_PRESETS.find((p) => p.id === 'sunset-focus')!;
		const pattern = generatePattern(sunsetFocus.state.seed, sunsetFocus.state.music);

		// Helper to filter events by bar range
		const countEvents = (startBar: number, endBar: number) => {
			const drumCount = pattern.drums.filter((e) => {
				const bar = parseInt(e.time.split(':')[0], 10);
				return bar >= startBar && bar < endBar;
			}).length;

			const melodyCount = pattern.melody.filter((e) => {
				const bar = parseInt(e.time.split(':')[0], 10);
				return bar >= startBar && bar < endBar;
			}).length;

			return { drumCount, melodyCount };
		};

		// Intro (bars 0-7): minimal beat (soft kick/snare, no hats), no melody
		const intro = countEvents(0, 8);
		// Main groove (bars 8-23): full groove, no melody
		const groove1 = countEvents(8, 24);
		// Melody enters (bars 24-31): full groove + melody
		const melody1 = countEvents(24, 32);
		// Dropout (bars 32-39): reduced drums (no kick, only hats/snare) + melody
		const dropout = countEvents(32, 40);

		// Assertions:
		// Groove 1 has more drum events than intro because of hi-hats
		expect(groove1.drumCount).toBeGreaterThan(intro.drumCount);
		// Melody 1 has melody notes, Groove 1 has zero melody notes
		expect(melody1.melodyCount).toBeGreaterThan(0);
		expect(groove1.melodyCount).toBe(0);
		// Dropout section has fewer drum events than Melody 1 (no kick)
		expect(dropout.drumCount).toBeLessThan(melody1.drumCount);
		expect(dropout.drumCount).toBeGreaterThan(0); // Still has hats/snare
	});
});

function phraseAt(events: NoteEvent[], startBar: number): NoteEvent[] {
	return events.filter((event) => {
		const bar = parseInt(event.time.split(':')[0], 10);
		return bar === startBar || bar === startBar + 1;
	});
}

function relativeRhythm(events: { time: string }[], startBar: number): number[] {
	return events.map((event) => {
		const [bar, beat, sixteenth] = event.time.split(':').map(Number);
		return (bar - startBar) * 16 + beat * 4 + sixteenth;
	});
}

function noteToMidi(note: string): number {
	const match = /^([A-G])(#?)(-?\d+)$/.exec(note);
	if (!match) throw new Error(`Invalid note: ${note}`);
	const pitchClass = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[match[1] as 'C'];
	return (Number(match[3]) + 1) * 12 + pitchClass + (match[2] === '#' ? 1 : 0);
}
