const CACHE_NAME = 'photocrm-v7'; // v2.2.3 - Fixed btoa encoding error
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './locales.js',
    './app.js',
    './manifest.json',
    './icon.svg',
];

// Install - cache core assets
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch - cache-first for app shell, network-first for fonts
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // Network-first for Google Fonts
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
        e.respondWith(
            fetch(e.request).then(res => {
                const clone = res.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                return res;
            }).catch(() => caches.match(e.request))
        );
        return;
    }

    // Cache-first for local assets
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request))
    );
});
