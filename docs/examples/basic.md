---
title: Basic Setup Example
description: Learn how to set up VitePress DepthIndex with the absolute minimum configuration.
---

# Basic Setup

## Minimal Configuration
To enable on-device search with all default configurations, register the plugin in your `.vitepress/config.ts` without passing options:
```typescript
import { defineConfig } from 'vitepress';
import DepthIndex from 'vitepress-plugin-depthindex';

export default defineConfig({
  title: 'My Project Docs',
  vite: {
    plugins: [
      DepthIndex() // Minimal setup
    ]
  }
});
```

## What You Get
With this zero-configuration setup, DepthIndex automatically provides:
- **On-Device Search & Synthesis**: Local BM25 query parsing and TF-IDF answers.
- **Auto-injected UI**: Search Modal integrations, floating launch button, and side chat assistant panel.
- **PWA Service Worker**: Pre-registered `/depthindex-sw.js` for offline support.
- **Search Metadata**: Automatic Open Graph tags, canonical injection, and AI sitemap generation.

## Testing
To verify your setup:
1. Start your local dev server: `npm run dev`.
2. Open the page in your browser and check for the floating chat button.
3. Open the search modal (`⌘K`) and verify that it displays inline AI answers as you type.
4. Run a production build (`npm run docs:build`) and verify that `dist/assets/depth-index.json` is generated correctly.

## Next Steps
- Customizing UI components: see [UI Customization](/guide/ui-customization).
- Restricting pages from index: see [Index Configuration](/guide/configuration).
- Enabling Hybrid search modes: see [Hybrid Mode Example](/examples/hybrid).
