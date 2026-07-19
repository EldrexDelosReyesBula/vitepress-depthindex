---
title: Migration — Hybrid to Local
description: Step-by-step migration guide for switching from hybrid mode to on-device search.
---

# Hybrid to Local Migration

## Current Setup
Your current setup queries a local index and forwards matching snippets to a cloud AI model:
```typescript
DepthIndex({
  searchMode: 'hybrid',
  cloudAPI: {
    provider: 'gemini',
    model: 'gemini-1.5-flash'
  }
})
```

## What Changes
- Search and synthesis run entirely on-device in the browser, eliminating AI API costs.
- The assistant uses local text templates instead of generative models to synthesize answers.

## Steps
1. Open `.vitepress/config.ts` and set `searchMode: 'on-device'`.
2. Remove the `cloudAPI` configuration block.
3. Clean up the `VITE_DEPTHINDEX_CLOUD_API_KEY` environment variables from your build environments.

## Test
1. Start your local dev server: `npm run dev`.
2. Go to the Network tab in Developer Tools.
3. Submit a query in the chat panel.
4. Verify that no requests are sent to external cloud AI APIs, and that answers are generated locally.

## Rollback
To switch back to hybrid mode:
1. Restore your `searchMode: 'hybrid'` setting.
2. Re-add your AI provider settings and re-inject your API keys.
