// Offline play for the installed app: cache the page, the city data and the icons.
const CACHE = 'undertow-mungdec5';
const FILES = ['./', 'index.html', 'data/city.json', 'data/city.bin', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => { const copy = res.clone(); if (res.ok) caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })));
});
