const CACHE_NAME = "lifestyle-assistant-v2"; // Updated to force service worker update
const STATIC_CACHE_URLS = [
  "/",
  "/log",
  // Note: manifest.webmanifest is NOT cached - Chrome needs direct network access
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// Install event - cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // CRITICAL: Don't intercept manifest requests - Chrome needs direct network access
  // for PWA detection and installation
  if (url.pathname === "/manifest.webmanifest") {
    return; // Let the browser fetch directly from network
  }

  // Handle navigation requests (pages)
  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        }).catch(() => {
          // If offline and no cache, return offline page
          if (request.url.endsWith("/") || request.url.endsWith("/log")) {
            return caches.match("/");
          }
          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });
      })
    );
    return;
  }

  // Handle other requests (assets, API calls, etc.)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).catch(() => {
        // Return offline response for failed requests
        return new Response("Offline", {
          status: 503,
          statusText: "Service Unavailable",
        });
      });
    })
  );
});

