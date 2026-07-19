---
title: Migration — Local to Hybrid
description: Step-by-step migration guide for switching from local on-device mode to hybrid search.
---

# Local to Hybrid Migration

## Current Setup
Your current configuration runs entirely on-device, generating a local index file during the build process and using templates to format answers:
```typescript
// .vitepress/config.ts
import DepthIndex from 'vitepress-plugin-depthindex';
export default {
  vite: {
    plugins: [DepthIndex()] // Default searchMode: 'on-device'
  }
}
```

## What Changes
- Search queries retrieve matching snippets locally, then send them to a cloud AI model (e.g. Gemini) to generate conversational responses.
- An API key is required. We recommend injecting the key via the `VITE_DEPTHINDEX_CLOUD_API_KEY` environment variable.

## Steps
1. Open `.vitepress/config.ts` and set `searchMode: 'hybrid'`.
2. Add the `cloudAPI` configuration block to define your provider and model:
   ```typescript
   DepthIndex({
     searchMode: 'hybrid',
     cloudAPI: {
       provider: 'gemini',
       model: 'gemini-1.5-flash'
     }
   })
   ```
3. Set the `VITE_DEPTHINDEX_CLOUD_API_KEY` environment variable on your local development machine and build servers.

## Test
1. Start your local dev server: `npm run dev`.
2. Submit a search query in the chat panel.
3. Open Developer Tools, check the **Network** tab, and verify that the request routes to the cloud provider's API successfully.
4. Verify that answers are streamed and include correct inline citations.

## Rollback
To revert back to on-device search:
1. Revert your `searchMode` setting to `'on-device'`.
2. Remove the `cloudAPI` settings block.
3. Clear your browser cache and IndexedDB database (`depthindex_secure_store`) to ensure the local index is reloaded.
