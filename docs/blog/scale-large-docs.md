---
title: "Optimizing DepthIndex for Large Documentation Sites (1000+ Pages)"
description: "Tuning vocabulary sizes, vector quantization, and build-time configurations to index thousands of pages."
---

# Optimizing DepthIndex for Large Documentation Sites

As your documentation site grows from 50 pages to over 1,000 pages, the size of the search index file increases. Downloading a large index can slow down page loading times on low-end devices.

Here are strategies to optimize DepthIndex for large documentation sites.

## 1. Tuning Chunk Sizes

By default, DepthIndex splits documentation pages into chunks of 300 words. For large sites, increase the chunk size to reduce the total number of index nodes:

```typescript
DepthIndex({
  chunkSize: 500, // Word count threshold
  chunkOverlap: 50 // Word overlap between chunks
})
```

## 2. Filtering Vocabulary

You can exclude specific words or common terms to reduce the size of the index vocabulary map. Configure this in your configuration:

```typescript
DepthIndex({
  indexing: {
    excludePatterns: ['temp_*', 'debug_*'],
    minWordLength: 4 // Excludes short, generic tokens
  }
})
```

## 3. Switching to Cloud Mode

If your site exceeds 5,000 pages, downloading the index to mobile browsers is not recommended. In this scenario, switch to **Cloud Mode** to run all search operations on a remote server, keeping the initial client download minimal.
