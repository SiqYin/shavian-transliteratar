/* Shavian Transliteratar — offline cache (app shell + all local assets). */
var CACHE = "shavian-v2";
var SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-maskable.svg",
  "./web/i18n.js",
  "./web/lang-detect.js",
  "./web/tables.js",
  "./web/data.js",
  "./web/engine.js",
  "./web/app.js",
  "./web/styles.css",
  "./data/noto-sans-shavian.woff2"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // data.js is 4.7 MB; cache it best effort so one failure does not kill install
      return c.addAll(SHELL).then(function () {
        return c.add("./web/data.js").catch(function () {});
      });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") { return; }
  if (req.url.indexOf(self.registration.scope) !== 0) { return; }
  // stale-while-revalidate: serve the cache instantly, refresh it in the
  // background so newly deployed versions arrive on the next load
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      var network = fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || network;
    })
  );
});
