/**
 * SERVICE WORKER
 * Cache-first strategy, offline support, asset prefetching
 * HIDDENEAGLE46 • SULTAN-47
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME    = `hiddeneagle46-${CACHE_VERSION}`;

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './src/cascade/CascadeAlgebra.js',
  './src/core/Clock.js',
  './src/core/VM.js',
  './src/core/Accumulator.js',
  './src/core/Translator.js',
  './src/input/Acceptor.js',
  './src/renderer/Renderer.js',
  './src/engine/Engine.js',
  './src/rom/LevelROM.js',
  './src/game/Game.js',
  './src/ui/UI.js',
  './src/orchestrator/Orchestrator.js',
  './src/app.js',
];

// ── INSTALL ──────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  console.log(`[SW] Installing ${CACHE_NAME}`);

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching assets');
      // Don't fail install if some assets are missing
      return Promise.allSettled(
        PRECACHE_ASSETS.map(url =>
          cache.add(url).catch(err =>
            console.warn(`[SW] Failed to cache ${url}:`, err.message)
          )
        )
      );
    })
  );

  // Take control immediately without waiting for old SW to die
  self.skipWaiting();
});

// ── ACTIVATE ─────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating ${CACHE_NAME}`);

  event.waitUntil(
    // Delete old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('hiddeneagle46-') && name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );

  // Claim all clients immediately
  self.clients.claim();
});

// ── FETCH ─────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Cached: return immediately, refresh in background
        refreshInBackground(event.request);
        return cachedResponse;
      }

      // Not cached: fetch from network, cache for next time
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => {
        // Network failed: try index.html as fallback
        return caches.match('./index.html');
      });
    })
  );
});

// ── BACKGROUND REFRESH ────────────────────────────────────────

function refreshInBackground(request) {
  fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      caches.open(CACHE_NAME).then(cache => cache.put(request, networkResponse));
    }
  }).catch(() => {
    // Silently fail - we already have the cached version
  });
}

// ── MESSAGE HANDLER ───────────────────────────────────────────

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION, cache: CACHE_NAME });
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0].postMessage({ cleared: true });
    });
  }
});
