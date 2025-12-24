/**
 * Head component for PWA manifest and meta tags
 * 
 * This file injects essential PWA-related tags into the document head.
 * Uses inline script that executes IMMEDIATELY when HTML loads, before React.
 * 
 * Verification steps:
 * 1. Open http://localhost:3000/manifest.webmanifest -> should show JSON (not HTML)
 * 2. View page source and search for "manifest" -> should find <link rel="manifest">
 * 3. DevTools -> Application -> Manifest should populate
 * 4. If it still doesn't show: Clear site data (Application -> Clear storage), hard reload, restart dev server
 */

export default function Head() {
  // This inline script runs IMMEDIATELY when the HTML loads, before React
  // This ensures the manifest link is present when Chrome checks for it
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            if (typeof document !== 'undefined' && document.head) {
              // Manifest link - CRITICAL for PWA detection
              if (!document.querySelector('link[rel="manifest"]')) {
                var manifestLink = document.createElement('link');
                manifestLink.rel = 'manifest';
                manifestLink.href = '/manifest.webmanifest';
                document.head.insertBefore(manifestLink, document.head.firstChild);
              }
            }
          })();
        `,
      }}
    />
  );
}

