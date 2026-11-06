// Serviço de uso sem internet. Guarda o app no aparelho; os dados do usuário ficam no localStorage, não aqui.
// Ao publicar uma versão nova do app, troque o número em VERSAO para os aparelhos baixarem a atualização.
const VERSAO = 'conferencia-20261106-0644';
const NUCLEO = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'];
// bibliotecas de leitura de foto/PDF: baixadas uma vez e guardadas para uso sem internet
const EXTERNOS = ['cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'tessdata.projectnaptha.com', 'unpkg.com'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(NUCLEO)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // app: usa a rede quando há (versão mais nova) e cai para a cópia guardada sem internet
    e.respondWith(fetch(req).then(r => {
      if (r.ok) { const copia = r.clone(); caches.open(VERSAO).then(c => c.put(req, copia)); }
      return r;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
  } else if (EXTERNOS.includes(url.hostname)) {
    // bibliotecas externas: cópia guardada primeiro; se não houver, baixa e guarda
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(resp => {
      if (resp.ok || resp.type === 'opaque') { const copia = resp.clone(); caches.open(VERSAO).then(c => c.put(req, copia)); }
      return resp;
    })));
  }
});
