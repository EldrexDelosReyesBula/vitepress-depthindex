---
title: "The Delta Update System: How DepthIndex Keeps Docs Fresh"
description: "Learn how DepthIndex uses differential hashing to minimize bandwidth and synchronize client search indexes."
---

# The Delta Update System

When you update your documentation, users need access to the new content immediately. However, forcing every visitor to re-download the entire documentation search index on every minor correction wastes bandwidth.

DepthIndex v1.2.0 solves this with the **Delta Update System**.

## The Hashing Pipeline

During the site compilation phase (`docs:build`), DepthIndex calculates SHA-256 hashes for every page. It compares these hashes against the previous build manifest.

```
┌─────────────────────────────────────────────────────────┐
│ BUILD TIME CRAWLER                                      │
│                                                         │
│ Page A (No Change)   ──► Hash matches  ──► Skip         │
│ Page B (Updated)    ──► Hash mismatch ──► Mark modified│
│ Page C (New Page)    ──► No past hash  ──► Mark added   │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
                 Generates delta-manifest:
                 - Added: ["/guide/new"]
                 - Modified: ["/intro"]
                 - Removed: []
```

## Client-Side Sync

When a user visits your site:
1. The browser requests the lightweight `depthindex-manifest.json` file.
2. The client compares the `buildId` in the manifest with its locally stored `buildId` in IndexedDB.
3. If they mismatch, the client downloads only the delta payload (`depth-delta.json.br`), which contains only the added and modified page chunks.
4. The client merges these updates into its local IndexedDB, keeping the search database fresh with minimal bandwidth overhead.

This allows search indexes to remain current, even on poor mobile connections.
