const CACHE = 'sparkle-v2';
const FILES = [
  '/', '/index.html', '/style.css', '/game.js', '/manifest.json',
  '/activities/fill-frame.js', '/activities/make-pair.js',
  '/activities/match-bonds.js', '/activities/place-value.js',
  '/assets/unicorn.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Cache-first for app files; network-first for Google Fonts (graceful degradation offline)
self.addEventListener('fetch', e => {
  if (e.request.url.includes('fonts.googleapis') || e.request.url.includes('fonts.gstatic')) {
    e.respondWith(fetch(e.request).catch(() => new Response('')));
    return;
  }
  e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request)));
});
