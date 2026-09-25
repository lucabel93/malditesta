// Cache per l'uso offline. Cambia VERSION quando aggiorni l'app.
const VERSION = 'mdt-v9';
const FILES = ['./', 'index.html', 'firebase.js', 'manifest.json', 'notify/messages.json', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Prima la rete (così gli aggiornamenti arrivano subito), poi la cache se sei offline.
// Solo i file dell'app: le richieste verso Firebase passano dirette (sono flussi continui, non vanno in cache).
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request, {ignoreSearch: true}))
  );
});

// Promemoria giornaliero inviato da notify/send.mjs
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { data = {body: e.data.text()}; }
  e.waitUntil(self.registration.showNotification(data.title || 'Diario Mal di Testa', {
    body: data.body || "Hai avuto mal di testa oggi? Segnalo nell'app!",
    icon: 'icon-192.png', badge: 'icon-192.png', tag: 'promemoria', data: {url: './'},
  }));
});
// Tocco sulla notifica: apre l'app (o la porta in primo piano)
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(list => {
    const win = list.find(c => 'focus' in c);
    return win ? win.focus() : self.clients.openWindow('./');
  }));
});
