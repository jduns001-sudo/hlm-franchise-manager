const CACHE='hlm-front-office-v7';
const SHELL=['./','./index.html','./app.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isUniverse = url.pathname.endsWith('/hlm-universe.json');
  const isApp = url.pathname.endsWith('/app.html');

  if (isUniverse) {
    // The universe is the source of truth. Always prefer the current GitHub file.
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          if (response.ok) return response;
          return caches.match(event.request);
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  if (isApp) {
    // Prefer the current app, with the cached copy only as an offline fallback.
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          if (response.ok) {
            caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
            return response;
          }
          return caches.match(event.request);
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
