# Product Specification - KoalaFi

## Overview

KoalaFi is a web-based, endless generator of relaxing lofi beats, ambient noises, and immersive soundscapes designed for focus, relaxation, and sleep. v0.1 runs entirely inside modern web browsers with local bundled assets, keeping execution private and offline-capable.

## Core Vibe Cases

### 1. Focus (e.g. Sunset Focus, Rainy Coding)

- **Acoustic profile**: Slow chord progressions, lowpass lead synths that don't distract, steady rhythms around 65-80 BPM, and vinyl noise/rain crackles that form a masking layer for background distractions.
- **Visuals**: Static or calm drifting warm horizons (Sunset/Night Rain) which set a relaxing ambient workspace backdrop.

### 2. Relax (e.g. Ocean Calm, Warm Window)

- **Acoustic profile**: Slow musical tempos, synthesized soft keys, gentle bass, and rolling ocean waves that ebb and flow on low-frequency cycles.
- **Visuals**: Deep crimson sunset reflection ripples drifting calmly.

### 3. Sleep (e.g. Deep Sleep, Brown Noise Night)

- **Acoustic profile**: Dropping drum percussion and hi-hats, sub-bass notes that rumble gently, heavy brown noise mimicking waterfalls, and heavily filtered low-frequency keys.
- **Visuals**: Zero animation (Motion Off) and dark zinc themes with minimal glow to prevent screen emission keeping users awake.

## Sharing & Presets

- **Local Presets**: Save, rename, delete custom combinations of volumes, BPMs, keys, and visual preferences.
- **Link Sharing**: Share a base64 URL representing the state parameters.
- **Rough Clock Sync**: Listen together by aligning playback positions to the UTC clock. This is approximate and not sample-perfect.

## Player Experience

- **Default Surface**: Minimal sun-centered player with title/status text and one Controls trigger.
- **Controls**: Vibes, Tune, Share, Save, and Zen live behind the Controls popover instead of permanent action rows.
- **Panels**: Desktop panels dock around the sun; mobile panels become bottom sheets.
- **Zen**: A cleaner version of the same scene. The sun remains visible and playable.
- **Visual Tone**: Warm sunset palette, clean sun disc, subtle water/reflection, no harsh dev-tool cyan branding.
