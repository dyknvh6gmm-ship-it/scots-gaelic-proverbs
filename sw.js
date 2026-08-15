// Sean-fhaclan & Auld Sayins — service worker
// Handles offline caching for the installable app, and is pre-wired for push
// notifications once you connect a push provider (see README "Push notifications").

var CACHE_NAME = 'sean-fhaclan-v2';
var ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE_NAME; })
            .map(function (key) { return caches.delete(key); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Cache-first for app shell, falling back to network; network-first would also
// work fine here since the whole app is one static file.
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(function () {
        return caches.match(event.request).then(function (cached) {
          return cached || caches.match('./index.html');
        });
      })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request).catch(function () {
        return caches.match('./index.html');
      });
    })
  );
});

// ---- Push notifications (inactive until you wire up a push provider) ----
// Once you have a provider (e.g. OneSignal, or your own web-push server) sending
// pushes to subscribed browsers, this will display them. See README.
self.addEventListener('push', function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {
    data = { title: 'Sean-fhaclan', body: event.data ? event.data.text() : 'Proverb of the day is ready.' };
  }
  var title = data.title || 'Sean-fhaclan & Auld Sayins';
  var options = {
    body: data.body || "Today's proverb is ready.",
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    data: { url: data.url || './index.html' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || './index.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        if (list[i].url.indexOf(url) !== -1 && 'focus' in list[i]) return list[i].focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
