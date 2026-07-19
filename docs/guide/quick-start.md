---
title: Quick Start
description: Get started with VitePress DepthIndex in under 5 minutes.
---

# Quick Start

## Prerequisites
Before you start, make sure you have:
- **Node.js**: Version `18.x` or higher.
- **VitePress**: Version `1.0.0` or higher.
- **Vue**: Version `3.3.0` or higher.

## Step 1: Create VitePress Project
If you do not have an active VitePress site yet, you can create one quickly:
```bash
npm add -D vitepress vue
npx vitepress init
```
Follow the interactive prompts to set up your target directories and themes.

## Step 2: Install DepthIndex
Add the DepthIndex plugin to your project using your package manager of choice:
```bash
npm install vitepress-plugin-depthindex
```
For other package managers, run:
```bash
# pnpm
pnpm add vitepress-plugin-depthindex

# yarn
yarn add vitepress-plugin-depthindex
```

## Step 3: Add to Config
Open your `.vitepress/config.ts` (or `.vitepress/config.mts`) and add DepthIndex as a Vite plugin:
```typescript
import { defineConfig } from 'vitepress';
import DepthIndex from 'vitepress-plugin-depthindex';

export default defineConfig({
  title: "My Documentation",
  vite: {
    plugins: [
      DepthIndex() // Zero configuration: uses all default values
    ]
  }
});
```

## Step 4: Start Dev Server
Run your development server locally:
```bash
npm run dev
```
Open your browser and navigate to the local address (typically `http://localhost:5173`).

## Step 5: Test the AI
Once the server is running:
1. You will see a floating chat button with a messaging icon in the bottom-right corner of the page.
2. Click the button to open the sidebar chat panel.
3. Type a message like `"Summarize this page"` or `"Hi"` and press Enter. The on-device engine will process the query and synthesize an answer instantly.
4. Press `⌘K` or `Ctrl+K` to open the search modal, where the search bar displays inline AI answers directly.

## What You Get
By installing DepthIndex with zero config, the plugin automatically provides:
- **On-Device Search & Synthesis**: Local BM25 query parsing and TF-IDF answers.
- **Auto-injected UI**: Search Modal integrations, floating launch button, and side chat assistant panel.
- **PWA Service Worker**: Pre-registered `/depthindex-sw.js` for offline support.
- **Search Metadata**: Automatic Open Graph tags, canonical injection, and AI sitemap generation.

## Next Steps
- Review [Installation Guide](/guide/installation) for advanced setup and troubleshooting.
- Check [Configuration Guide](/guide/configuration) to customize settings.
- Learn [How It Works](/guide/how-it-works) to explore the indexing pipeline.
