---
title: Search Modes
description: Contrast the On-Device, Hybrid, and Cloud search modes of VitePress DepthIndex.
---

# Search Modes

## Overview
VitePress DepthIndex supports three search modes (`on-device`, `hybrid`, and `cloud`) to match your project's performance constraints, privacy requirements, and hosting budget. These modes determine where indices are processed, how user questions are answered, and what files are generated at build time.

## On-Device Mode

### How It Works
In `on-device` mode, both keyword search and AI answer synthesis are done client-side inside the user's browser. Chunks are retrieved from the IndexedDB store and parsed using a local NLP rule engine to format context-aware documentation summaries.

### Performance
Zero network latency. Queries are resolved in **~20.5ms**, making it incredibly fast. There are no external API endpoints called and zero operational fees.

### Offline Support
Fully supported. The service worker caches the compressed JSON index, allowing users to search and read synthesized answers offline.

### Limitations
Local answer synthesis relies on structured page templates rather than generative LLM models. It excels at listing code examples, definitions, and tutorials, but cannot handle arbitrary conversation or complex reasoning outside the exact document text.

## Hybrid Mode

### Local First, Cloud Enhancement
In `hybrid` mode, the client performs local keyword/vector filtering to find the most relevant document chunks, and then sends only those chunks to a cloud LLM (e.g., Gemini or OpenAI) to generate a response. This combines fast on-device search with generative AI capabilities.

### Fallback Behavior
If the user is offline, or if the cloud API call fails (due to rate limits, key issues, or network errors), the engine automatically falls back to local synthesis. The transition is silent and seamless, ensuring users always get an answer.

### When to Use
Recommended for most documentation sites. It provides high-quality AI chat answers while keeping token usage and costs low, since the model only processes relevant document snippets.

## Cloud Mode

### Full AI-Powered
In `cloud` mode, local search indexing is skipped. Query understanding, document matching, and synthesis are handled entirely in the cloud.

### Requirements
Requires a continuous internet connection and valid cloud API configurations (configured via client settings or environment variables).

### Build Differences
During `npm run docs:build`, the generation of `assets/depth-index.json` is skipped. This significantly reduces the build size and compile times for large documentation portals, emitting only lightweight metadata manifests.

## Mode Comparison Table
| Feature | On-Device Mode | Hybrid Mode | Cloud Mode |
| :--- | :--- | :--- | :--- |
| **Primary Execution** | Client Browser | Client + Cloud API | Cloud API |
| **Offline Capabilities** | Full Search & Synthesis | Fallback to Local Search | None |
| **Generative Responses** | No (Template-based) | Yes | Yes |
| **API Costs** | $0 | Low (BYOK) | Medium |
| **Client Download Size** | Index Payload | Index Payload | Metadata Only |
| **Privacy Compliance** | Full (Local Firewall) | Cloud Privacy Rules | Cloud Privacy Rules |

## Choosing the Right Mode
- **Choose On-Device** if you are deploying to secure, offline environments (e.g. defense, internal setups), want to avoid API costs entirely, or have strict privacy mandates.
- **Choose Hybrid** (Recommended) if you want natural conversational answers, citations, and summaries, while maintaining offline search fallbacks.
- **Choose Cloud** if your documentation has thousands of pages (where local indexes would be too large to download) and you are okay with requiring internet access for search features.

## Switching Between Modes
Modes can be toggled in your VitePress configuration or changed by the user in the UI settings panel (if `settings.allowModeChange` is enabled). For migration instructions, see the [Switching Between Search Modes Guide](/guide/switching-modes).
