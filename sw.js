// Service worker de Plans : l'app fonctionne hors ligne une fois ouverte une première fois.
// Stratégie « stale-while-revalidate » : on sert la copie en cache tout de suite et on la met
// à jour en arrière-plan, donc une nouvelle version arrive au lancement suivant.
// Changer VERSION quand la liste SHELL change.
const VERSION = 'plans-v1';
const SHELL = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(VERSION).then(async cache => {
    // une navigation (avec ?param ou non) retombe sur la page de l'app
    const key = req.mode === 'navigate' ? 'index.html' : req;
    const cached = await cache.match(key, {ignoreSearch: req.mode === 'navigate'});
    const fresh = fetch(req).then(res => {
      if (res.ok) cache.put(key, res.clone());
      return res;
    }).catch(() => cached);
    if (cached){ e.waitUntil(fresh); return cached; }
    return fresh;
  }));
});
