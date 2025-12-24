# Lifestyle Assistant

A Next.js 15+ PWA for tracking workouts, food, and supplements.

## Features

- ✅ Next.js 15+ with App Router
- ✅ TypeScript
- ✅ Tailwind CSS + shadcn/ui
- ✅ PWA support with custom service worker
- ✅ Offline functionality for app shell and key pages
- ✅ IndexedDB data persistence with Dexie
- ✅ Data export/import functionality

## Getting Started

### Install Dependencies

```bash
npm install
```

### Generate PWA Icons

You need to create two icon files in the `public` directory:
- `icon-192x192.png` (192x192 pixels)
- `icon-512x512.png` (512x512 pixels)

You can use any image editor or online tool to create these icons. Place them in the `public` folder.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

### Lint

```bash
npm run lint
```

## Pages

- `/` - Home page with navigation
- `/workouts` - Workout tracking
- `/food` - Food and nutrition logging
- `/supplements` - Supplement management
- `/log` - Activity log (offline-capable)
- `/settings` - App settings and data export/import

## PWA Features

The app is installable as a Progressive Web App. The service worker provides:
- **Offline support** for the app shell and all pages via navigation fallback
- **Cache-first strategy** for static assets (`/_next/static/*`, `/icons/*`, `/manifest.webmanifest`)
- **Network-first strategy** for API requests with offline fallback
- **Automatic cache versioning** via `SW_VERSION` constant in `public/sw.js`

### Service Worker Development

#### Enabling Service Worker in Development

By default, the service worker is **disabled in development mode** to prevent caching issues during development. To enable it:

1. Create a `.env.local` file in the project root (if it doesn't exist)
2. Add the following line:
   ```
   NEXT_PUBLIC_ENABLE_SW_IN_DEV=true
   ```
3. Restart your development server

#### Hard Refreshing Service Worker During Development

When you update the service worker (`public/sw.js`), you need to force browsers to update:

**Chrome/Edge:**
1. Open DevTools (F12)
2. Go to **Application** tab → **Service Workers**
3. Click **Unregister** next to the service worker
4. Check **"Bypass for network"** to disable SW temporarily
5. Or click **Update** to force an update
6. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

**Firefox:**
1. Open DevTools (F12)
2. Go to **Application** tab → **Service Workers**
3. Click **Unregister**
4. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

**Alternative Method (All Browsers):**
1. Open DevTools
2. Go to **Application** → **Storage** → **Clear site data**
3. Check **"Service Workers"** and click **Clear site data**
4. Hard refresh the page

#### Updating Service Worker Version

To force all users to get a new service worker version:

1. Edit `public/sw.js`
2. Update the `SW_VERSION` constant at the top of the file (e.g., change from `"1.0.0"` to `"1.0.1"`)
3. Rebuild and deploy

The service worker will automatically:
- Create new caches with the updated version
- Delete old caches from previous versions
- Take control of all pages immediately (`skipWaiting` + `clients.claim()`)

#### Service Worker Caching Strategies

- **Static Assets** (`/_next/static/*`, `/icons/*`, `/manifest.webmanifest`): Cache-first
- **API Requests** (`/api/*`): Network-first with offline fallback
- **Navigation Requests** (page navigations): Network-first, falls back to cached `/` if offline
- **Other Requests**: Network-first with cache fallback

## Data Management

All data is stored locally in IndexedDB using Dexie. You can export and import your data from the Settings page.

## Tech Stack

- Next.js 15+
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Dexie (IndexedDB)
- Lucide React (Icons)

