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
- Offline support for the app shell
- Offline support for `/` and `/log` pages
- Caching of static assets

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

