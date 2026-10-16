var CACHE_NAME = 'durak-pwa-v5';
var URLS_TO_CACHE = [
    './',
    './index.html',
    'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js',
    'https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js'
];

self.addEventListener('install', function (event) {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return Promise.all(
                URLS_TO_CACHE.map(function (url) {
                    return fetch(url, { cache: 'reload' }).then(function (res) {
                        if (!res || !res.ok) return;
                        // Очищаем флаг redirected, чтобы Chrome не блокировал страницу в офлайне
                        var cleanResponse = res.redirected ? new Response(res.body, {
                            status: res.status,
                            statusText: res.statusText,
                            headers: res.headers
                        }) : res;
                        return cache.put(url, cleanResponse);
                    }).catch(function () {});
                })
            );
        })
    );
});

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

self.addEventListener('fetch', function (event) {
    if (event.request.method !== 'GET') return;

    // Для переходов по странице всегда отдаем живой HTML из кэша Service Worker
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).then(function (networkRes) {
                var clone = networkRes.clone();
                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put('./index.html', clone);
                });
                return networkRes;
            }).catch(function () {
                return caches.match('./index.html').then(function (res) {
                    return res || caches.match('./');
                });
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request, { ignoreSearch: true }).then(function (cached) {
            return cached || fetch(event.request);
        })
    );
});
