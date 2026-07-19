---
title: Offline & PWA
description: Understand service worker configurations, offline caching strategies, and storage management.
---

# Offline & PWA

## Service Worker
VitePress DepthIndex compiles and registers a dedicated Progressive Web App (PWA) Service Worker (`depthindex-sw.js`). The service worker runs in the background of the user's browser, intercepting network requests to cache critical assets and ensure the documentation site works offline.

## Caching Strategies
The service worker uses two primary caching strategies:
1. **Network-First (for HTML and Pages)**: Attempts to fetch pages from the network first. If the network is unavailable, it falls back to the cached local versions. This ensures that users always see the latest documentation updates when online, avoiding hash mismatches for static chunks.
2. **Cache-First (for Static Assets)**: Fetches static assets (such as search indexes, stylesheet tokens, icons, and KaTeX fonts) from the local cache first, updating the cache in the background. This speeds up page load times and ensures these files are available offline.

## HTTPS Requirement
For security reasons, browsers restrict service worker registration to secure origins. Your documentation site must be served over **HTTPS** (or `http://localhost` during local development) for offline caching to work.

## Offline Search
Since the search worker, tokenizer, and BM25 index are compiled as client-side JavaScript, search queries are executed entirely locally. When offline, users can continue searching and getting synthesized answers without any network requests.

## Index Caching
The compressed search index (`assets/depth-index.json` or delta index updates) is cached by the service worker. On page load, the client checks the cache first, decompressing the index in the background to minimize initialization latency.

## Storage Limits
Local cache storage is managed by the browser:
- **Index Cache Quota**: DepthIndex enforces a strict **`50MB`** storage quota on IndexedDB cache databases.
- **Auto-Cleanup**: If the index cache exceeds this size, the `SecureUpdateEngine` automatically purges the oldest page revisions.
- **Browser Eviction**: In extreme low-storage conditions, the browser may evict cached files. DepthIndex handles this by automatically re-downloading the index once the connection is restored.

## Background Sync
When offline, analytics events and user feedback inputs are queued in IndexedDB. Once the browser detects that connection has been restored, the service worker uses background sync to upload the queued events to the target endpoints without user intervention.

## Testing Offline Mode
To test the offline functionality:
1. Open your documentation site in Google Chrome or Microsoft Edge.
2. Open Developer Tools (F12) and go to the **Application** tab.
3. Select **Service Workers** in the left menu and check the **Offline** checkbox.
4. Refresh the page: the documentation site and the search modal should load and function normally.

## Browser Support
Offline PWA features and `DecompressionStream` APIs are supported in all modern browsers:
- Google Chrome 80+
- Microsoft Edge 80+
- Mozilla Firefox 78+
- Apple Safari 11.3+ (on iOS/macOS)
If the browser does not support `DecompressionStream`, DepthIndex automatically falls back to decompressing the raw index payload using CPU-based decompression.
