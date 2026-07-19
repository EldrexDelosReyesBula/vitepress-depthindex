---
title: Switching Between Search Modes
description: Comprehensive migration guide for switching search modes in VitePress DepthIndex.
---

# Switching Between Search Modes

## Overview
VitePress DepthIndex allows you to switch between search modes (`on-device`, `hybrid`, and `cloud`) as your project grows. This guide explains the differences, migration steps, and testing procedures for each mode.

## Mode Comparison Table
| Metric | On-Device Mode | Hybrid Mode | Cloud Mode |
| :--- | :--- | :--- | :--- |
| **API Key Required** | No | Yes | Yes |
| **Index Generated** | Yes (`assets/depth-index.json`) | Yes (`assets/depth-index.json`) | No |
| **Offline Fallback** | N/A (Fully Offline) | Yes (Local search) | No |
| **Build Size** | Larger (Index included) | Larger (Index included) | Minimal |

## Before You Switch
Before changing search modes, check the following prerequisites:
- Backup your current `.vitepress/config.ts` configuration.
- For `hybrid` and `cloud` modes, ensure you have valid API keys from your AI provider (Google Gemini, OpenAI, or Anthropic).
- Set up local environment variables for API key injection in your build environment.

## Migration Steps

### Local to Hybrid
To migrate from local-only search to hybrid model synthesis:
1. Open `.vitepress/config.ts` and set `searchMode: 'hybrid'`.
2. Add your cloud provider configuration under `cloudAPI`.
3. Set your API key as an environment variable (`VITE_DEPTHINDEX_CLOUD_API_KEY`) to prevent exposing it in source control:
```typescript
DepthIndex({
  searchMode: 'hybrid',
  cloudAPI: {
    provider: 'gemini',
    model: 'gemini-1.5-flash'
  }
})
```

### Local to Cloud
To switch to cloud-only processing (useful for large documentation sites):
1. Change `searchMode` to `'cloud'`.
2. Set up your `cloudAPI` provider configurations.
3. Remove any local index caching references from your progressive web app configuration.

### Hybrid to Local
To migrate back to completely offline search:
1. Set `searchMode: 'on-device'`.
2. Remove the `cloudAPI` block from your configuration.
3. Clean up any environment variables relating to AI provider keys.

### Hybrid to Cloud
To move from local-first search to full cloud execution:
1. Set `searchMode: 'cloud'`.
2. Double check that your API endpoint and models are configured correctly.

### Cloud to Hybrid
To add local search capabilities to a cloud-only setup:
1. Set `searchMode: 'hybrid'`.
2. Re-enable build index generation in your configuration.

### Cloud to Local
To convert a cloud-dependent site to a completely offline setup:
1. Set `searchMode: 'on-device'`.
2. Ensure build index generation is enabled to compile the required JSON index payload.

## Build Changes
- **Local/Hybrid Modes**: The build process parses all markdown pages to generate a compressed search index file (`assets/depth-index.json`).
- **Cloud Mode**: Index generation is skipped. The build only emits a lightweight page manifest for URL lookup and metadata references.

## User Experience Changes
- **Local Mode**: Zero-latency search and template-based answers.
- **Hybrid/Cloud Modes**: Responses are generated using LLM models, which may add streaming latency but provide more detailed, conversational answers.

## Testing After Switch
After switching search modes, run these verification steps:
1. Start your local dev server and test queries in the search modal.
2. Verify that citations reference the correct document URLs.
3. Check the developer console for network requests: hybrid/cloud modes should make API calls, while local mode should run entirely offline.

## Rollback Instructions
If you encounter issues after switching:
1. Revert your `searchMode` configuration in `.vitepress/config.ts`.
2. Clear your browser cache and IndexedDB storage (`depthindex_secure_store`) to remove stale indexes.
3. Restart your development server: `npm run dev`.

## Common Issues
- **Missing API Keys**: If hybrid/cloud mode fails with authorization errors, verify that `VITE_DEPTHINDEX_CLOUD_API_KEY` is set correctly in your environment.
- **Index Load Failures**: If switching from cloud to hybrid mode, ensure that `assets/depth-index.json` is generated correctly during the build phase.
