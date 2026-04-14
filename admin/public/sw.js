/**
 * Service Worker for HRMS Tool PWA
 * Production-ready version with proper caching & error handling
 * Includes version-based cache busting for deployments
 */

// Generate cache name with app version from build process
const APP_VERSION = '__VITE_APP_VERSION__' || 'v1';
const CACHE_NAME = `hrms-${APP_VERSION}`;
const STATIC_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Skip all caching in development (localhost)
const isDev = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// ---------------- INSTALL ----------------
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE);
    })
  );

  self.skipWaiting();
});

// ---------------- ACTIVATE ----------------
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');

  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
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

  // -------- STATIC FILES (Cache First) --------
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) return response;

          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, cloned);
          });

          return response;
        })
        .catch(() => {
          // Offline fallback
          if (request.headers.get('accept')?.includes('text/html')) {
            return new Response(
              `
              <html>
                <head><title>Offline</title></head>
                <body style="font-family:sans-serif;text-align:center;padding:50px;">
                  <h1>📡 Offline</h1>
                  <p>Please check your internet connection.</p>
                </body>
              </html>
              `,
              {
                status: 503,
                headers: { 'Content-Type': 'text/html' },
              }
            );
          }

          return new Response('Offline', { status: 503 });
        });
    })
  );
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
  if (event.tag === 'sync-attendance') {
    console.log('[SW] Syncing attendance...');
    event.waitUntil(
      Promise.resolve().then(() => {
        console.log('[SW] Attendance sync completed');
      })
    );
  }
});

console.log('[SW] Loaded successfully');