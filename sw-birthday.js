/* 宝宝 · 生日快乐 Service Worker：全量预缓存，离线可用 */
const CACHE = 'yangjia-birthday-v2';
const CORE = [
  './',
  './index.html',
  './birthday.webmanifest',
  './bday-touch.png',
  './bday-icon-192.png',
  './bday-icon-512.png',
  './favicon-bday.svg',
  './assets/seal.png',
  './assets/sig_dark.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const c = await caches.open(CACHE);
      /* 逐条 add：单条失败不影响其余资源 */
      await Promise.all(CORE.map((u) => c.add(u).catch(() => {})));
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('yangjia-birthday-') && k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // 外部资源交给网络
  if (e.request.mode === 'navigate') {
    // 页面：网络优先，失败回退缓存
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
    );
    return;
  }
  // 静态资源：缓存优先
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      });
    })
  );
});
