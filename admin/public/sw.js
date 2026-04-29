/**
 * Service Worker for HRMS Tool PWA
 * Production-ready version with proper caching & error handling
 * Includes version-based cache busting for deployments
 */

// NOTE: APP_VERSION is replaced at build time by the vite plugin-pwa / build script.
// Fallback uses a timestamp so each deploy gets a unique cache if build tooling is unavailable.
const APP_VERSION = '__VITE_APP_VERSION__';
// If the placeholder was never replaced (e.g. served from public/ directly),
// fall back to a timestamp so the cache is at least unique per SW registration.
const CACHE_NAME = `hrms-${APP_VERSION.startsWith('__') ? Date.now() : APP_VERSION}`;
const STATIC_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Skip all caching in development (localhost)
const isDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// ---------------- INSTALL ----------------
self.addEventListener('install', (event) => {  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE);
    })
  );

  self.skipWaiting();
});

// ---------------- ACTIVATE ----------------
self.addEventListener('activate', (event) => {  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// ---------------- FETCH ----------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // In development, bypass all caching to allow HMR to work
  if (isDev) return;

  // Ignore non-GET requests
  if (request.method !== 'GET') return;

  // Ignore external requests
  if (url.origin !== self.location.origin) return;

  // -------- VITE ASSETS (Cache Busted by Hash - Skip SW entirely) --------
  // Files under /assets/ already have content hashes in their names (e.g. index-CvT10Ddf.js).
  // The browser's HTTP cache handles these correctly. If the SW intercepts and returns a
  // stale cached entry with the wrong hash, it causes "MIME type text/html" errors.
  if (url.pathname.startsWith('/assets/')) return;

  // -------- API CALLS (Network First) --------
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, cloned);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;

            return new Response(
              JSON.stringify({
                error: 'offline',
                message: 'You are offline',
              }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          });
        })
    );
    return;
  }

  // -------- STATIC FILES (Network First for HTML, Cache First for others) --------
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache valid responses
        if (!response || response.status !== 200) return response;

        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, cloned);
        });

        return response;
      })
      .catch(() => {
        // Offline: try cache fallback
        return caches.match(request).then((cached) => {
          if (cached) return cached;

          // Final fallback for navigation requests
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }

          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// ---------------- SKIP WAITING (instant SW takeover) ----------------
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ---------------- PUSH NOTIFICATIONS ----------------
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/logo.svg',
    badge: '/badge-72x72.png',
    tag: data.tag || 'default',
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'HRMS Notification',
      options
    )
  );
});

// ---------------- NOTIFICATION CLICK ----------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientsArr) => {
        for (const client of clientsArr) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(urlToOpen);
      })
  );
});

// ---------------- BACKGROUND SYNC ----------------
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-attendance') {    event.waitUntil(
      Promise.resolve().then(() => {      })
    );
  }
});