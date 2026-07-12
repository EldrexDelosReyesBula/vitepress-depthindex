---
title: Installation Guide
description: Step-by-step instructions to install and configure vitepress-plugin-depthindex.
---

# Installation Guide

You can install VitePress DepthIndex into your project using npm, yarn, or pnpm.

## Prerequisites
* **VitePress**: `^1.0.0`
* **Vue**: `^3.3.0`
* **Node.js**: `^18.0.0` or higher

## Install Package

Run one of the following commands in your project root:

```bash
# npm
npm install vitepress-plugin-depthindex --save-dev

# pnpm
pnpm add -D vitepress-plugin-depthindex

# yarn
yarn add -D vitepress-plugin-depthindex
```

## Adding to VitePress Config

Register the plugin in your `.vitepress/config.ts` (or `.vitepress/config.js`):

```typescript
import { defineConfig } from 'vitepress';
import DepthIndex from 'vitepress-plugin-depthindex';

export default defineConfig({
  title: 'My Documentation Site',
  
  vite: {
    plugins: [
      DepthIndex({
        searchMode: 'hybrid', // local search + optional cloud reasoning
        ui: {
          position: 'bottom-right',
          showFloatingButton: true
        },
        offline: {
          enabled: true // registers service worker
        }
      })
    ]
  }
});
```
This is all you need to do! The plugin will automatically hook into your build pipeline, generate index files, compile your documentation outline, and inject the client floating button onto all generated pages.
