# Agent Guidelines

KoalaFi is a static, frontend-only procedural audio app. Keep changes inside that scope unless the user explicitly asks for a larger product change.

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
- Keep the main sun player as a real DOM button. Do not align invisible controls over a canvas-only sun.
- Keep the default player minimal: sun, title/status copy, and one Controls trigger.
- Keep major UI placement derived from shared scene anchors in `AppShell.svelte`.
- Put secondary actions in the Controls popover, desktop side panels, or mobile sheets. Do not reintroduce permanent duplicate action rows.
- Zen mode should keep the same sun/player and scene visible; hide only non-essential chrome.
- Do not put stripe or horizon overlays inside the sun disc. Scene water/reflection belongs below the horizon.
- Cap `devicePixelRatio`, throttle FPS, pause when hidden, provide motion-off mode, and respect `prefers-reduced-motion`.
- Avoid flashing, strobing, or effects that make controls hard to read.

## Local Scratch

- Use ignored paths for generated artifacts: `test-results/`, `playwright-report/`, `.svelte-kit/`, `build/`, and `*.log`.
- Do not commit browser debug logs or local screenshots unless the user explicitly asks.

## Windows Dev Server

- Start the dev server directly from the repo terminal:
  `npm run dev`
- Vite defaults to port `5173`. Use
  `npm run dev -- --host 127.0.0.1 --port 5173` only when a tool specifically
  needs the numeric loopback address or a fixed port.
- Do not use `Start-Process`, hidden PowerShell wrappers, or `cmd /k` wrappers for the normal dev server. In this Windows environment, inherited `PATH`/`Path` duplicates can break wrapped launches.
- If a detached process is truly required, spawn `node_modules/vite/bin/vite.js`
  directly and pass an environment with exactly one path key: `Path`.
- Do not use external scratch paths such as `C:\tmp` for KoalaFi work. Keep
  generated files inside the workspace and under ignored paths only.
- Persistent background dev servers started by Codex must be run outside the
  sandbox with escalation; sandboxed background processes are not reliable.

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

If formatting fails, run `npm run format`, then rerun verification.

Use browser smoke testing when available for root load, share links, rough-clock links, and responsive layout. For UI work, inspect `1366x768`, `1536x864`, `1920x1080`, and a narrow mobile viewport.
