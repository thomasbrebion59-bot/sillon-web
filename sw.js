// Généré par scripts/build.mjs : ne pas modifier à la main.
const VERSION = "aaf3eb655e63";
const SHELL = 'sillon-shell-' + VERSION;
const ASSETS = ["index.html","manifest.webmanifest","privacy.html","fonts/Lexend.ttf","img/sillon-favicon-64.png","img/sillon-icone-nuit-180.png","img/sillon-icone-nuit-192.png","img/sillon-icone-nuit-512.png","img/bulle-lanterne.webp","img/bulle-lanterne-s.webp","img/bulle-constellation.webp","img/bulle-constellation-s.webp","img/bulle-plasma.webp","img/bulle-plasma-s.webp","img/univers/aquarelle.webp","img/univers/atlas.webp","img/univers/banquise.webp","img/univers/boreale.webp","img/univers/brocart.webp","img/univers/caldeira.webp","img/univers/caoutchouc.webp","img/univers/circuit.webp","img/univers/cosmos.webp","img/univers/dentelle.webp","img/univers/encre.webp","img/univers/erg.webp","img/univers/facettes.webp","img/univers/feuillets.webp","img/univers/feutre.webp","img/univers/fibres.webp","img/univers/foret.webp","img/univers/galaxie.webp","img/univers/geode.webp","img/univers/liege.webp","img/univers/marqueterie.webp","img/univers/nacre.webp","img/univers/ocean.webp","img/univers/or-laque.webp","img/univers/porcelaine.webp","img/univers/recif.webp","img/univers/synthwave.webp","img/univers/terre-cuite.webp","img/univers/ville.webp","img/univers/vitrail.webp","assets/brain-cortex-md.bin.gz","assets/brain-cortex-lp.bin.gz"];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(SHELL);
    await c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keep = [SHELL, 'sillon-share']; // v6-biblio : les fichiers partagés attendent que l'app les range
    for (const k of await caches.keys()) if (k.startsWith('sillon-') && !keep.includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

const scopePath = new URL(self.registration.scope).pathname;
const isShellPage = (u) => u.origin === self.location.origin && (u.pathname === scopePath || u.pathname === scopePath + 'index.html');

async function shellIndex() {
  const c = await caches.open(SHELL);
  return (await c.match('index.html')) || (await c.match('./'));
}

// v6-biblio : partage reçu (share_target) : fichiers et textes rangés dans le cache 'sillon-share', puis l'app s'ouvre sur ./?share=1
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const u0 = new URL(req.url);
  if (req.method === 'POST' && u0.origin === self.location.origin && u0.pathname === scopePath + 'share-target') {
    e.respondWith((async () => {
      try {
        const fd = await req.formData();
        const c = await caches.open('sillon-share');
        let i = 0;
        for (const [field, v] of fd.entries()) {
          const key = new Request(scopePath + 'share-in/' + Date.now() + '-' + (i++));
          if (typeof v === 'string') { if (v.trim()) await c.put(key, new Response(v, { headers: { 'content-type': 'text/plain;charset=utf-8', 'x-sillon-field': field, 'x-sillon-name': encodeURIComponent(field) } })); continue; }
          await c.put(key, new Response(v, { headers: { 'content-type': v.type || 'application/octet-stream', 'x-sillon-field': 'files', 'x-sillon-name': encodeURIComponent(v.name || 'fichier') } }));
        }
      } catch (err) { /* rien de reçu : l'app s'ouvre quand même */ }
      return Response.redirect(scopePath + '?share=1', 303);
    })());
    return;
  }
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== self.location.origin || !u.pathname.startsWith(scopePath)) return;
  if (req.mode === 'navigate') {
    // La page de l'app (avec ou sans ?capture=1) : cache d'abord. Les autres pages (galeries de dev) : réseau, puis l'app hors ligne.
    if (isShellPage(u)) e.respondWith((async () => (await shellIndex()) || fetch(req))());
    else e.respondWith(fetch(req).catch(async () => (await shellIndex()) || Response.error()));
    return;
  }
  e.respondWith((async () => {
    const c = await caches.open(SHELL);
    const hit = await c.match(req);
    return hit || fetch(req);
  })());
});
