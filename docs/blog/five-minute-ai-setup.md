---
title: "Turn Your VitePress Docs Into an AI Assistant in 5 Minutes"
description: "Add a conversational AI assistant to your VitePress documentation site with zero complex configuration."
---

# Turn Your VitePress Docs Into an AI Assistant in 5 Minutes

AI search is no longer a luxury for developer documentation—it is a standard expectation. Today, we are going to show you how to turn your static **VitePress** documentation site into an interactive AI assistant in under 5 minutes using **DepthIndex**.

## The Evolution of Doc Search

Traditional documentation search relies on keyword matching. If a developer searches for "how do I configure CORS", keyword search looks for that exact phrase or words. If your page uses the heading "Cross-Origin Resource Sharing", traditional search might miss it entirely.

DepthIndex introduces a local-first, semantic search engine that runs entirely inside the user's browser. It reads your site index, clusters search chunks, and synthesizes a natural, markdown-formatted response complete with inline citations.

## Quick Installation

First, install the plugin as a dependency in your VitePress project:

```bash
npm install vitepress-plugin-depthindex --save-dev
# or
pnpm add -D vitepress-plugin-depthindex
# or
yarn add -D vitepress-plugin-depthindex
```

## Configure VitePress

Open your `.vitepress/config.ts` file and register the plugin. The plugin defaults require zero initial configuration:

```typescript
import { defineConfig } from 'vitepress';
import DepthIndex from 'vitepress-plugin-depthindex';

export default defineConfig({
  title: 'My Project Docs',
  vite: {
    plugins: [
      DepthIndex() // Zero configuration required!
    ]
  }
});
```

Next, open your theme customizer at `.vitepress/theme/index.ts` (or create one) to mount the theme wrapper. DepthIndex extends VitePress's theme configuration automatically:

```typescript
import DefaultTheme from 'vitepress/theme';
import './custom.css'; // Optional custom styling

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Client-side initialization happens automatically!
  }
};
```

## What Users See

Once compiled, two key features are injected into your documentation:

1. **Floating AI Assistant Panel**: A sleek chat panel located at the bottom-right corner of the browser window. Users can click this button to open a conversation card, request summaries of the current page, or ask cross-page queries.
2. **Inline Search Assistant**: As users type into your standard VitePress search bar, an inline AI response block appears directly at the top of the search results, summarizing the answers to their queries.

## Build and Preview

To test your new AI assistant locally, run your VitePress build and preview command:

```bash
npm run docs:build
npm run docs:preview
```

You will see the crawler index your documentation in real-time, building a local semantic vocabulary map, and outputting the compiled files ready for offline-safe on-device execution.
