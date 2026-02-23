const CACHE_NAME = 'photocrm-v9';
const OFFLINE_URL = './index.html';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './locales.js',
  './app.js',
  './firebase-config.js',
  './sync-manager.js',
  './team-manager.js',
  './invoice-generator.js',
  './manifest.json',
  './icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).catch(() => caches.match('./')))
  );
});
