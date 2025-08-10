// sw.js - simple cache-first service worker
const CACHE_NAME = 'iq-tester-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json'
];

// install event - cache app shell
self.addEventListener('install', (evt) => {
  self.skipWaiting();
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(err => console.warn('Cache add failed', err))
  );
});

// activate - cleanup old caches
self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); })))
  );
  self.clients.claim();
});

// fetch - try cache first, then network
self.addEventListener('fetch', (evt) => {
  evt.respondWith(
    caches.match(evt.request).then(cached => {
      if (cached) return cached;
      return fetch(evt.request).then(resp => {
        // optional: cache fetched asset
        return resp;
      }).catch(() => {
        // fallback for navigation requests
        if (evt.request.mode === 'navigate') return caches.match('/index.html');
      });
    })
  );
});
