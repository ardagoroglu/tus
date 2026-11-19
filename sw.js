/* Kedili Bahçe: çevrimdışı çalışma. Önce ağ (güncel sürüm), ağ yoksa önbellek. */
const SURUM = 'kedili-bahce-2026-11-19.2-289180a70b';
const DOSYALAR = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(SURUM).then(c => c.addAll(DOSYALAR)).then(() => self.skipWaiting())); });
const ZIL = 'kedili-bahce-zil';   /* sayfanın yazdığı bildirim metni burada durur */
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== SURUM && k !== ZIL).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.hostname === 'api.github.com') return;
  if (u.origin === location.origin) {
    e.respondWith(fetch(e.request).then(r => { if (r.ok) { const k = r.clone(); caches.open(SURUM).then(c => c.put(e.request, k)); } return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
  }
});
/* Zil bildirimi: sunucu içeriksiz bir istek gönderir, metni burada kurarız. Her istekte bildirim göstermek zorunlu. */
self.addEventListener('push', e => {
  e.waitUntil((async () => {
    let m = { baslik: 'Bahçe zamanı', govde: 'Sıradaki iş hazır. İlk adım yalnızca 10 dakika.' };
    try { const c = await caches.open(ZIL), r = await c.match('zil.json'); if (r) m = Object.assign(m, await r.json()); } catch (x) { }
    await self.registration.showNotification(m.baslik, { body: m.govde, icon: 'icon-192.png', badge: 'icon-192.png', tag: 'bahce-zil' });
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of cs) if ('focus' in c) return c.focus();
    return self.clients.openWindow('./');
  })());
});
