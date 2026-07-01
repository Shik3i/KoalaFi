# Procedural Generation - KoalaFi (Generator Version 3)

## Deterministic Seeding Strategy

KoalaFi utilizes a custom 32-bit PRNG (Mulberry32) seeded by hashing the user's string seed. This ensures that the generated sequences of chords, drum fills, melody notes, and timing syncopations are identical across all devices and browsers.

## 64-Bar Arrangement Lifecycle

Music sequences are structured over a deterministic 64-bar layout divided into distinct sections:

1. **Intro (Bars 0-7)**: Intro section. Chords play simply. Bass plays simple roots. Drums play a minimal kick/snare pattern (no hi-hats). Melody is silent.
2. **Main Groove (Bars 8-23)**: The full groove enters. Drums play the complete 16-step lofi beat. Bass plays a walking pattern. Chords comp rhythmically. Melody is silent.
3. **Melody Phrase Enters (Bars 24-31)**: The melody lead enters. Drums, bass, and chords continue their groove while the melody phrase triggers call-and-response segments.
4. **Reduced / Dropout Section (Bars 32-39)**: Reduced energy section. Kick drops out completely, leaving only hi-hats and soft snare/claps. Chords, bass, and melody continue playing.
5. **Full Groove Returns (Bars 40-55)**: Kick re-enters for the final full groove section. All layers (drums, bass, chords, and melody) are active.
6. **Outro / Variation (Bars 56-63)**: Outro section. Hi-hats drop out. Melody becomes lighter. Drums play a minimal beat, fading out into ambient pads.

The arrangement loops cleanly after bar 63.

## Music Theory Constraints (Version 3)

### 1. Spaced Open Chord Voicings

Based on the key and scale, a progression template selects four scale degrees (e.g. `[ii, V, I, IV]` or `[i, iv, VII, v]`). Instead of block chords in root position, KoalaFi spells chords in a wide, spaced keyboard style:

- **Low Register**: Root and 5th (`[degree, degree + 4]`) in octave 3.
- **High Register**: 3rd, 7th, and optional 9th (`[degree + 2, degree + 6, degree + 8]`) shifted up exactly one octave.
  This creates rich, harmony and prevents mid-frequency muddy build-ups.

### 2. Chord Comping

Chords are played using rhythmic comping stabs instead of endless held pads:

- **General / Jazzy Playback**: A chord stab plays on beat 1 (beat 0:0), and a soft repeat plays on the off-beat `&` of beat 2 or 3 (`1:2` or `2:2` sixteenth note offset).
- **Focus Presets**: Stabs are sparse (single stab on beat 1) and low velocity.
- **Sleep Presets**: Retain slow pad-style movement, with subtle retriggers every 2 bars.

### 3. Basslines

Basslines are structured grooves rather than a continuous sub drone:

- Bass notes play short durations (e.g. `4n` and `8n` with rests) to create musical space.
- A root note triggers near the kick (beat 0:0).
- Deterministic fifth/octave passing notes are played on beats 2 and 3 with gaps/rests.
- Sleep presets use minimal bass (a single root note every 4 bars).

### 4. Drums

Drums are sequenced on a 16-step grid per bar:

```txt
1 e & a 2 e & a 3 e & a 4 e & a
K . h . S . h . K . h . S . h .
```

- **Kick (K)** plays on beats 1 and 3. An occasional kick triggers before beat 3 or 4 using deterministic RNG.
- **Snare (S)** plays on beats 2 and 4. A subtle organic snare fill is triggered every 8 bars.
- **Hi-hat (h)** plays on the offbeat eighth note (`&`). Occasional quiet ghost hi-hats trigger on sixteenths 1 or 3.
- **Sleep / Ambient Presets** disable or severely reduce drums to prevent waking/distraction.

### 5. Cohesive Melody Phrasing & Conjunct Motion

Melodies are phrase-based with rests in between:

- **Phrasing blocks**: Over an 8-bar block, melody is silent for bars 1-2, plays a short 4-6 note phrase in bars 3-4, rests in bars 5-6, and plays a shorter answer phrase in bars 7-8.
- **Stepwise Conjunct Motion**: Melody notes move stepwise along the scale (80% stepwise index motion of ±0 or ±1, 15% step of ±2, 5% leap of ±3 or ±4).
- **Velocities & Complexity Gate**: Notes have a complexity gate parameter (`gate` in `[0, 1]`) and a trigger velocity. During playback, the scheduler gates notes by checking `if (event.gate <= state.music.melody)`.
  - **Core notes** have a velocity of `0.35–0.55`.
  - **Decorative notes** have a velocity of `0.18–0.32`.
  - Decorative notes are quieter than core notes, and all velocities are safely clamped to avoid sudden spikes.
- **Sleep Presets** generate zero melody events.

### 6. Deterministic Micro-Timing Swing

A BPM-scaled micro-timing delay is calculated dynamically for off-beat eighth and sixteenth note events:
`swingOffset = state.music.jazzy * 0.22 * sixteenthNoteDuration`
This shifts off-beats slightly behind the grid to emulate human feel, while remaining 100% deterministic and sync-safe.

### 7. Deterministic Velocity Humanization

To avoid sterile velocities, a fast hash function converts the event's grid time and note name into a unique pseudo-random float value:
`wobble = hash(time, noteName) * 0.08 - 0.04`
This adds a subtle, safe, and deterministic wobble (±0.04) to note trigger velocities.
