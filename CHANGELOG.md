# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
