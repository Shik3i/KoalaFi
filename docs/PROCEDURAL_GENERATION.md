# Procedural Generation - KoalaFi

## Deterministic Seeding Strategy

KoalaFi utilizes a custom 32-bit PRNG (Mulberry32) seeded by hashing the user's string seed. This ensures that the generated sequences of chords, drum fills, melody notes, and timing syncopations are identical across all devices and browsers.

## 64-Bar Arrangement Lifecycle

Music sequences are structured over a 64-bar layout divided into distinct sections:

1. **Section A (Bars 0-16)**: Introduction. Chords play simply. Bass follows roots. Drums play standard kick/snare patterns. Melody is sparse.
2. **Section B (Bars 16-32)**: Main Vibe. Chords can play syncopated. Drums add hi-hats. Full melody.
3. **Section A (Bars 32-48)**: Recapitulation.
4. **Section C (Bars 48-64)**: Outro. Ambient keys and sub-bass pad only. Drums drop out entirely.

## Music Theory Constraints

### 1. Chord Spellings

Based on the key and scale, a progression template selects four scale degrees (e.g. `[ii, V, I, IV]` or `[i, iv, VII, v]`). Diatonic seventh and ninth chords are formulated by stacking thirds:
`[degree, degree + 2, degree + 4, degree + 6, degree + 8]`.

### 2. Melody Complexity Gate

To allow real-time changes to the melody slider without breaking determinism, melody notes are pre-generated with a priority threshold value in `[0, 1]`, stored in the event `velocity` field. During playback, the scheduler checks:
`if (event.velocity <= state.music.melody) playNote();`
This keeps the event loop stable and allows the user to filter melody density on-the-fly.

### 3. Drum Fills & Ghost Notes

On the 8th bar of each block (e.g. bar 7, 15, 23), the generator adds additional snare hits at double speed and drops hi-hats to create natural drum fills.
