---
title: Migration — Cloud to Hybrid
description: Step-by-step migration guide for switching from cloud-only mode to hybrid search.
---

# Cloud to Hybrid Migration

## Current Setup
Your current setup relies on cloud-only search and reasoning without generating a local search index:
```typescript
DepthIndex({
  searchMode: 'cloud',
  cloudAPI: {
    provider: 'openai',
    model: 'gpt-4o'
  }
})
```

## What Changes
- Build-time indexing is re-enabled to generate the compressed index file `depth-index.json`.
- Queries perform local BM25 and vector filtering, reducing token costs by only sending relevant snippets to the cloud.
- Enables offline local search fallbacks when connection is lost.

## Steps
1. Open `.vitepress/config.ts` and set `searchMode: 'hybrid'`.
2. Ensure build-time page crawling and indexing configurations are enabled.

## Test
1. Re-run your production build: `npm run docs:build`.
2. Verify that the build outputs the compressed index payload `assets/depth-index.json`.
3. Submit a query in your browser, and verify that the request to the cloud provider contains only relevant document snippets.

## Rollback
To revert back:
1. Revert your `searchMode` setting to `'cloud'`.
2. Run the build to verify that local index generation is skipped.
