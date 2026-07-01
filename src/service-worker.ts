/// <reference lib="webworker" />

import { build, files, prerendered, version } from '$service-worker';

const CACHE_NAME = `koalafi-cache-${version}`;
const ASSETS = [...build, ...files, ...prerendered];
const ASSET_PATHS = new Set(ASSETS);

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => {
				// Precache all compiled assets and static assets
				return cache.addAll(ASSETS);
			})
			.then(() => {
				// Skip waiting to activate immediately
				return sw.skipWaiting();
			})
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => {
				return Promise.all(
					keys.map((key) => {
						if (key !== CACHE_NAME && key.startsWith('koalafi-cache-')) {
							// Delete old caches to prevent stale bundles
							return caches.delete(key);
						}
					})
				);
			})
			.then(() => {
				return sw.clients.claim();
			})
	);
});

sw.addEventListener('fetch', (event) => {
	// Only intercept local GET requests
	const url = new URL(event.request.url);
	if (event.request.method !== 'GET' || url.origin !== sw.location.origin) {
		return;
	}

	// Handle SPA navigation requests: if offline, fall back to the prerendered shell.
	if (event.request.mode === 'navigate') {
		event.respondWith(
			fetch(event.request).catch(
				async () =>
					(await caches.match('/')) ?? (await caches.match('/index.html')) ?? Response.error()
			)
		);
		return;
	}

	const isPrecachedAsset = ASSET_PATHS.has(url.pathname) || ASSET_PATHS.has(url.pathname.slice(1));
	if (!isPrecachedAsset) {
		return;
	}

	event.respondWith(
		caches.match(event.request).then((cachedResponse) => cachedResponse ?? fetch(event.request))
	);
});
