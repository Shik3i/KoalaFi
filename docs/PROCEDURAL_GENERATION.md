# Procedural Generation - KoalaFi (Generator Version 2)

## Deterministic Seeding Strategy

KoalaFi utilizes a custom 32-bit PRNG (Mulberry32) seeded by hashing the user's string seed. This ensures that the generated sequences of chords, drum fills, melody notes, and timing syncopations are identical across all devices and browsers.

## 64-Bar Arrangement Lifecycle

Music sequences are structured over a 64-bar layout divided into distinct sections:

1. **Section A (Bars 0-16)**: Introduction. Chords play simply. Bass follows roots. Drums play standard kick/snare patterns. Melody is sparse.
2. **Section B (Bars 16-32)**: Main Vibe. Chords can play syncopated. Drums add hi-hats. Full melody.
3. **Section A (Bars 32-48)**: Recapitulation.
4. **Section C (Bars 48-64)**: Outro. Ambient keys and sub-bass pad only. Drums drop out entirely.

## Music Theory Constraints (Version 2)

### 1. Spaced Open Chord Voicings

Based on the key and scale, a progression template selects four scale degrees (e.g. `[ii, V, I, IV]` or `[i, iv, VII, v]`). Instead of block chords in root position, KoalaFi v2 spells chords in a wide, spaced keyboard style:

- **Low Register**: Root and 5th (`[degree, degree + 4]`) in octave 3.
- **High Register**: 3rd, 7th, and optional 9th (`[degree + 2, degree + 6, degree + 8]`) shifted up exactly one octave.
  This creates rich, lush jazz harmony and prevents mid-frequency muddy build-ups.

### 2. Cohesive Melody Phrasing & Conjunct Motion

Melodies are generated with a call-and-response structure:

- **Rhythm Templates**: Four distinct 4-bar rhythmic motifs are pre-generated. The song chooses template indices block-by-block, ensuring motifs recur for musical familiarity.
- **Stepwise Conjunct Motion**: Melody notes move stepwise along the scale (moving index by ±0, ±1, or ±2 positions from the last note), simulating natural singable leads.
- **Melody Density Gate**: notes are generated with a priority threshold value in `[0, 1]`, stored in the event `velocity` field. During playback, the scheduler checks:
  `if (event.velocity <= state.music.melody) playNote();`
  This allows on-the-fly density changes without rebuilding the transport.

### 3. Deterministic Micro-Timing Swing

A BPM-scaled micro-timing delay is calculated dynamically for off-beat eighth and sixteenth note events:
`swingOffset = state.music.jazzy * 0.22 * sixteenthNoteDuration`
This shifts off-beats slightly behind the grid to emulate human feel, while remaining 100% deterministic and sync-safe.

### 4. Deterministic Velocity Humanization

To avoid sterile velocities, a fast hash function converts the event's grid time and note name into a unique pseudo-random float value:
`wobble = hash(time, noteName) * 0.08 - 0.04`
This adds a subtle, safe, and deterministic wobble (±0.04) to note trigger velocities.
