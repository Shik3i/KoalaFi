# KoalaFi

Endless procedural lofi and ambient noise in your browser.

KoalaFi is a frontend-only SvelteKit app that synthesizes music and ambience with Tone.js, stores local data in IndexedDB, and runs offline after first load. It has no backend, accounts, tracking, analytics, external CDNs, WebGL, copyrighted samples, or external audio assets in v0.1.

Intended production domain: `lofi.koalastuff.net`. This repository includes the static build, Docker, and Caddy files needed to deploy it.

## Status

v0.1 foundation is implemented and production-audited: static app shell, deterministic procedural generation, local persistence, share URLs, rough-clock sync, Canvas 2D visuals, PWA support, Docker/Caddy deployment files, CI, and tests.

Screenshots are not committed yet.

## Features

- Procedural Tone.js synths, drums, effects, and ambience.
- Deterministic 64-bar generation from `seed + settings + generatorVersion`.
- Local presets, settings, and recently played vibes through IndexedDB.
- Compact `?vibe=` share URLs with validation and migration on import.
- Rough-clock sync links based on `nowUtc - startedAtUtc`, not sample-perfect sync.
- Responsive Canvas 2D visuals with capped FPS, reduced-motion support, and visual-off mode.
- Offline/PWA service worker using SvelteKit `$service-worker` build metadata.
- Multi-stage Docker build with Caddy static serving.

## Quick Start

```bash
npm ci
npm run dev
```

Open `http://localhost:5173`.

## Commands

```bash
npm run format:check
npm run lint
npm run check
npm run test
npm run build
npm run preview
```

`npm run test` runs unit tests and Playwright e2e tests. Playwright needs a browser installed; CI runs `npx playwright install --with-deps chromium`.

## Docker

```bash
docker build -t koalafi:local .
docker run --rm -p 8080:80 koalafi:local
```

Compose example:

```bash
docker compose -f docker-compose.example.yml up --build
```

`docker-compose.example.yml` expects an external `caddy_net` network and uses `read_only: true` with writable tmpfs mounts for Caddy runtime paths.

## Deployment Notes

- Image name is prepared as `ghcr.io/shik3i/koalafi`.
- `Caddyfile.example` serves the static `build/` output with SPA fallback.
- `/_app/*` hashed assets are cacheable as immutable.
- `service-worker.js`, `manifest.webmanifest`, and `robots.txt` must revalidate.
- Security headers are intentionally local-origin only; do not add CDN allowances without explicit approval.

## Architecture

- `src/lib/audio`: Tone.js engine, instruments, effects, scheduling, deterministic generator.
- `src/lib/state`: serializable state, defaults, presets, migration and clamping.
- `src/lib/share`: compact URL encode/decode and rough-clock playhead helpers.
- `src/lib/storage`: IndexedDB database and repositories using `idb`.
- `src/lib/visuals`: Canvas 2D renderer and visual settings.
- `src/lib/components`: Svelte UI. Components call audio/state actions; they must not mutate Tone.js directly.

## Privacy

KoalaFi keeps user data local. There are no analytics, telemetry calls, cookies, accounts, or external asset requests in v0.1.

## Documentation

- [Product](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Audio Engine](docs/AUDIO_ENGINE.md)
- [Procedural Generation](docs/PROCEDURAL_GENERATION.md)
- [State and Sharing](docs/STATE_AND_SHARING.md)
- [IndexedDB Storage](docs/INDEXEDDB_STORAGE.md)
- [PWA and Offline](docs/PWA_AND_OFFLINE.md)
- [Visual System](docs/VISUAL_SYSTEM.md)
- [Future Backend and Sync](docs/FUTURE_BACKEND_AND_SYNC.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Agent Guidelines](docs/AGENT_GUIDELINES.md)
- [Roadmap](docs/ROADMAP.md)

## License

MIT. See [LICENSE](LICENSE).
