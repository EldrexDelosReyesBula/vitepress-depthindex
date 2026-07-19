---
title: How It Works
description: Learn the internals, architectures, pipelines, and performance optimizations behind VitePress DepthIndex.
---

# How It Works

## High-Level Architecture
VitePress DepthIndex operates as a split-stage pipeline. The heavy parsing and vocabulary calculations are done at **Build Time**, while query parsing, semantic vector math, intent classification, and answer rendering are done at **Runtime** directly on the user's browser.

## Build-Time Pipeline

### Content Extraction
The crawler crawls through the build directory. It leverages a structured Markdown extractor to scan pages, separating:
- Frontmatter metadata (e.g. titles, descriptions, categories)
- Headings (`<h1>` to `<h6>`)
- Logical content blocks
- Code blocks (including programming language names)
- Diagrams (capturing text within Mermaid templates)
- Outgoing internal and external link targets

### Text Chunking
To prevent document fragmentation while maintaining query relevance, long pages are split into logical chunks. DepthIndex uses an overlapping text segmenter that splits content based on the configured `chunkSize` (default: 500 words) and maintains a configurable `overlapSize` (default: 50 words) to ensure semantic continuity between adjacent boundaries.

### TF-IDF Vector Generation
For every chunk, DepthIndex calculates term frequencies. Across the corpus, document frequency calculations determine the Inverse Document Frequency (IDF) of terms. This maps out vocabulary tokens and builds unit-normalized sparse vectors.

### Index Serialization
To optimize delivery size, the vocabulary lists and sparse vector indices are encoded as a JSON object, compressed using base64 LZ-String libraries, and written to disk as `assets/depth-index.json`.

### LLM.txt Generation
At the same time, the build pipeline compiles standardized context text files (`llms.txt`, `llms-full.txt`, `llms.jsonl`) into the distribution folder for direct consumption by external LLMs and search engines.

### Delta Indexing
For version `1.1.6`, DepthIndex tracks page content changes via SHA-256 hashes. The build-time Delta Indexer compares the current build with the previous build's manifest. If only a few pages changed, it generates a differential index (`/assets/depth-delta.json.br`) containing only the added/modified chunks, allowing the client to pull lightweight delta updates instead of downloading the entire index.

## Runtime Pipeline

### Index Loading
On page mount, the client runtime checks if a local index exists. It queries IndexedDB storage first. If the cache is cold, it fetches the compressed index lazily in the background to avoid locking the UI main thread.

### Query Processing
When a user searches, the query processor applies tokenization and uses a Porter stemmer to strip word suffixes. It expands the search query using NLP synonym groupings.

### Intent Detection
The NLU layer within the `IntentEngine` parses the query to understand high-level intent:
- **`QueryType`**: `how_to`, `definition`, `example`, `troubleshoot`, `comparison`, `yes_no`, `summary`, etc.
- **`HighLevelIntent`**: `learn`, `implement`, `configure`, `fix`, `reference`, `chat`.
- **`SearchStrategy`**: `local_preferred`, `cloud_preferred`, `hybrid`, `auto`.
It extracts key entities and handles compound questions by split-parsing sub-questions.

### BM25 + Cosine Similarity Search
Queries are scored in a unified index search:
- **BM25 exact match**: Matches query terms against inverted index posting lists.
- **Cosine vector similarity**: Calculates sparse dot-products between query vectors and page chunk vectors.
Relevance scores are boosted (+20% for heading matches, +30% for document title matches) to ensure documentation hierarchy guides the results.

### Answer Synthesis
In on-device mode, the `AnswerSynthesizer` uses local templates to format answers based on query intents. In hybrid/cloud modes, the client streams the query and relevant document chunks to the configured LLM API.

### Citation Generation
To prevent hallucinations, the engine generates inline citation markers (e.g. `[1]`) referencing specific document URLs. These render as superscript elements (`<sup><a class="cite">`) linking to the exact source paragraph.

## Web Worker Architecture
To keep page rendering smooth, DepthIndex runs its tokenizer, Porter stemmer, and dot-product calculations inside a separate Web Worker (`/depthindex-search-worker.js`). The main thread passes queries via `postMessage()`, and the worker returns scored candidate lists asynchronously, preventing UI stuttering.

## IndexedDB Storage
DepthIndex caches its extracted page chunks in a local client IndexedDB store:
- **Database Name**: `depthindex_secure_store`
- **Object Store**: `secure_index_store`
- **Cache Quota**: Enforces a strict `50MB` cache ceiling, purging the oldest cached files when the quota is exceeded.

## Memory Management
For large documentations, loading a 10MB JSON index into memory can crash mobile browsers. DepthIndex manages this by loading vocabulary lists in chunks and lazily decompressing vectors only when an inverted index match occurs.

## Device Adaptation
Version `1.1.6` integrates a hardware profiler (`DeviceAdapter`) that identifies browser RAM, CPU cores, network speed (e.g. slow-2g), and preferred reduced-motion settings to select low, medium, or high performance tiers:
- **Low Tiers (RAM <= 2GB / 2 Cores / Slow Network)**: Quantizes vectors to `int8`, returns at most 3 results, sets cache caps to 10MB, runs searches on the main thread (disabling worker spawn overhead), disables UI transition animations, and loads page chunks lazily.
- **Medium Tiers (RAM <= 4GB / 4 Cores)**: Quantizes vectors to `float16`, runs 1 worker thread, and returns 5 results.
- **High Tiers (RAM > 4GB / >4 Cores / fast network)**: Quantizes vectors to `float32`, runs up to 4 parallel workers, and preloads the next 5 search target pages.
