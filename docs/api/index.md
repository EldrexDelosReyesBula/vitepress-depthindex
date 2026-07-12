---
title: API Reference
description: Complete SDK specifications and API parameters for VitePress DepthIndex.
---

# API & SDK Reference

DepthIndex provides standard Node.js and Browser modules. This reference documents every namespace, class method, configuration parameter, and return type with precise code examples.

---

## 1. Client-Side Browser SDK (`vitepress-plugin-depthindex/client`)

These modules manage index retrieval, decompression, query normalization, history personalization, and hybrid search evaluations.

### Class: `DepthIndexEngine`
The search runner that manages document vectors and executing searches.

```typescript
import { DepthIndexEngine } from 'vitepress-plugin-depthindex/client';
```

#### Constructor
```typescript
constructor(index?: SerializedIndex)
```
Optionally initializes the engine with a pre-parsed index.

#### Methods
* **`setIndex(index: SerializedIndex): void`**
  Loads the index data structure, maps vocabulary keywords, computes word lengths for document normalization, and caches average document lengths for BM25 calculation.
* **`isLoaded(): boolean`**
  Checks whether search indices have been set. Returns `true` if search operations can be executed.
* **`search(query: string, topK: number = 5): SearchResult[]`**
  Runs hybrid search (BM25 + Cosine Similarity) using token preprocessing and candidate filtering.
  - `query`: Raw search query string.
  - `topK`: Number of matched chunks to return.
  - Returns: Array of `SearchResult` objects sorted in descending order of relevance.

---

### Namespace Utilities: `index-loader`
Utilities for lazy loading and decompressing compiled assets.

```typescript
import { fetchAndDecompressIndex, clearIndexCache } from 'vitepress-plugin-depthindex/client';
```

#### Functions
* **`fetchAndDecompressIndex(indexUrl?: string): Promise<SerializedIndex>`**
  Fetches the compressed search index, decompresses it via LZ-String, parses the JSON string, and stores it in memory. Subsequent calls return the cached memory instance.
  - `indexUrl`: Target URL path (defaults to `'/assets/depth-index.json.gz'`).
* **`clearIndexCache(): void`**
  Flushes the internal in-memory index cache.

---

### Class: `PersonalizationEngine`
Manages search history, opt-in privacy states, and topic affinity.

```typescript
import { PersonalizationEngine } from 'vitepress-plugin-depthindex/client';
```

#### Methods
* **`constructor(enabled: boolean = true)`**
  Initializes local storage keys and loads opt-in/opt-out preferences.
* **`isEnabled(): boolean`**
  Returns whether history tracking is active.
* **`setEnabled(val: boolean): void`**
  Activates or deactivates personalization. If set to `false`, it completely clears historical data from `localStorage`.
* **`recordQuery(query: string, results: SearchResult[]): void`**
  Saves a query string into history and updates topic weights.
* **`recordClick(query: string, url: string, title: string): void`**
  Attaches click telemetry (which result was selected) to a historical query item.
* **`getHistory(): SearchHistoryItem[]`**
  Returns up to 15 stored search queries.
* **`getAffinity(): Record<string, number>`**
  Returns the topic affinity weight table.
* **`generateSuggestions(defaults: string[] = []): string[]`**
  Generates up to 4 suggested questions based on history and top affinity categories.
* **`clearData(): void`**
  Completely clears `localStorage` entries for history and topic affinities.

---

## 2. Build-Time Node API (`vitepress-plugin-depthindex/build`)

These modules run exclusively in Node.js environments during compile time to crawl directories and compile indexes.

```typescript
import { 
  buildIndex, 
  extractAllPages, 
  chunkAllPages, 
  serializeAndCompressIndex, 
  generateLLMText 
} from 'vitepress-plugin-depthindex/build';
```

#### Functions
* **`buildIndex(pages: string[], config: DepthIndexOptions, srcDir: string): Promise<SerializedIndex>`**
  Coordinates filtering, content extraction, overlapping chunking, vocabulary calculation, and index compilation.
  - `pages`: Array of relative markdown paths (e.g. `['guide/index.md']`).
  - `config`: Configuration options.
  - `srcDir`: Path to markdown source directory.
* **`extractAllPages(pages: string[], srcDir: string): Promise<ExtractedPage[]>`**
  Crawls physical markdown files, parses YAML frontmatter, headings, links, code, and Mermaid diagrams.
* **`chunkAllPages(pages: ExtractedPage[], chunkSize?: number, overlapSize?: number): PageChunk[]`**
  Splits document sections into overlapping word chunks.
* **`serializeAndCompressIndex(index: SerializedIndex): string`**
  Serializes the index into JSON and compresses it using LZ-String.
* **`generateLLMText(pages: ExtractedPage[], options: DepthIndexOptions, outDir: string): Promise<void>`**
  Generates the standard `llms.txt`, `llms-full.txt`, and `llms.jsonl` files in the output directory.

---

## 3. Data Schemas

### `SerializedIndex`
The compressed schema written to `assets/depth-index.json.gz`:

```typescript
export interface SerializedIndex {
  vocabulary: string[];             // Sorted list of all unique stems
  idf: number[];                    // Inverse document frequency weight per stem
  chunks: {
    id: string;                     // Section anchor identifier
    url: string;                    // Page URL
    pageTitle: string;              // Chapter title
    heading: string;                // Section heading title
    content: string;                // Section paragraph content text
    vector: number[];               // Sparse TF-IDF sequence [termIndex, normalizedValue]
    codeBlocks?: {                  // Scraped code blocks
      language: string;
      code: string;
    }[];
    mermaidDiagrams?: string[];     // Scraped flowchart code
  }[];
  invertedIndex: Record<string, [number, number][]>; // Posting list: stem -> [chunkIndex, frequency][]
}
```
