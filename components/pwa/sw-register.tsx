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

    // Register the service worker
    navigator.serviceWorker
      .register("/sw.js", {
        // Don't use HTTP cache for the service worker script itself
        updateViaCache: "none",
      })
      .then((registration) => {
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

        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      })
      .catch((error) => {
        console.error("[SW] Service Worker registration failed:", error);
      });

    // Listen for messages from the service worker
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "SKIP_WAITING") {
        // Reload the page when the new service worker is ready
        window.location.reload();
      }
    });
  }, []);

  return null;
}

