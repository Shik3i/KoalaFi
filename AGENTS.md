# KoalaFi Agent Notes

## Local Dev Server

Start the Svelte dev server with:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

Expected URL: `http://127.0.0.1:5173/`.

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
