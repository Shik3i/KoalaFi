# PWA and Offline Support - KoalaFi

## Offline-First Caching Strategy

KoalaFi uses an offline-first service worker. Compiled app code, static files, and prerendered routes from SvelteKit's `$service-worker` metadata are cached during installation.

## Precached Assets

The cache is pre-populated with:

- Compiled JS and CSS from the `build` array.
- Static assets, manifest, icons, and robots file from the `files` array.
- Prerendered static routes from the `prerendered` array.

## Navigation Fallback

Navigation requests are network-first. If the network is unavailable, the service worker returns the cached prerendered shell:

```javascript
if (event.request.mode === 'navigate') {
	return fetch(event.request).catch(
		async () => (await caches.match('/')) ?? (await caches.match('/index.html')) ?? Response.error()
	);
}
```

## Cache Invalidation

To prevent users from being stuck with stale, broken bundles:

1. Cache names are dynamically generated using the SvelteKit build checksum version:
   `const CACHE_NAME = 'koalafi-cache-' + version;`
2. During the service worker activation step, old caches are automatically deleted.
3. Caddy serves `service-worker.js`, `manifest.webmanifest`, and `robots.txt` with `Cache-Control: public, max-age=0, must-revalidate`.
4. Caddy serves hashed `/_app/*` assets with a one-year immutable cache policy.
