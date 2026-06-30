# Development Roadmap - KoalaFi

## v0.1.0 — Architecture & Foundation (Current Release)

- SvelteKit static application layout.
- Tone.js audio synthesizers, master effects chain.
- Seeded, deterministic 64-bar pattern generator.
- IndexedDB storage for presets and logs.
- PWA service worker offline-first setup.
- Docker & Caddy production setups.
- Basic test suites for RNG and state encoding.

## v0.2.0 — Enhanced Sound Quality (Completed)

- Incorporated subtle synth pitch-drifts (wow/flutter) and filter cutoff LFO modulation.
- Spaced keyboard open voicings to prevent chord mid-range muddy builds.
- Refactored melody phrase generator to use call-and-response rhythm motifs and stepwise conjunct scale movement.
- Implemented deterministic, BPM-scaled swing micro-timing delays.
- Implemented pseudo-random deterministic velocity humanization.
- Softened and lowpassed ambience sounds (rain, vinyl pops, dual-LFO wave swells).

## v0.3.0 — CC0 Sample Packs

- Consider CC0-licensed synthesized one-shots or field recordings only if explicitly approved.
- Maintain full offline compatibility by packaging sound files inside the local project folder.
- Do not add copyrighted samples or remote audio assets.

## v0.4.0 — Collaborative Live Listening Rooms

- Possible future work, not part of v0.1.
- Requires explicit approval before adding a backend.
- Would sync active seeds, tempo values, and rough arrangement playheads between clients.
- Would persist room configuration in SQLite.

## v0.5.0 — Accounts & Sync

- Possible future work only with explicit approval.
- Keep v0.1 free of accounts and backend sync.
