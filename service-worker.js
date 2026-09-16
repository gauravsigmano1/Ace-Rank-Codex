const CACHE = 'rallysh-v29';
const IMAGE_CACHE = 'rallysh-image-cache-v1';
const ASSETS = ['./', './index.html', './safety.js', './terms.html', './community-guidelines.html', './support.html', './manifest.webmanifest', './ace-rank-icon.svg', './rallysh-opening-preview.jpg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Match and court photos are served by Firebase Storage. Keep an on-device
  // copy so revisiting the feed does not visibly reload every image.
  if (url.hostname === 'firebasestorage.googleapis.com' && event.request.destination === 'image') {
    event.respondWith(caches.open(IMAGE_CACHE).then(cache => cache.match(event.request).then(cached => cached || fetch(event.request).then(response => { if (response.ok) cache.put(event.request, response.clone()); return response; }))));
    return;
  }
  if (url.origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
