---
title: Installation
description: Requirements, installation steps, and troubleshooting for VitePress DepthIndex.
---

# Installation

## Requirements

### Node.js Version
VitePress DepthIndex requires **Node.js 18.x** or higher. It is recommended to use the latest Active LTS version of Node.js.

### VitePress Version
Supports **VitePress 1.0.0** or higher. The plugin integrates with VitePress's page extraction hooks during the build phase.

### Vue Version
Requires **Vue 3.3.0** or higher. The client UI elements (floating launcher button, search modal, and side chat assistant panel) are compiled as modern Vue components.

## Package Installation

Install the package via your preferred package manager:

### npm
```bash
npm install vitepress-plugin-depthindex
```

### pnpm
```bash
pnpm add vitepress-plugin-depthindex
```

### yarn
```bash
yarn add vitepress-plugin-depthindex
```

## Adding to VitePress Config
Open `.vitepress/config.ts` (or `.vitepress/config.mts`) and add DepthIndex to your configuration:
```typescript
import { defineConfig } from 'vitepress';
import DepthIndex from 'vitepress-plugin-depthindex';

export default defineConfig({
  title: 'VitePress DepthIndex Docs',
  vite: {
    plugins: [
      DepthIndex() // Zero options configuration runs all default properties
    ]
  }
});
```

## Verifying Installation
Start your VitePress dev server locally:
```bash
npm run dev
```
Verify the following checks:
1. Inspect the terminal console output: There should be no compilation errors, missing module warnings, or dependency alerts.
2. Open the page in your browser: A floating chat trigger with a comment icon should appear in the bottom-right corner.
3. Open Developer Tools (F12) Console: You should see the device profiling output e.g., `[DepthIndex] Device tier: high`.

## First Build
To compile your site for production and build the search index:
```bash
npm run docs:build
```
During compilation, DepthIndex will:
1. Extract page chunks, headings, links, and code blocks from all your markdown files.
2. Build vocabulary tables and Inverse Document Frequencies.
3. Emit a compressed and base64-encoded index to `dist/assets/depth-index.json`.
4. Pre-register the Service Worker file `dist/depthindex-sw.js` and CSS assets.
5. Generate `dist/llms.txt` and `dist/llms.jsonl` files in the output directory.

## Troubleshooting Installation

### "Cannot find module" errors
If you get `Cannot find module 'vitepress-plugin-depthindex'` during build:
- Verify that the package has been correctly added to your `package.json` under `dependencies` or `devDependencies`.
- Delete `node_modules` and run a clean install:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

### TypeScript errors
If your build fails due to TypeScript compilation issues:
- Check that your `tsconfig.json` contains appropriate paths and references.
- Make sure that you have `moduleResolution: "node"` or `"bundler"` set in `compilerOptions` since this is a modern ESM module.
- Cast the plugin registry import inside `.vitepress/config.ts` if your VitePress configuration uses strict typings:
  ```typescript
  plugins: [DepthIndex() as any]
  ```

### Build failures
If the build process gets stuck or errors during crawler steps:
- Ensure there are no corrupt or massive binary files (like large images or PDFs) inside your markdown source directories.
- Add folders to `indexConfig.excludePages` to bypass them. For example:
  ```typescript
  DepthIndex({
    indexConfig: {
      excludePages: ['/templates/**', '/private/**']
    }
  })
  ```
