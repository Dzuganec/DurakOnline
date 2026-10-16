var CACHE_NAME = 'durak-casino-v3';
var ASSETS = [
    './',
    './index.html',
    'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js',
    'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js'
];

// При первом открытии сохраняем игру и библиотеки сканера/сети в память телефона навсегда
self.addEventListener('install', function (event) {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return Promise.all(
                ASSETS.map(function (url) {
                    return cache.add(url).catch(function () {});
                })
            );
        })
    );
});

// Удаляем старый кэш при обновлении версии
self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.map(function (key) {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

// Отдаем игру мгновенно из памяти телефона даже в авиарежиме и без интернета!
self.addEventListener('fetch', function (event) {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request, { ignoreSearch: true }).then(function (cached) {
            var networkFetch = fetch(event.request).then(function (response) {
                if (response && response.status === 200) {
                    var copy = response.clone();
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(event.request, copy);
                    });
                }
                return response;
            }).catch(function () {
                return cached || caches.match('./index.html') || caches.match('./');
            });
            return cached || networkFetch;
        })
    );
});
