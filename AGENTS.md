# KoalaFi Agent Notes

## Local Dev Server

Start the Svelte dev server with:

```powershell
npm run dev
```

Expected default URL: `http://localhost:5173/`. Vite uses port `5173`
by default and prints the actual URL if the port changes.

For browser automation that must use the numeric loopback address, this optional
form is fine:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

On Windows, start the dev server directly in the repo terminal. Do not wrap it
in `Start-Process`, `cmd /k`, or hidden background PowerShell unless explicitly
needed; this environment can expose both `PATH` and `Path`, and wrapper-based
launches repeatedly fail on that duplicate key.

Do not use external scratch paths such as `C:\tmp` for KoalaFi work. Keep
generated files inside the workspace and under ignored paths only. If a
persistent background dev server is needed from Codex, request escalation and
start it outside the sandbox; sandboxed background processes are not reliable.

## Verification

Before reporting non-trivial changes done:

```powershell
npm run format:check
npm run lint
npm run check
npm run test
npm run build
docker build -t koalafi:local .
```

If formatting fails, run `npm run format`, then rerun verification.

For UI work, inspect desktop `1366x768`, `1536x864`, `1920x1080`, plus a narrow mobile viewport. Save screenshots under `test-results/`.
