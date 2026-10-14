// PrepMonkey service worker.
//
// Kept deliberately small:
// - Pages always come from the network, because they hold personal data
//   (attempts, scores, answers) that must never be served stale or left on
//   a shared device. When the network is down, a cached offline page shows.
// - Build assets under /_next/static/ have hashed names and never change,
//   so they are served from cache first, which makes repeat visits fast.
// - Icons and fonts are cached the same way.
// - Everything else (API calls, server actions, auth) passes straight
//   through, untouched.
//
// Bump VERSION to drop old caches on the next activation.

const VERSION = 'v1';
const STATIC_CACHE = `pm-static-${VERSION}`;
const PAGE_CACHE = `pm-offline-${VERSION}`;
const OFFLINE_URL = '/offline';
const PRECACHE = ['/icons/icon-192.png', '/icons/icon-512.png', '/icons/maskable-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const statics = await caches.open(STATIC_CACHE);
    await statics.addAll(PRECACHE);
    // The offline page plus the stylesheets it links, so it renders styled without a network.
    const res = await fetch(OFFLINE_URL, { cache: 'reload' });
    if (res.ok) {
      const html = await res.clone().text();
      await (await caches.open(PAGE_CACHE)).put(OFFLINE_URL, res);
      const css = [...new Set(html.match(/\/_next\/static\/[^"'\s]+\.css/g) ?? [])];
      await Promise.all(css.map((href) => statics.add(href).catch(() => {})));
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([STATIC_CACHE, PAGE_CACHE]);
    for (const key of await caches.keys()) if (key.startsWith('pm-') && !keep.has(key)) await caches.delete(key);
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

const isStaticAsset = (url) =>
  url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || /\.(?:woff2?|ttf|otf)$/.test(url.pathname);

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return (await event.preloadResponse) || (await fetch(request));
      } catch {
        return (await caches.match(OFFLINE_URL, { cacheName: PAGE_CACHE })) || Response.error();
      }
    })());
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(STATIC_CACHE);
      const hit = await cache.match(request);
      if (hit) return hit;
      const res = await fetch(request);
      if (res.ok && res.type === 'basic') cache.put(request, res.clone());
      return res;
    })());
  }
});
