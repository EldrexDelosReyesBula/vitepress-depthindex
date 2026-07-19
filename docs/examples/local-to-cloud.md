---
title: Migration — Local to Cloud
description: Step-by-step migration guide for switching from local on-device mode to cloud-only search.
---

# Local to Cloud Migration

## Current Setup
Your current configuration runs entirely on-device, generating a local search index file during the build process:
```typescript
import DepthIndex from 'vitepress-plugin-depthindex';
export default {
  vite: {
    plugins: [DepthIndex()] // searchMode: 'on-device'
  }
}
```

## What Changes
- Search index generation is bypassed during compilation, reducing output build sizes and speed up deploy builds.
- All search and chat queries are processed in the cloud, requiring an active internet connection.

## Steps
1. Change your configuration to set `searchMode: 'cloud'`.
2. Configure your AI provider settings under `cloudAPI`:
   ```typescript
   DepthIndex({
     searchMode: 'cloud',
     cloudAPI: {
       provider: 'openai',
       model: 'gpt-4o-mini'
     }
   })
   ```
3. Set the `VITE_DEPTHINDEX_CLOUD_API_KEY` environment variable in your deploy configurations.

## Test
1. Run a production build: `npm run docs:build`.
2. Verify that `assets/depth-index.json` is not generated, but `page-manifest.json` is present.
3. Open the site in your browser and verify that searches route requests to the cloud provider successfully.

## Rollback
To revert back:
1. Revert your `searchMode` setting to `'on-device'`.
2. Remove the `cloudAPI` configurations block.
3. Clear your browser cache and rebuild the index files.
