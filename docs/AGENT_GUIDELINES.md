# Agent Guidelines

KoalaFi v0.1 is a static, frontend-only procedural audio app. Keep changes inside that scope unless the user explicitly asks for a larger product change.

## Hard Rules

- Do not add a backend, accounts, analytics, tracking, cookies, telemetry, external CDNs, external fonts, remote images, remote audio, copyrighted samples, or WebGL.
- Do not replace Tone.js. Tone.js belongs inside `src/lib/audio`.
- Svelte UI components must call audio/domain actions such as `initializeAudio`, `start`, `stop`, `toggle`, `applyState`, `setPlayheadFromRoughSync`, and `dispose`. Do not mutate `Tone.Transport`, synths, effects, or audio nodes from UI code.
- Keep generation deterministic. The same seed, settings, and `generatorVersion` must produce the same event sequence.
- Treat imported share state as untrusted input. Validate, migrate, clamp, and fail gracefully.
- Keep app state serializable. Do not put live audio nodes, DOM objects, functions, or class instances into `KoalaFiState`.
- IndexedDB is the v0.1 persistence layer. Keep database upgrades incremental and safe.
- Test service worker and offline behavior carefully; stale bundles can strand users.
- Preserve Docker/Caddy support. The final container must serve static files without Node.js.

## Visuals

- Use Canvas 2D and CSS/SVG only in v0.1.
- Cap `devicePixelRatio`, throttle FPS, pause when hidden, provide motion-off mode, and respect `prefers-reduced-motion`.
- Avoid flashing, strobing, or effects that make controls hard to read.

## Verification

Before reporting done, run:

```bash
npm run format:check
npm run lint
npm run check
npm run test
npm run build
docker build -t koalafi:local .
```

Use browser smoke testing when available for root load, share links, rough-clock links, and responsive layout.
