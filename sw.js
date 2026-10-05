const CACHE_NAME = 'bac240-cache-v2';
const STATIC_ASSETS = [
  '/', 
  '/index.html', 
  '/manifest.json',
  '/favicon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/favicon-32.png'
];

// 1. مرحلة التثبيت: حفظ الملفات الهيكلية فوراً
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// 2. مرحلة التفعيل: مسح أي نسخ قديمة من الكاش عند صدور تحديث جديد
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// 3. مرحلة جلب البيانات: توجيه الطلبات عبر الكاش وتأمين العمل بدون إنترنت
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // استثناء طلبات فايربيس السحابية لضمان وصول التحديثات اللحظية والأمان
  if (event.request.url.includes('firestore.googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
