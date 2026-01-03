// Service Worker Version - Update this to bust cache
const SW_VERSION = "1.0.2";
const CACHE_PREFIX = "lifestyle-assistant";
const STATIC_CACHE = `${CACHE_PREFIX}-static-${SW_VERSION}`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}-dynamic-${SW_VERSION}`;
const APP_SHELL_CACHE = `${CACHE_PREFIX}-shell-${SW_VERSION}`;

// App shell URLs to precache - all main pages
const APP_SHELL_URLS = [
  "/",
  "/workouts",
  "/food",
  "/supplements",
  "/log",
  "/settings",
  "/manifest.webmanifest",
];

// Install event - precache app shell and all pages
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker version", SW_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Cache app shell pages
      caches
        .open(APP_SHELL_CACHE)
        .then(async (cache) => {
          console.log("[SW] Precaching app shell and all pages...");
          const results = [];
          
          // Cache each page individually to handle errors gracefully
          for (const url of APP_SHELL_URLS) {
            try {
              const response = await fetch(url);
              if (response.ok) {
                await cache.put(url, response);
                results.push(`✓ ${url}`);
                console.log(`[SW] Precached: ${url}`);
              } else {
                results.push(`✗ ${url} (${response.status})`);
                console.warn(`[SW] Failed to precache ${url}: ${response.status}`);
              }
            } catch (error) {
              results.push(`✗ ${url} (${error.message})`);
              console.warn(`[SW] Failed to precache ${url}:`, error.message);
            }
          }
          
          console.log("[SW] Precaching complete:", results.join(", "));
          return results;
        }),
      // Also cache in dynamic cache for fallback
      caches
        .open(DYNAMIC_CACHE)
        .then(async (cache) => {
          const results = [];
          for (const url of APP_SHELL_URLS) {
            try {
              const response = await fetch(url);
              if (response.ok) {
                await cache.put(url, response);
                results.push(`✓ ${url}`);
              }
            } catch (error) {
              // Silently continue
            }
          }
          return results;
        }),
    ]).then(() => {
      console.log("[SW] Initial precaching completed");
      // Trigger background precaching of assets after initial install
      // This happens asynchronously and won't block activation
      precacheAllPagesAndAssets().catch(err => {
        console.warn("[SW] Background precaching error:", err);
      });
    })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Message handler for background precaching
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "PRECACHE_ASSETS") {
    event.waitUntil(precacheAllPagesAndAssets());
  }
});

// Extract asset URLs from HTML content
function extractAssetUrls(html, baseUrl) {
  const assets = [];
  const base = new URL(baseUrl, self.location.origin);
  
  // Extract script tags
  const scriptRegex = /<script[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const url = new URL(match[1], base).href;
      if (url.startsWith(self.location.origin)) {
        assets.push(url);
      }
    } catch (e) {
      // Invalid URL, skip
    }
  }
  
  // Extract link tags (CSS, etc.)
  const linkRegex = /<link[^>]+href=["']([^"']+)["'][^>]*>/gi;
  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const url = new URL(match[1], base).href;
      if (url.startsWith(self.location.origin)) {
        assets.push(url);
      }
    } catch (e) {
      // Invalid URL, skip
    }
  }
  
  return assets;
}

// Background precaching function - precaches pages and their assets
async function precacheAllPagesAndAssets() {
  console.log("[SW] Starting background precaching of all pages and assets...");
  const dynamicCache = await caches.open(DYNAMIC_CACHE);
  const staticCache = await caches.open(STATIC_CACHE);
  
  const pagesToCache = [
    "/",
    "/workouts",
    "/food",
    "/supplements",
    "/log",
    "/settings",
  ];
  
  const assetUrls = new Set();
  
  // First, fetch and cache all HTML pages, and extract their asset URLs
  for (const pageUrl of pagesToCache) {
    try {
      const response = await fetch(pageUrl);
      if (response.ok) {
        const html = await response.text();
        await dynamicCache.put(pageUrl, new Response(html, {
          status: 200,
          statusText: "OK",
          headers: response.headers,
        }));
        console.log(`[SW] ✓ Precached page: ${pageUrl}`);
        
        // Extract asset URLs from HTML
        const assets = extractAssetUrls(html, pageUrl);
        assets.forEach(url => assetUrls.add(url));
      }
    } catch (error) {
      console.warn(`[SW] Failed to precache ${pageUrl}:`, error.message);
    }
  }
  
  // Now precache all discovered assets
  console.log(`[SW] Found ${assetUrls.size} unique assets to precache`);
  let cachedCount = 0;
  for (const assetUrl of assetUrls) {
    try {
      const response = await fetch(assetUrl);
      if (response.ok) {
        // Determine which cache to use based on URL
        const url = new URL(assetUrl);
        const cache = url.pathname.startsWith("/_next/") ? staticCache : dynamicCache;
        await cache.put(assetUrl, response);
        cachedCount++;
        if (cachedCount % 5 === 0) {
          console.log(`[SW] Precached ${cachedCount}/${assetUrls.size} assets...`);
        }
      }
    } catch (error) {
      // Silently continue - assets will be cached on-demand
    }
  }
  
  console.log(`[SW] ✓ Background precaching complete: ${cachedCount} assets cached`);
}

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

  // Strategy 1: Cache-first for ALL Next.js static assets (JS, CSS, chunks, etc.)
  // This includes webpack.js, main-app.js, layout.js, layout.css, and all other Next.js assets
  if (
    url.pathname.startsWith("/_next/") ||
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
  // Check for navigation requests more aggressively:
  // 1. Explicit navigate mode (full page loads)
  // 2. HTML requests (Accept header contains text/html)
  // 3. Requests that look like pages (not starting with /_next/ or /api/)
  const acceptHeader = request.headers.get("accept") || "";
  const isNavigationRequest = 
    request.mode === "navigate" ||
    (acceptHeader.includes("text/html") && 
     !url.pathname.startsWith("/_next/") &&
     !url.pathname.startsWith("/api/") &&
     !url.pathname.includes(".")); // Exclude files with extensions

  if (isNavigationRequest) {
    console.log("[SW] Intercepting navigation request:", url.pathname, "mode:", request.mode, "accept:", acceptHeader);
    event.respondWith(navigationFallback(request));
    return;
  }

  // Strategy 4: Network-first for other requests (CSS, JS, images, etc.)
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// Cache-first strategy: Check cache first, fallback to network
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const url = new URL(request.url);
  
  // Try multiple cache matching strategies to handle query params and variations
  let cachedResponse = await cache.match(request);
  
  if (!cachedResponse) {
    // Try matching without query params
    cachedResponse = await cache.match(url.pathname, { ignoreSearch: true });
  }
  
  if (!cachedResponse) {
    // Try matching with ignoreMethod
    cachedResponse = await cache.match(request, { ignoreMethod: true, ignoreSearch: true });
  }
  
  if (cachedResponse) {
    console.log("[SW] ✓ Serving cached asset:", url.pathname);
    return cachedResponse;
  }

  // Not in cache, try network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful responses for offline use
      try {
        await cache.put(request, networkResponse.clone());
        console.log("[SW] ✓ Cached new asset:", url.pathname);
      } catch (cacheError) {
        console.warn("[SW] Failed to cache asset:", url.pathname, cacheError);
      }
    }
    return networkResponse;
  } catch (error) {
    // If offline and no cache, log and return error
    console.warn("[SW] ✗ Asset not cached and network failed:", url.pathname);
    // Return a more helpful error response based on file type
    const contentType = url.pathname.endsWith('.js') ? 'application/javascript' :
                        url.pathname.endsWith('.css') ? 'text/css' : 'text/plain';
    return new Response("// Asset not available offline", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": contentType },
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

// Navigation fallback: Try network, fallback to cached route, then cached "/", then offline page
async function navigationFallback(request) {
  const url = new URL(request.url);
  const dynamicCache = await caches.open(DYNAMIC_CACHE);
  const shellCache = await caches.open(APP_SHELL_CACHE);

  console.log("[SW] Navigation fallback for:", url.pathname);

  // Try network first (with timeout to avoid hanging)
  try {
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Network timeout")), 5000)
    );
    
    const networkResponse = await Promise.race([networkPromise, timeoutPromise]);
    
    if (networkResponse && networkResponse.ok) {
      // Cache the response for offline use
      try {
        // Clone before caching to avoid consuming the response
        const responseClone = networkResponse.clone();
        await dynamicCache.put(request, responseClone);
        console.log("[SW] ✓ Cached network response for:", url.pathname);
      } catch (cacheError) {
        console.warn("[SW] Failed to cache response:", cacheError);
      }
      return networkResponse;
    }
  } catch (error) {
    // Network failed or timed out, continue to cache fallback
    console.log("[SW] Network failed for navigation:", url.pathname, error.message);
  }

  // Try multiple cache matching strategies
  // 1. Exact match of the request
  let cachedRoute = await dynamicCache.match(request);
  if (cachedRoute) {
    console.log("[SW] ✓ Serving exact cached route:", url.pathname);
    return cachedRoute;
  }

  // 2. Match by URL string (ignore query params, etc.)
  cachedRoute = await dynamicCache.match(url.pathname);
  if (cachedRoute) {
    console.log("[SW] ✓ Serving cached route by pathname:", url.pathname);
    return cachedRoute;
  }

  // 3. Try matching with different request options
  const matchOptions = [
    { ignoreSearch: true },
    { ignoreMethod: true, ignoreSearch: true },
  ];
  
  for (const options of matchOptions) {
    cachedRoute = await dynamicCache.match(request, options);
    if (cachedRoute) {
      console.log("[SW] ✓ Serving cached route with options:", url.pathname, options);
      return cachedRoute;
    }
  }

  // 4. Try to get cached "/" as fallback (app shell) from shell cache
  const cachedIndex = await shellCache.match("/");
  if (cachedIndex) {
    console.log("[SW] ✓ Serving cached app shell for:", url.pathname);
    return cachedIndex;
  }

  // 5. Try dynamic cache for "/"
  const cachedIndexDynamic = await dynamicCache.match(new Request("/"));
  if (cachedIndexDynamic) {
    console.log("[SW] ✓ Serving cached index from dynamic cache for:", url.pathname);
    return cachedIndexDynamic;
  }

  // 6. Try any cached HTML page as last resort
  const allCaches = [dynamicCache, shellCache];
  for (const cache of allCaches) {
    const keys = await cache.keys();
    for (const key of keys) {
      const keyUrl = new URL(key.url);
      if (keyUrl.pathname === "/" || keyUrl.pathname.match(/^\/(workouts|food|supplements|log|settings)$/)) {
        const cached = await cache.match(key);
        if (cached) {
          console.log("[SW] ✓ Serving fallback cached page:", keyUrl.pathname, "for requested:", url.pathname);
          return cached;
        }
      }
    }
  }

  // Last resort: return a simple offline HTML page
  console.log("[SW] ✗ No cache available, serving offline page for:", url.pathname);
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
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>You're Offline</h1>
    <p>This page is not available offline.</p>
    <p><a href="/">Go to Home</a></p>
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
