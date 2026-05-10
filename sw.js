const CACHE_VERSION = 'FEG_STAGE_PRO_3_7_2';
const CACHE_NAME = 'feg-stage-pro-v3-7-2-module-cleanup-bundle';
const RUNTIME_CACHE = 'feg-stage-runtime-v37-3-7-2';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './feg_svg_calibration.json',
  './src/legacy-app.js',
  './src/README.md',
  './src/modules/index.js',
  './src/modules/FormatUtils.js',
  './src/modules/DomUtils.js',
  './src/modules/AppBootstrap.js',
  './src/modules/TrussBootstrap.js',
  './src/modules/TrussState.js',
  './src/modules/TrussProjectsUI.js',
  './src/modules/StageGridState.js',
  './src/modules/StageCalculator.js',
  './src/modules/TrussBlockConstructor.js',
  './src/modules/LoadChecker.js',
  './src/modules/PdfGenerator.js',
  './src/modules/TransportSettings.js',
  './src/modules/AppSettings.js',
  './src/modules/SupabaseStorage.js',
  './src/modules/ProjectStorage.js',
  './src/modules/ProjectManager.js',
  './src/modules/ClientsStorage.js',
  './src/modules/ClientsManager.js',
  './src/modules/ClientsUI.js',
  './src/modules/PwaManager.js',
  './src/modules/NavigationManager.js',
  './src/modules/ModalManager.js',
  './src/modules/ToastManager.js',
  './src/modules/CalibrationManager.js',
  './src/modules/PriceWeightSettings.js',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];

const OPTIONAL_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS)
        .then(() => cache.addAll(OPTIONAL_ASSETS).catch(() => null)))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => ![CACHE_NAME, RUNTIME_CACHE].includes(key))
        .map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'CLEAR_RUNTIME_CACHE') event.waitUntil(caches.delete(RUNTIME_CACHE));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (CORE_ASSETS.some(asset => url.pathname.endsWith(asset.replace('./', '/')))) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      }).catch(() => cached))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
