// ChaLLengErs offline cache: the app works without internet after the first visit.
const CACHE = "challengers-v3";
const FILES = ["./", "index.html", "styles.css", "manifest.webmanifest", "assets/favicon.svg", "assets/icon-192.png",
  "js/fontmetrics.js", "js/data.js", "js/engine.js", "js/prompt.js", "js/exporters.js", "js/importers.js", "js/app.js"];
self.addEventListener("install", (e) => e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener("activate", (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  // network first so updates arrive; cache as fallback when offline
  e.respondWith(fetch(e.request).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res; }).catch(() => caches.match(e.request).then((r) => r || caches.match("index.html"))));
});
