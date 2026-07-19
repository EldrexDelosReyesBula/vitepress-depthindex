---
title: "How DepthIndex Runs AI Search Entirely On-Device"
description: "Deep dive into the architecture of browser-side index parsing, vector compression, and offline-first synthesis."
---

# How DepthIndex Runs AI Search Entirely On-Device

Documentation search is typically hosted on remote database clusters (like Algolia or Elasticsearch). These platforms require API calls, network latency, and monthly usage subscriptions.

DepthIndex introduces a completely different philosophy: **running the entire search and AI intelligence layer directly inside the client's browser.**

## The On-Device Architecture

DepthIndex splits search and synthesis into a two-phase architecture: build-time crawling and client-side execution.

```
┌─────────────────────────────────────────────────────────┐
│ BUILD TIME (NodeJS Compiler)                            │
│ 1. Scan markdown files                                  │
│ 2. Extract prose, headings, and code blocks             │
│ 3. Build tf-idf vocabulary map                          │
│ 4. Emit compressed index binary (assets/depth-index.json)│
└────────────────────────────┬────────────────────────────┘
                             │ (Downloaded on client load)
                             ▼
┌─────────────────────────────────────────────────────────┐
│ BROWSER RUNTIME (Client-side Search Engine)             │
│ 1. Load index binary into memory                        │
│ 2. Parse query text in Web Worker                       │
│ 3. Compute cosine & BM25 relevance scores               │
│ 4. Cluster matching paragraphs                          │
│ 5. Synthesize answers locally / fallback to Cloud API  │
└─────────────────────────────────────────────────────────┘
```

## Vector and Vocabulary Compression

A primary challenge of client-side search is package size. Downloading a 50MB raw index on mobile networks is unacceptable.

DepthIndex solves this using advanced compression:
* **Quantized TF-IDF Vectors**: Sparse token vectors are quantized down to 8-bit integers (`int8`) or 16-bit floats (`float16`) depending on the detected device profile.
* **Stop-Word Stripping & Stemming**: Common words are pruned out, and words are stemmed to their roots (e.g. "configuring" and "configures" map to "config").
* **Brotli/Gzip Compression**: The index files are written as compressed blobs, reducing a typical 10MB raw text index down to under 500KB.

## The Web Worker Sandbox

To prevent search computations from freezing the user interface, DepthIndex spawns a dedicated background thread: **SearchWorker**.

When a user types:
1. The search input is sent to the `SearchWorker`.
2. The worker computes search scores, sorts matches, and extracts relevant paragraphs.
3. The worker returns matching nodes back to the main UI thread.

This ensures a consistent 60fps frame rate for scrolling and typing, even on low-tier mobile devices.
