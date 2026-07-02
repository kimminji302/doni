const CACHE_VERSION = 'doni-v7';
const STATIC_ASSETS = [
  '/',
  '/doni.gif',
  '/favicon.png',
  '/home.png',
  '/icon-512.png',
  '/badge.png',
  '/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('push', e => {
  let data = {};
  try { data = e.data?.json() || {}; } catch(_) { data = { title: '돈이 🪙', body: e.data?.text() || '' }; }
  e.waitUntil(
    self.registration.showNotification(data.title || '돈이', {
      body: data.body || '오늘 소비 기록 했어요?',
      icon: '/icon-512.png',
      badge: '/badge.png',
      data: { url: '/' }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data?.url || '/'));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/sw.js') {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(res => {
          // 성공한 응답을 캐시에 갱신해 오프라인 fallback을 최신으로 유지
          if (res.ok && url.pathname !== '/sw.js') {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put('/', copy));
          }
          return res;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
