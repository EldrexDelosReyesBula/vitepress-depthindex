---
title: Cloud-Only Mode
description: Learn how to configure cloud-only deployments to minimize build size and compile times.
---

# Cloud-Only Mode

## Overview
VitePress DepthIndex features a lightweight **Cloud-Only Mode** (`searchMode: 'cloud'`) designed for large documentation portals. In this mode, on-device vector indexing is bypassed, and all search queries and answer generation are handled by cloud AI models.

## How Works
When configured in cloud mode:
1. The client runtime does not download or decompress search indexes in the browser.
2. Search queries entered in the search bar or chat panel are sent directly to the configured cloud provider endpoint.
3. The cloud model uses your documentation's context to synthesize answers, referencing source files dynamically.

## Build Process

### What's Generated
During `npm run docs:build`, DepthIndex generates:
- A page manifest JSON file (`page-manifest.json`) containing URL lookup indexes and title mappings.
- Standardized text formats (`llms.txt`, `llms-full.txt`, and `llms.jsonl`) for cloud model parsing.
- Service worker fallback configurations.

### What's Skipped
The build pipeline skips:
- Page text extraction and overlapping chunking.
- TF-IDF vector generation and inverted index mapping.
- The compilation of the compressed JSON search index (`assets/depth-index.json`).

## Benefits

### Smaller Build Size
By skipping the local index file, you can save significant bandwidth. For sites with thousands of pages, the JSON search index can grow to several megabytes; in cloud mode, the client only downloads a lightweight metadata manifest (~15KB).

### Faster Build Time
Bypassing chunking, vectorization, and compression stages reduces build times on CI/CD platforms (like Vercel, Netlify, or GitHub Actions), especially for large codebases.

## Requirements
To run DepthIndex in cloud-only mode, you must have:
- An active internet connection for client browsers.
- A configured cloud AI provider (Gemini, OpenAI, or Anthropic).
- A valid API key configured in the settings or injected via environment variables.

## Configuration
Configure cloud mode in `.vitepress/config.ts`:
```typescript
import DepthIndex from 'vitepress-plugin-depthindex';

export default {
  vite: {
    plugins: [
      DepthIndex({
        searchMode: 'cloud',
        cloudAPI: {
          provider: 'openai',
          model: 'gpt-4o',
          apiKey: process.env.OPENAI_API_KEY // Or use VITE_DEPTHINDEX_CLOUD_API_KEY
        }
      })
    ]
  }
}
```

## Limitations
- **No Offline Support**: If the user loses internet access, search and AI synthesis will fail.
- **API Latency**: Responses are subject to network transmission speeds and cloud model processing times.
- **Token Costs**: Every user query counts against your AI provider token usage and API limits.

## Offline Behavior
If the user goes offline in cloud-only mode:
- The floating chat assistant displays an offline notification.
- Inline search bar answers are disabled, falling back to VitePress's built-in local search matching.
- An error message is displayed if the user tries to send queries in the chat panel.

## Switching to Other Modes
You can migrate back to local-first modes by setting `searchMode: 'hybrid'` or `searchMode: 'on-device'`. Doing so will re-enable build-time index generation, ensuring that search and AI features remain functional offline. See the [Switching Modes Guide](/guide/switching-modes) for details.
