# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-06-30

### Fixed

- **UI Slider Controls Reactivity**: Fixed a Svelte 5 dependency-tracking bug in `MusicControls` and `AmbienceControls` by deep-tracking the state objects, making all mix, mood, and texture sliders functional.
- **Audio Initialization Race Condition**: Added an initialization promise guard to the audio engine to prevent duplicate audio nodes and phasing effects from rapid clicks.
- **Zen Mode Autoplay**: Fixed Zen Mode play button not initializing audio on clean page load.
- **State Desynchronization**: Removed redundant state reset in `SunPlayer`'s `onMount` that caused audio and UI to desynchronize when toggling Zen Mode.
- **Memory Leaks**: Added failure cleanup in `initializeAudio` to dispose of nodes if startup fails mid-way, and deleted the unused/residual `PlayerCard.svelte` component.

## [0.2.0] - 2026-06-30

### Added

- **Sun-Centered Player UI**: Added a large DOM/CSS sun as the primary play/pause control with status, seed, share, save, tune, vibes, and Zen actions.
- **Responsive Control Docks**: Added collapsible desktop side panels and mobile bottom sheets for vibes and tune controls.
- **Tape Saturation**: Added a subtle distortion/saturation node (`Tone.Distortion`) on the music bus before compression to emulate analog tape warmth.
- **Pitch-Drift LFOs (Wow & Flutter)**: Integrated slow vibrato oscillators into Chords and Melody instruments for organic vintage electric piano drift.
- **Dynamic Filter Sweeps**: Connected a slow LFO to the Melody instrument's lowpass filter for shifting pluck resonance.
- **BPM-Scaled Swing**: Built a deterministic, tempo-scaled timing swing delay (maximum 22% of a sixteenth note) mapped to `state.music.jazzy` to swing off-beats.
- **Deterministic Velocity Humanization**: Created a fast string hash function to apply a subtle, safe volume wobble (±0.04) to note velocities.
- **Synced Wave Cutoffs**: Connected synced dual LFOs to modulate the ocean sound's volume and filter cutoff in tandem for natural swells.
- **UI Error Feedback**: Displayed a clear, user-friendly error message if browser autoplay policy blocks the audio context.

### Changed

- **Canvas/UI Split**: Kept Canvas 2D for the animated background while moving the duplicate interactive sun into the DOM for accessibility and robust layout.
- **Generator Version 2**: Bumped `generatorVersion` from 1 to 2 across presets, defaults, tests, and migrations.
- **Harmonic Chord Spacing**: Replaced root-position block chord spellings with wide open keyboard voicings spanning two octaves.
- **Conjunct Phrasing**: Rewrote the melody generator to use motivic 4-bar rhythm patterns and stepwise scale motion instead of random notes.
- **Soften Noises**: Swapped white noise for pink noise in hi-hats and rain droplets; lowpassed continuous rain at 780Hz; slowed down vinyl crackle checks for sparse record pops.
- **Fades & Transitions**: Smoothed preset volume fades by increasing the transition time constant from 0.1s to 0.8s.

## [0.1.0] - 2026-06-30

### Added

- **Core Architecture**: SvelteKit static adapter build serving compiled client assets.
- **Audio Domain**: Tone.js modular procedural engine generating synths, keys, drums, rain, wind, wave nodes.
- **Deterministic Generator**: Seeded Mulberry32 pattern sequencer generating 64-bar song flows.
- **PWA Integration**: Versioned offline service worker for assets, pages caching.
- **IndexedDB Storage**: Local tables for user presets, general settings, play logs.
- **Share System**: URL-safe compressed Base64 serializer for seeds, plus UTC clock-sync playhead calculations.
- **Visual background**: Canvas 2D animated sunset theme matching Outrun grids, with frames capped at 12-24fps.
- **Deployment**: Multi-stage production Dockerfile and Caddyfile routing templates.
