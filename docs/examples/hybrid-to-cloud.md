---
title: Migration — Hybrid to Cloud
description: Step-by-step migration guide for switching from hybrid mode to cloud-only search.
---

# Hybrid to Cloud Migration

## Current Setup
Your current setup queries a local index and forwards matching snippets to a cloud AI model:
```typescript
DepthIndex({
  searchMode: 'hybrid',
  cloudAPI: {
    provider: 'openai',
    model: 'gpt-4o-mini'
  }
})
```

## What Changes
- Search indexing is skipped during compilation, reducing output build sizes.
- Content chunking and TF-IDF mappings are bypassed.

## Steps
1. Open `.vitepress/config.ts` and set `searchMode: 'cloud'`.
2. Keep your `cloudAPI` provider settings and API keys.

## Test
1. Re-run your production build: `npm run docs:build`.
2. Verify that the build completes faster and does not output `assets/depth-index.json`.
3. Open the site in your browser and verify that searches route requests to the cloud provider successfully.

## Rollback
To revert back:
1. Revert your `searchMode` setting to `'hybrid'`.
2. Re-run the production build to compile the search index file.
