# System Architecture - KoalaFi

## Structural Topology

KoalaFi is structured as a client-side Single Page Application (SPA) powered by SvelteKit, compiled via `@sveltejs/adapter-static` for static hosting.

```mermaid
graph TD
  UI[Svelte UI Components] -->|Read/Write| Store[Svelte 5 Runes State Store]
  UI -->|Trigger Actions| Engine[Tone.js Audio Engine]
  Store -->|Serialize| Share[URL Share Encoder]
  Store -->|Persist| DB[IndexedDB Storage Repo]
  Engine -->|Audio Out| WebAudio[Browser Web Audio API]
  UI -->|Scene Tokens| Player[Sun DOM Player]
  UI -->|Scene Tokens| Panels[Responsive Panels]
  SW[Service Worker] -->|Offline Cache| Assets[Static Build Files]
```

## Architectural Boundaries

### 1. State Domain (`src/lib/state/`)

- Contains the central serializable state definitions, default parameters, built-in presets, and Svelte 5 runes-based global reactive stores.
- Runes-based `$state` proxies nested changes reactively to the layout.

### 2. Share Domain (`src/lib/share/`)

- Serializes states into short URL-safe Base64 strings.
- Decodes incoming URLs, validating parameters to prevent app crashes.
- Computes rough-clock offset times from UTC start dates.

### 3. Storage Domain (`src/lib/storage/`)

- Manages local persistence utilizing IndexedDB, wrapped in `idb`.
- Decouples raw IndexedDB calls into structured repositories: presets, settings, and recently played logs.

### 4. Audio Domain (`src/lib/audio/`)

- Encapsulates Tone.js synthesizers, effects, scheduling loops, and seeded random calculations.
- Exposes a unified API (`koalaFiEngine`) to prevent UI components from mutating global transport and synth states.

### 5. Visual Domain (`src/lib/visuals/`)

- High-performance animated outrun sunset visuals rendered on a Canvas 2D frame-capped loop.
- Monitors document visibility and user system preferences (reduced motion) to prevent CPU/battery drain.
- Keeps the animated background separate from the interactive sun. `sunLayout.ts` provides coarse canvas horizon alignment; `AppShell.svelte` owns the responsive CSS scene tokens for DOM layout.

### 6. UI Shell (`src/lib/components/`)

- `AppShell.svelte` owns the sun-centered layout, desktop side docks, mobile bottom sheets, Zen mode, and settings drawer.
- `SunPlayer.svelte` owns the primary play/pause button, header chip, Controls popover, share/save dialogs, subtle water/reflection layer, and Zen simplification.
- Tune controls and preset selection remain existing components mounted inside collapsible panels.

### 7. Service Worker (`src/service-worker.ts`)

- Navigation requests are network-first with cached shell fallback for offline use.
- Only SvelteKit precached assets are served cache-first.
- Non-precache local GET requests pass through the browser so development and runtime bundles do not get trapped behind stale dynamic cache entries.
