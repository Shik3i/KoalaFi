# Deployment Specification - KoalaFi

## Dockerized Environments

KoalaFi utilizes a secure, multi-stage Docker container build. It does not require Node.js at runtime, instead compiling all files static and exporting them to a lightweight Caddy Alpine web server.

### Build and Test Stage

- Uses official Node:20-alpine image.
- Performs npm installs cleanly (`npm ci`).
- Executes prettier audits (`npm run format:check`).
- Runs `npm run check`, unit tests (`npm run test:unit -- --run`), and `npm run build`.
- Compiles SvelteKit routes into static `/app/build` directories.

### Server Stage

- Uses official Caddy Alpine image.
- The example Caddyfile listens on port 80. The image exposes 80 and 443 so operators can add TLS in their deployment Caddyfile.
- Runs on a read-only filesystem container in production with mapped writable tmpfs layers (`/data`, `/config`, `/tmp`).

## Caddy Routing & Hardening

Caddy is configured via `Caddyfile.example` to provide:

1. **SPA Fallback Routing**: Maps missing file paths back to `/index.html` allowing Svelte client-side routers to handle deep links.
2. **Compression**: Compresses text assets using Zstandard and Gzip.
3. **Security Headers**:
   - `X-Frame-Options: DENY` (prevents clickjacking)
   - Strict Content Security Policy limiting scripts, connections, and style loading to local origin boundaries.
4. **Caching Policies**:
   - `service-worker.js`, `manifest.webmanifest`, and `robots.txt` are set to `max-age=0, must-revalidate`.
   - Hashed application resources (`/_app/*`) are cached for 1 year with `immutable` flags.

The release workflow publishes `ghcr.io/shik3i/koalafi` from version tags and enables Docker build provenance and SBOM output.

## Local Verification

Use the same image tag as local agent verification:

```bash
docker build -t koalafi:local .
```

The Docker context intentionally excludes generated output, local logs, screenshots, docs, and Git metadata through `.dockerignore`.
