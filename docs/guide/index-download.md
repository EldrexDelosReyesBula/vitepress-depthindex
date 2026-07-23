# Index Download Strategies

## Overview
VitePress DepthIndex features a granular page-level index downloading system. Rather than forcing clients to download the entire documentation index at once, DepthIndex allows documentation sites to dynamically fetch index chunks based on user navigation and AI search demand.

## Strategies

### Full (Default)
Downloads the entire documentation search index on first page visit.
- **Best for:** Small to medium documentation sites (<500 pages).
- **Pros:** Instant search speed once loaded, 100% offline capability.

```typescript
DepthIndex({
  indexDownload: {
    strategy: 'full',
  },
})
```

### Lazy
Downloads index chunks only for pages the user actually visits or when AI search requires them.
- **Best for:** Massive documentation portals (>1,000 pages).
- **Pros:** Minimal initial data download, low memory overhead.

```typescript
DepthIndex({
  indexDownload: {
    strategy: 'lazy',
    downloadOnDemand: true,
  },
})
```

### Eager
Downloads index chunk for the current page and preloads related pages linked in the sidebar or document body.
- **Best for:** Interactive guides and structured learning paths.

```typescript
DepthIndex({
  indexDownload: {
    strategy: 'eager',
    preloadRelatedPages: 3,
  },
})
```

### Offline
Downloads all page chunks into IndexedDB for complete offline capability.

```typescript
DepthIndex({
  indexDownload: {
    strategy: 'offline',
  },
})
```

## Update Behavior

When developers deploy an update to their documentation:
1. **Manifest Check:** DepthIndex compares the build ID in `.well-known/depthindex-manifest.json`.
2. **Changed Pages:** Only updated page chunks are re-downloaded.
3. **Unchanged Pages:** Kept in local device cache.
4. **Deleted Pages:** Removed from the client device immediately for security compliance (`removeDeletedPages: true`).
5. **New Pages:** Downloaded on demand when visited or searched.

## Cache Management

Control maximum cache size and LRU eviction:

```typescript
DepthIndex({
  indexDownload: {
    strategy: 'lazy',
    maxCacheSizeMB: 30, // Evicts oldest chunks when exceeded
  },
})
```

## Security
- **Deleted Page Removal:** Ensures deleted or secret docs are pruned from client IndexedDB.
- **Signature Verification:** Integrates with DepthIndex security guard for tamper-proof index chunks.
