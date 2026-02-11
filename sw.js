// Quran Companion — Service Worker
const CACHE_NAME = 'quran-companion-v1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json',
    './icons/icon-192.svg',
    './icons/icon-512.svg',
];

const API_CACHE = 'quran-api-v1';
const FONT_CACHE = 'quran-fonts-v1';

// Install — cache static shell
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate — clean old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((k) => k !== CACHE_NAME && k !== API_CACHE && k !== FONT_CACHE)
                    .map((k) => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch — network-first for API, cache-first for static assets & fonts
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // Google Fonts — cache-first (they never change)
    if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
        e.respondWith(
            caches.open(FONT_CACHE).then((cache) =>
                cache.match(e.request).then((cached) => {
                    if (cached) return cached;
                    return fetch(e.request).then((res) => {
                        cache.put(e.request, res.clone());
                        return res;
                    });
                })
            )
        );
        return;
    }

    // Quran API — network-first, cache fallback
    if (url.hostname === 'api.alquran.cloud') {
        e.respondWith(
            fetch(e.request)
                .then((res) => {
                    const clone = res.clone();
                    caches.open(API_CACHE).then((cache) => cache.put(e.request, clone));
                    return res;
                })
                .catch(() => caches.match(e.request))
        );
        return;
    }

    // Audio CDN — network only (too large to cache all)
    if (url.hostname === 'cdn.islamic.network') {
        e.respondWith(fetch(e.request));
        return;
    }

    // Static assets — cache-first
    e.respondWith(
        caches.match(e.request).then((cached) => {
            if (cached) return cached;
            return fetch(e.request).then((res) => {
                // Only cache same-origin
                if (url.origin === self.location.origin) {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
                }
                return res;
            });
        })
    );
});
