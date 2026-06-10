// Ağ-öncelikli service worker: her zaman taze içerik, çevrimdışında önbellekten.
const CACHE = "4c1z-v2";
const SHELL = ["/", "/index.html", "/app.js", "/prompt.js", "/embed.js", "/style.css", "/manifest.json", "/icon.svg"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // API ve dış kaynaklar (fontlar, pollinations) doğrudan ağdan
  if (url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  e.respondWith(
    fetch(req)
      .then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
      .catch(() => caches.match(req).then(m => m || caches.match("/index.html")))
  );
});
