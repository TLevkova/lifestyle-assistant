"use client";

import { useEffect } from "react";

export function ManifestLink() {
  useEffect(() => {
    // Safely add manifest link to document head
    // This component returns null, so it won't affect layout at all
    if (typeof document !== "undefined" && document.head) {
      const existingLink = document.querySelector('link[rel="manifest"]');
      if (!existingLink) {
        const link = document.createElement("link");
        link.rel = "manifest";
        link.href = "/manifest.webmanifest";
        document.head.appendChild(link);
      }
    }
  }, []);

  // Return null - this component renders nothing, so it won't affect layout
  return null;
}

