// teca - service worker (generato da build.py)
const CACHE = 'teca-v1.5';
const FILE = ['./', 'index.html', 'manifest.webmanifest', 'icona.svg', 'favicon-32.png', 'favicon-16.png', 'icona-180.png', 'icona-192.png', 'icona-512.png', 'icona-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILE.map((u) => new Request(u, { cache: 'reload' })))));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((nomi) => Promise.all(nomi.filter((n) => n.startsWith('teca-v') && n !== CACHE).map((n) => caches.delete(n))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', (e) => { if (e.data === 'aggiorna') self.skipWaiting(); });

async function condividi(req) {
  const fd = await req.formData();
  await caches.delete('teca-condivisi');
  const c = await caches.open('teca-condivisi');
  let n = 0;
  for (const f of fd.getAll('file')) {
    if (typeof f === 'string') continue;
    await c.put(new URL('condivisi/' + n++, self.registration.scope).href, new Response(f, {
      headers: { 'Content-Type': f.type || 'application/octet-stream', 'X-Nome': encodeURIComponent(f.name || 'file') },
    }));
  }
  const testo = [fd.get('url'), fd.get('text')].filter(Boolean).join(' ');
  const link = testo.match(/https:\/\/\S+/);
  if (!n && link) await c.put(new URL('condivisi/link', self.registration.scope).href, new Response(link[0]));
  return Response.redirect(new URL('./?condiviso=1', self.registration.scope).href, 303);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method === 'POST' && url.pathname.endsWith('/condividi')) { e.respondWith(condividi(req)); return; }
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('index.html').then((r) => r || fetch(req)));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req)));
});
