import { describe, it, expect } from 'vitest';
import { generatePattern } from './generator';
import { DEFAULT_STATE } from '../state/defaults';
import { BUILT_IN_PRESETS } from '../state/presets';
import type { NoteEvent } from './types';

describe('Seeded Pattern Generator v6', () => {
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

		const firstCall = phraseAt(pattern.melody, 24);
		const repeatedCall = phraseAt(pattern.melody, 40);
		expect(firstCall.length).toBeGreaterThanOrEqual(12);
		expect(firstCall.some((event) => parseInt(event.time.split(':')[0], 10) === 25)).toBe(true);
		expect(relativeRhythm(firstCall, 24)).toEqual(relativeRhythm(repeatedCall, 40));
		expect(firstCall.map((event) => event.note)).not.toEqual(
			repeatedCall.map((event) => event.note)
		);

		const intervals = firstCall.slice(1).map((event, index) => {
			return Math.abs(noteToMidi(event.note) - noteToMidi(firstCall[index].note));
		});
		expect(intervals.some((interval) => interval >= 3)).toBe(true);
		expect(Math.max(...intervals)).toBeLessThanOrEqual(12);
	});

	it('starts an articulated audible melody immediately instead of exposing chord drones', () => {
		for (const preset of BUILT_IN_PRESETS.filter(
			(item) => item.state.music.melody > 0.05 && item.state.music.sleepy <= 0.6
		)) {
			const pattern = generatePattern(preset.state.seed, preset.state.music);
			const audible = pattern.melody.filter(
				(event) => (event.gate ?? 0) <= preset.state.music.melody
			);
			const openingPhrase = phraseAt(audible, 0);
			const onsetPositions = relativeRhythm(openingPhrase, 0);
			const gaps = onsetPositions
				.slice(1)
				.map((position, index) => position - onsetPositions[index]);

			expect(openingPhrase.length, preset.name).toBeGreaterThanOrEqual(7);
			expect(
				new Set(openingPhrase.map((event) => event.note)).size,
				preset.name
			).toBeGreaterThanOrEqual(5);
			expect(Math.min(...onsetPositions), preset.name).toBeLessThanOrEqual(2);
			expect(Math.max(...gaps), preset.name).toBeLessThanOrEqual(8);
			expect(
				openingPhrase.every((event) => event.duration === '8n' || event.duration === '16n'),
				preset.name
			).toBe(true);
		}
	});

	it('should generate no drum events or melody events for sleep presets', () => {
		const deepSleep = BUILT_IN_PRESETS.find((p) => p.id === 'deep-sleep')!;
		const pattern = generatePattern(deepSleep.state.seed, deepSleep.state.music);

		expect(pattern.drums.length).toBe(0);
		expect(pattern.melody.length).toBe(0);
	});

	it('creates a syncopated bass groove with real root, fifth and octave movement', () => {
		for (const preset of BUILT_IN_PRESETS.filter(
			(item) => item.state.music.bass > 0.05 && item.state.music.sleepy <= 0.6
		)) {
			const pattern = generatePattern(preset.state.seed, preset.state.music);
			const firstBar = pattern.bassline.filter((event) => event.time.startsWith('0:'));

			expect(firstBar.length, preset.name).toBeGreaterThanOrEqual(4);
			expect(new Set(firstBar.map((event) => event.note)).size, preset.name).toBeGreaterThanOrEqual(
				2
			);
			expect(
				firstBar.some((event) => event.time.endsWith(':3')),
				preset.name
			).toBe(true);
			expect(
				firstBar.every((event) => event.duration === '8n' || event.duration === '16n'),
				preset.name
			).toBe(true);
		}
	});

	it('separates electro four-on-the-floor from the syncopated lo-fi beat', () => {
		const neonCoast = BUILT_IN_PRESETS.find((preset) => preset.id === 'neon-coast')!;
		const dustyCafe = BUILT_IN_PRESETS.find((preset) => preset.id === 'dusty-cafe')!;
		const electro = generatePattern(neonCoast.state.seed, neonCoast.state.music);
		const lofi = generatePattern(dustyCafe.state.seed, dustyCafe.state.music);
		const kicksAtBar = (events: typeof electro.drums, bar: number) =>
			events
				.filter((event) => event.type === 'kick' && event.time.startsWith(`${bar}:`))
				.map((event) => event.time);

		expect(kicksAtBar(electro.drums, 8)).toEqual(['8:0:0', '8:1:0', '8:2:0', '8:3:0']);
		expect(kicksAtBar(lofi.drums, 8)).toContain('8:1:3');
		expect(kicksAtBar(lofi.drums, 8)).not.toContain('8:3:0');
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
		// Melodies now begin in the intro and continue through every non-sleep section.
		expect(intro.melodyCount).toBeGreaterThan(0);
		expect(groove1.melodyCount).toBeGreaterThan(intro.melodyCount);
		expect(melody1.melodyCount).toBeGreaterThan(0);
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
