---
title: Migration — Cloud to Local
description: Step-by-step migration guide for switching from cloud-only mode to on-device search.
---

# Cloud to Local Migration

## Current Setup
Your current setup relies on cloud-only search and reasoning without generating a local search index:
```typescript
DepthIndex({
  searchMode: 'cloud',
  cloudAPI: {
    provider: 'gemini',
    model: 'gemini-1.5-flash'
  }
})
```

## What Changes
- Search and synthesis run entirely client-side, eliminating cloud AI API costs and allowing fully offline search.
- Bypasses cloud AI providers, using local templates to format answers.

## Steps
1. Open `.vitepress/config.ts` and set `searchMode: 'on-device'`.
2. Remove the `cloudAPI` configuration block and clean up environment variables.

## Test
1. Re-run your production build: `npm run docs:build`.
2. Verify that the build outputs the compressed index payload `assets/depth-index.json`.
3. Submit a query in your browser while offline and verify that on-device search and synthesis generate responses successfully.

## Rollback
To revert back:
1. Revert your `searchMode` setting to `'cloud'`.
2. Re-add your AI provider settings and re-inject your API keys.
