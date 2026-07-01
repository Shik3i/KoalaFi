# Contributing to KoalaFi

Thank you for interest in contributing to KoalaFi! As an MIT-licensed, open-source project under KoalaStuff, we welcome procedural audio enthusiasts, developers, and designers.

## Development Setup

1. Clone and install dependencies:
   ```bash
   npm ci
   ```
2. Start the dev server:
   ```bash
   npm run dev -- --host 127.0.0.1 --port 5173
   ```
3. Run test suites:
   ```bash
   npm run test
   ```

## Development Guidelines

- **No CDN Imports**: All libraries, fonts, and assets must be local npm packages.
- **No Tracking**: Do not add analytics, telemetry, cookies, or tracking pixels.
- **No WebGL in v0.1**: Visuals are Canvas 2D/CSS/SVG unless explicitly approved.
- **No Backend or Accounts in v0.1**: Keep the app static and frontend-only unless explicitly scoped.
- **Tone.js Isolation**: Keep Tone.js syntax inside `src/lib/audio/`. Do not directly manipulate Transport state inside Svelte UI views.
- **Maintain Determinism**: The musical output for a given seed, settings, and generator version must remain identical.
- **Untrusted Share State**: Validate, migrate, and clamp imported URL state.
- **UI Stability**: Keep the sun-centered player minimal by default. Secondary actions belong in Controls, side panels, or mobile sheets.
- **Scratch Files**: Local screenshots and Playwright output belong under ignored paths such as `test-results/`. Generated logs are ignored by `*.log`.
- **Code Standards**: Run `npm run format:check`, `npm run lint`, `npm run check`, `npm run test`, `npm run build`, and `docker build -t koalafi:local .` before committing when Docker is available.

For visual changes, manually inspect at least `1366x768`, `1536x864`, `1920x1080`, and a narrow mobile viewport.
