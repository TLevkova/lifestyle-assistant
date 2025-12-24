// Service Worker Version - Update this to bust cache
const SW_VERSION = "1.0.0";
const CACHE_PREFIX = "lifestyle-assistant";
const STATIC_CACHE = `${CACHE_PREFIX}-static-${SW_VERSION}`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}-dynamic-${SW_VERSION}`;
const APP_SHELL_CACHE = `${CACHE_PREFIX}-shell-${SW_VERSION}`;

// App shell URLs to precache
const APP_SHELL_URLS = [
  "/",
  "/manifest.webmanifest",
];

// Install event - precache app shell
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker version", SW_VERSION);
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => {
        console.log("[SW] Precaching app shell");
        return cache.addAll(APP_SHELL_URLS);
      })
      .catch((error) => {
        console.error("[SW] Failed to precache app shell:", error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker version", SW_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete all caches that don't match current version
            return (
              name.startsWith(CACHE_PREFIX) &&
              !name.includes(SW_VERSION)
            );
          })
          .map((name) => {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Strategy 1: Cache-first for static assets
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Strategy 2: Network-first for API requests (future-proof)
  // This handles any /api/* routes
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Strategy 3: Navigation fallback for App Router navigations
  if (request.mode === "navigate") {
    event.respondWith(navigationFallback(request));
    return;
  }

  // Strategy 4: Network-first for other requests (CSS, JS, images, etc.)
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// Cache-first strategy: Check cache first, fallback to network
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // If offline and no cache, return a basic offline response
    return new Response("Offline", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/plain" },
    });
  }
}

// Network-first strategy: Try network first, fallback to cache
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // No cache available, return offline response
    return new Response(
      JSON.stringify({ error: "Offline", message: "No network connection and no cached data available" }),
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Navigation fallback: Try network, fallback to cached "/", then offline page
async function navigationFallback(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache the response for offline use
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    // Network failed, continue to cache fallback
  }

  // Try to get cached "/" as fallback
  const cache = await caches.open(APP_SHELL_CACHE);
  const cachedIndex = await cache.match("/");
  
  if (cachedIndex) {
    return cachedIndex;
  }

  // Last resort: return a simple offline HTML page
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - Lifestyle Assistant</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
      color: #333;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    h1 { margin: 0 0 1rem 0; }
    p { margin: 0.5rem 0; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>You're Offline</h1>
    <p>Please check your internet connection and try again.</p>
  </div>
</body>
</html>`,
    {
      status: 200,
      statusText: "OK",
      headers: { "Content-Type": "text/html" },
    }
  );
}
