// خدمة التخزين المؤقت: تخلي التطبيق يفتح بسرعة وحتى من غير نت
const V = 'attara-v2';
const CORE = ['./', 'index.html', 'manifest.json', 'shop.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const isPage = r.mode === 'navigate' || u.pathname.endsWith('/index.html');

  // الصفحة نفسها: نجيب النسخة الجديدة لو فيه نت، وإلا من الكاش
  if (isPage) {
    e.respondWith(
      fetch(r)
        .then(res => { const cp = res.clone(); caches.open(V).then(c => c.put('index.html', cp)); return res; })
        .catch(() => caches.match('index.html').then(x => x || caches.match('./')))
    );
    return;
  }

  // باقي الملفات (صور، خطوط، مكتبات): من الكاش الأول
  e.respondWith(
    caches.match(r).then(hit => hit || fetch(r).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
      return res;
    }).catch(() => hit))
  );
});
