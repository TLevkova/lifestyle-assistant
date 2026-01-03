"use client";

import { useEffect } from "react";

/**
 * Service Worker Registration Component
 * 
 * Registers the service worker for offline functionality.
 * 
 * Development mode: Set ENABLE_SW_IN_DEV=true in your environment to enable SW in dev.
 * Production mode: SW is always enabled.
 */
/**
 * Unregister all service workers for this origin
 * Useful for development cleanup - handles stopped workers aggressively
 */
export async function unregisterAllServiceWorkers(): Promise<{ unregistered: number; cachesCleared: number }> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return { unregistered: 0, cachesCleared: 0 };
  }

  let unregisteredCount = 0;
  let cachesClearedCount = 0;

  try {
    // Get all registrations
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`[SW] Found ${registrations.length} service worker registration(s)`);
    
    // Try to unregister each one, even if stopped
    for (const registration of registrations) {
      try {
        // Try to wake up stopped workers by getting their active/installing/waiting workers
        if (registration.active) {
          try {
            registration.active.postMessage({ type: "TERMINATE" });
          } catch (e) {
            // Ignore errors - worker might be stopped
          }
        }
        
        // Attempt unregister with timeout
        const unregisterPromise = registration.unregister();
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(false), 2000);
        });
        
        const unregistered = await Promise.race([unregisterPromise, timeoutPromise]);
        
        if (unregistered) {
          unregisteredCount++;
          console.log(`[SW] ✓ Unregistered service worker: ${registration.scope}`);
        } else {
          console.warn(`[SW] ⚠ Timeout or failed to unregister: ${registration.scope}`);
          // Try alternative method: update then unregister
          try {
            await registration.update();
            const retryUnregister = await registration.unregister();
            if (retryUnregister) {
              unregisteredCount++;
              console.log(`[SW] ✓ Unregistered after retry: ${registration.scope}`);
            }
          } catch (retryError) {
            console.error(`[SW] ✗ Failed to unregister after retry: ${registration.scope}`, retryError);
          }
        }
      } catch (error) {
        console.error(`[SW] ✗ Error unregistering ${registration.scope}:`, error);
      }
    }

    // Clear all caches
    if ("caches" in window) {
      try {
        const cacheNames = await caches.keys();
        console.log(`[SW] Found ${cacheNames.length} cache(s)`);
        
        for (const cacheName of cacheNames) {
          try {
            const deleted = await caches.delete(cacheName);
            if (deleted) {
              cachesClearedCount++;
              console.log(`[SW] ✓ Deleted cache: ${cacheName}`);
            }
          } catch (error) {
            console.warn(`[SW] ⚠ Failed to delete cache ${cacheName}:`, error);
          }
        }
        console.log(`[SW] Cleared ${cachesClearedCount} cache(s)`);
      } catch (error) {
        console.error("[SW] Error clearing caches:", error);
      }
    }

    // Force update service worker controller if it exists
    if (navigator.serviceWorker.controller) {
      try {
        navigator.serviceWorker.controller.postMessage({ type: "TERMINATE" });
      } catch (e) {
        // Ignore
      }
    }

    return { unregistered: unregisteredCount, cachesCleared: cachesClearedCount };
  } catch (error) {
    console.error("[SW] Error in cleanup:", error);
    return { unregistered: unregisteredCount, cachesCleared: cachesClearedCount };
  }
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Check if we should register the service worker
    const isProduction = process.env.NODE_ENV === "production";
    const enableInDev = process.env.NEXT_PUBLIC_ENABLE_SW_IN_DEV === "true";

    if (!isProduction && !enableInDev) {
      console.log(
        "[SW] Service worker disabled in development. Set NEXT_PUBLIC_ENABLE_SW_IN_DEV=true to enable."
      );
      return;
    }

    // Clean up old registrations in development (optional - comment out if you want to keep them)
    const cleanupOldWorkers = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        // Only keep the most recent registration, unregister others
        if (registrations.length > 1) {
          console.log(`[SW] Found ${registrations.length} registrations, cleaning up old ones...`);
          // Sort by scope to keep the root scope (most likely the current one)
          registrations.sort((a, b) => {
            if (a.scope === location.origin + "/") return -1;
            if (b.scope === location.origin + "/") return 1;
            return 0;
          });
          // Unregister all except the first one
          for (let i = 1; i < registrations.length; i++) {
            await registrations[i].unregister();
            console.log(`[SW] Unregistered old service worker: ${registrations[i].scope}`);
          }
        }
      } catch (error) {
        console.warn("[SW] Error cleaning up old service workers:", error);
      }
    };

    // Register the service worker
    const registerSW = async () => {
      try {
        // Optional: Clean up old workers first (uncomment if needed)
        // await cleanupOldWorkers();

        const registration = await navigator.serviceWorker.register("/sw.js", {
          // Don't use HTTP cache for the service worker script itself
          updateViaCache: "none",
        });

        console.log(
          "[SW] Service Worker registered successfully:",
          registration.scope
        );

        // Check for updates periodically
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("[SW] New service worker available. Reload to update.");
              // Optionally, you could show a toast notification here
            }
          });
        });

        // Trigger background precaching after service worker is ready
        if (registration.installing) {
          registration.installing.addEventListener("statechange", () => {
            if (registration.installing?.state === "installed" && navigator.serviceWorker.controller) {
              // Service worker is ready, trigger background precaching
              navigator.serviceWorker.controller.postMessage({ type: "PRECACHE_ASSETS" });
            }
          });
        } else if (registration.waiting) {
          registration.waiting.addEventListener("statechange", () => {
            if (registration.waiting?.state === "activated") {
              navigator.serviceWorker.controller?.postMessage({ type: "PRECACHE_ASSETS" });
            }
          });
        } else if (navigator.serviceWorker.controller) {
          // Service worker is already active, trigger precaching immediately
          navigator.serviceWorker.controller.postMessage({ type: "PRECACHE_ASSETS" });
        }

        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      } catch (error) {
        console.error("[SW] Service Worker registration failed:", error);
      }
    };

    registerSW();

    // Listen for messages from the service worker
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "SKIP_WAITING") {
        // Reload the page when the new service worker is ready
        window.location.reload();
      }
    });

    // Expose cleanup and diagnostic functions to window for manual use
    if (typeof window !== "undefined") {
      (window as any).unregisterAllServiceWorkers = unregisterAllServiceWorkers;
      (window as any).diagnoseServiceWorker = async () => {
        if (!("serviceWorker" in navigator)) {
          console.log("[SW] Service workers not supported");
          return;
        }

        console.log("=== Service Worker Diagnosis ===");
        
        // Check registration
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log(`[SW] Registrations: ${registrations.length}`);
        registrations.forEach((reg, i) => {
          console.log(`  ${i + 1}. Scope: ${reg.scope}`);
          console.log(`     Active: ${reg.active?.state || "none"}`);
          console.log(`     Installing: ${reg.installing?.state || "none"}`);
          console.log(`     Waiting: ${reg.waiting?.state || "none"}`);
        });

        // Check controller
        console.log(`[SW] Controller: ${navigator.serviceWorker.controller ? "YES" : "NO"}`);
        if (navigator.serviceWorker.controller) {
          console.log(`  State: ${navigator.serviceWorker.controller.state}`);
          console.log(`  Script URL: ${navigator.serviceWorker.controller.scriptURL}`);
        }

        // Check caches
        if ("caches" in window) {
          const cacheNames = await caches.keys();
          console.log(`[SW] Caches: ${cacheNames.length}`);
          for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            console.log(`  ${cacheName}: ${keys.length} items`);
            keys.slice(0, 5).forEach((key) => {
              console.log(`    - ${key.url}`);
            });
            if (keys.length > 5) {
              console.log(`    ... and ${keys.length - 5} more`);
            }
          }
        }

        console.log("=== End Diagnosis ===");
      };
    }
  }, []);

  return null;
}

