const CACHE_VERSION = 'aluna-shell-v12';
const SHELL_ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/favicon.png'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // 1. Navigation requests: Network-first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 2. JS / CSS Code Assets: ALWAYS Network-first so code updates apply immediately!
  if (url.origin === self.location.origin && /\.(?:js|css)$/i.test(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 3. Static Media (Images, Fonts): Cache-first with network fallback
  if (url.origin === self.location.origin && /\.(?:png|jpe?g|webp|svg|woff2?)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone)).catch(() => {});
          }
          return response;
        });
      })
    );
  }
});
