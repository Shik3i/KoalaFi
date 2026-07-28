# Procedural Generation - KoalaFi (Generator Version 6)

## Deterministic Seeding Strategy

KoalaFi utilizes a custom 32-bit PRNG (Mulberry32) seeded by hashing the user's string seed. This ensures that the generated sequences of chords, drum fills, melody notes, and timing syncopations are identical across all devices and browsers.

## 64-Bar Arrangement Lifecycle

Music sequences are structured over a deterministic 64-bar layout divided into distinct sections:

1. **Intro (Bars 0-7)**: Short electric-piano chords, a simple bass groove, minimal kick/snare, and the first melodic call-and-response phrase begin immediately.
2. **Main Groove (Bars 8-23)**: The full 16-step lofi beat enters while bass, chord comping, and melodic phrases continue.
3. **Main Variation (Bars 24-31)**: The full groove continues with a transformed melodic register and interior-note variation.
4. **Reduced / Dropout Section (Bars 32-39)**: Reduced energy section. Kick drops out completely, leaving only hi-hats and soft snare/claps. Chords, bass, and melody continue playing.
5. **Full Groove Returns (Bars 40-55)**: Kick re-enters for the final full groove section. All layers (drums, bass, chords, and melody) are active.
6. **Outro / Variation (Bars 56-63)**: Outro section. Hi-hats drop out. Melody becomes lighter. Drums play a minimal beat, fading out into ambient pads.

The arrangement loops cleanly after bar 63.

## Music Theory Constraints (Version 6)

### 1. Spaced Open Chord Voicings

Based on the key and scale, a progression template selects four scale degrees (e.g. `[ii, V, I, IV]` or `[i, iv, VII, v]`). Instead of block chords in root position, KoalaFi spells chords in a wide, spaced keyboard style:

- **Low Register**: Root and 5th (`[degree, degree + 4]`) in octave 3.
- **High Register**: 3rd, 7th, and optional 9th (`[degree + 2, degree + 6, degree + 8]`) shifted up exactly one octave.
  This creates rich, harmony and prevents mid-frequency muddy build-ups.

### 2. Chord Comping

Chords are played using rhythmic comping stabs instead of endless held pads:

- **General / Jazzy Playback**: A chord stab plays on beat 1 (beat 0:0), and a soft repeat plays on the off-beat `&` of beat 2 or 3 (`1:2` or `2:2` sixteenth note offset).
- **Focus Presets**: A short beat-1 stab is answered by a quiet offbeat eighth-note
  chord every other bar.
- **Sleep Presets**: Retain slow pad-style movement, with subtle retriggers every 2 bars.

### 3. Basslines

Basslines are structured grooves rather than a continuous sub drone:

- Bass notes use `8n` roots and `16n` passing tones with explicit rests.
- Lo-fi states play four syncopated root/fifth/octave attacks per bar.
- High-energy electronic states play five driving root/fifth/octave attacks per bar.
- Passing tones use the actual chord fifth rather than the third.
- Sleep presets use minimal bass (a single root note every 4 bars).

### 4. Drums

Lo-fi drums are sequenced on a 16-step grid per bar:

```txt
1 e & a 2 e & a 3 e & a 4 e & a
K . h . S . h . K . h . S . h .
```

- **Kick (K)** plays on beats 1 and 3. A fixed syncopated ghost kick alternates
  between the end of beats 2 and 3.
- **Snare (S)** plays on beats 2 and 4. A subtle organic snare fill is triggered every 8 bars.
- **Hi-hat (h)** plays on the offbeat eighth note (`&`). Occasional quiet ghost hi-hats trigger on sixteenths 1 or 3.
- **Sleep / Ambient Presets** disable or severely reduce drums to prevent waking/distraction.

High-energy states (`energy >= 0.65`) switch to a separate electronic grid:

```txt
1 e & a 2 e & a 3 e & a 4 e & a
K . h . K . h . K . h . K . h .
```

Snares reinforce beats 2 and 4, and every eighth bar adds a short deterministic fill.

### 5. Motivic Melody Phrasing, Contour & Variation

Melodies are phrase-based, articulated, and present from the opening bar:

- **Phrasing blocks**: Every 8-bar block begins with a 13-note two-bar call. A
  transformed two-bar answer begins at bar 5, leaving two bars of breathing room
  after each phrase.
- **Motivic identity**: Each seed selects one syncopated rhythm and one pitch contour.
  Later calls retain the rhythm while changing register or one interior tone, making
  the melody recognizable without becoming a static loop.
- **Call and response**: The answer mirrors the call contour, shifts selected attacks,
  and resolves its final note toward the tonic.
- **Harmony and range**: Phrase starts and endings snap to scale degrees related to the
  current chord. Constrained register movement spans octaves 4-5, with stepwise motion,
  controlled thirds/fourths, and no jump larger than one octave.
- **Articulation**: Lead notes are limited to `16n` and `8n`; the short pluck envelope
  prevents adjacent pitches from turning into held-note drones.
- **Velocities & Complexity Gate**: Notes have a complexity gate parameter (`gate` in `[0, 1]`) and a trigger velocity. During playback, the scheduler gates notes by checking `if (event.gate <= state.music.melody)`.
  - **Seven structural notes per phrase** use `gate = 0`, so even a low melody setting
    preserves a recognizable phrase instead of reducing it to isolated tones.
  - **Decorative notes** have progressively higher gate values and a velocity of `0.24–0.48`.
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
