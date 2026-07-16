---
title: How it Works
description: Learn the math and indexing pipelines behind BM25 and Cosine similarity scoring in DepthIndex.
---

# How DepthIndex Works

This guide explains the detailed underlying mechanics, calculations, and architecture of **VitePress DepthIndex** from build-time compilation to client-side search execution.

---

## 1. Build-Time Indexing Pipeline

When you run `vitepress build`, the DepthIndex plugin hooks into Vite's bundle lifecycle to compile a search database.

```
[Markdown Source] ──► [Extractor] ──► [Smart Chunker] ──► [Embedder & Indexer] ──► [LZ-String] ──► assets/depth-index.json.gz
```

### Content Extraction
The [extractor.ts](file:///c:/Users/Eldrex/Downloads/classhost/DepthIndex/src/build/extractor.ts) crawls your source directory, filters out files/directories configured for exclusion or hidden files (folders starting with `.`), and parses markdown:
1. **Frontmatter Parsing**: Extracts YAML metadata (like `title`, `description`) at the top of markdown documents.
2. **Heading Slugs**: Identifies heading levels `H1`–`H6` and computes slugs for section anchors (e.g., `## Custom Title` becomes anchor `#custom-title`).
3. **Structured Content**: Segregates paragraphs, lists, and links, distinguishing between internal documentation links and external addresses.
4. **Code & Mermaid Scrapes**: Isolates code blocks (scraping code text and programming languages) and raw Mermaid flowchart structures, so they can be indexed separately from paragraph text.

### Smart Chunking
To ensure search results point users to exact document sections (instead of forcing them to scroll through a huge 10,000-word page), the [chunker.ts](file:///c:/Users/Eldrex/Downloads/classhost/DepthIndex/src/build/chunker.ts) divides pages into overlapping logical chunks:
* **Section-Based**: Splitting starts at section headings (`H2`, `H3`...).
* **Word Thresholds**: If a section's text exceeds `chunkSize` (default: 500 words), it is split.
* **Context Overlaps**: To prevent sentences or code definitions from being chopped in half at chunk boundaries, adjacent chunks overlap by `overlapSize` words (default: 50 words). This maintains grammatical continuity.
* **Code & Diagram Sharing**: Code blocks and Mermaid flowcharts inside a section are shared across all text chunks generated for that section, making them fully queryable.

---

## 2. Mathematical Scoring Engine

The client-side search uses a **Hybrid Scorer** combining exact keyword matching (BM25) and semantic vector matching (TF-IDF Cosine similarity).

### A. Term Frequency-Inverse Document Frequency (TF-IDF)
For each unique word stem in your documentation:
* **Term Frequency (TF)**: The frequency of term $t$ in a document chunk $D$:
  $$TF(t, D) = \frac{\text{Count of } t \text{ in } D}{\text{Total word tokens in } D}$$
* **Inverse Document Frequency (IDF)**: Evaluates the importance of a term across the corpus:
  $$IDF(t) = \ln\left(1 + \frac{N - DF(t) + 0.5}{DF(t) + 0.5}\right)$$
  Where $N$ is the total number of chunks, and $DF(t)$ is the number of chunks containing term $t$. Common terms (like `the`, `and`) get an IDF near 0, whereas rare configuration keywords get high weights.

To optimize client size, term vectors are stored **sparsely** as a sequential array of tuples: `[termIndex1, tfidfVal1, termIndex2, tfidfVal2, ...]`.

### B. Cosine Similarity
Cosine similarity measures the angle between the query vector $Q$ and document vector $D$:
$$\text{CosineSim}(Q, D) = \frac{Q \cdot D}{\|Q\|_2 \|D\|_2}$$

Because document vectors are **pre-normalized** to unit length ($\|D\|_2 = 1$) during build time, and the query vector $Q$ is normalized to unit length on-device, Cosine Similarity simplifies to a fast sparse dot-product:
$$\text{CosineSim}(Q, D) = \sum_{t \in Q \cap D} Q_t \cdot D_t$$

### C. BM25 Scoring
BM25 ranks documents based on the query terms appearing in each document, normalising for document length:
$$BM25(D, Q) = \sum_{q_i \in Q} IDF(q_i) \cdot \frac{f(q_i, D) \cdot (k_1 + 1)}{f(q_i, D) + k_1 \cdot \left(1 - b + b \cdot \frac{|D|}{\text{avgdl}}\right)}$$
* $f(q_i, D)$ is the term frequency of stem $q_i$ in chunk $D$.
* $|D|$ is the length of chunk $D$ in words.
* $\text{avgdl}$ is the average chunk length across all documentation.
* $k_1 = 1.5$ and $b = 0.75$ are standard constants regulating term frequency saturation and document length normalization.

### D. Hybrid Combination & Boosting
The final score combines the normalized BM25 score and Cosine vector score:
$$\text{Score} = 0.6 \cdot \text{CosineSim} + 0.4 \cdot \text{NormalizedBM25}$$

If query terms match the **document title** or **section heading**, the score is boosted:
* Heading match: $+20\%$ boost per term.
* Title match: $+30\%$ boost per term.

---

## 3. Client Optimization: Candidate Filtering

Evaluating all chunks in a documentation database of 1,000 pages for every keystroke would cause UI lag. 

To maintain a **Time to First Answer under 25ms**, the [search-engine.ts](file:///c:/Users/Eldrex/Downloads/classhost/DepthIndex/src/client/search-engine.ts) uses **candidate filtering**:
1. It queries the inverted index mapping table `invertedIndex` for the stems in the search query.
2. It collects only the IDs of documents that contain at least one query term.
3. It performs the full scoring algorithm (Cosine dot product & BM25) **only** on this candidate subset.

This filters out $98\%$ of non-matching documents immediately, keeping computation minimal and search operations instantaneous.

---

## 4. PWA & Caching Mechanics

When offline capabilities are enabled, the plugin generates a service worker file (`depthindex-sw.js`):
1. **Caching**: Installs a cache named `depthindex-cache-v1` storing the website index `/assets/depth-index.json.gz` and critical assets.
2. **Network-First Strategy**: When fetching resources:
   - It attempts to fetch from the network first to guarantee fresh documentation content.
   - If the network request fails (user is offline), it falls back to the local cache.
   - For cached hits, it updates the cache silently in the background when network connectivity becomes available (Stale-While-Revalidate).

---

## 5. AI Content Rendering Pipeline

DepthIndex incorporates a specialized `ContentRenderer` designed to display rich, interactive, and structured markdown outputs from AI responses:
- **GFM Tables**: Renders standard pipe tables (`| Header |`) with clean, responsive tabular elements.
- **Code Syntax Highlighting**: Translates code blocks into styled HTML tokens for TypeScript, JavaScript, Python, JSON, HTML, CSS, and YAML.
- **Mermaid Diagrams**: Detects ````mermaid```` code blocks and asynchronously loads the Mermaid JS engine to render native flowcharts, diagrams, and sequence charts inline. Features dark-mode theme adjustments and fallbacks to raw code if rendering fails.
- **Math/KaTeX**: Renders mathematical expressions wrapped in inline (`$...$`) or block (`$$...$$`) delimiters using KaTeX.
- **Media Previews**:
  - **Images**: Renders standalone images inside clickable lightbox figures (`<figure>`) allowing zoom-in/out previewing, as well as regular inline images.
  - **Videos**: Automatically embeds native `<video>` elements for `.mp4`, `.webm`, and `.ogg` video links with integrated controls and download options.
  - **YouTube embeds**: Formats YouTube, Shorts, and Live URLs as lazy-loaded embedded players using a static thumbnail overlay. The actual `<iframe>` loads only when the user clicks the play button, preventing page weight issues.
- **Auto-Linking**: Scans AI response paragraphs for bare HTTP/HTTPS URLs (such as developer donation links) and wraps them in HTML anchor elements with appropriate security attributes (`target="_blank" rel="noopener noreferrer"`).

---

## 6. UI Components, Layout, and Active Page Context

DepthIndex provides an immersive, cohesive UI architecture:
- **Floating Button Launcher**: A sleek, animation-driven trigger button featuring a pulsing AI Sparkle logo positioned in the corners of the viewport.
- **Search Bar Integration**: Seamlessly hooks into the native VitePress search boxes (`.VPLocalSearchBox`, `.DocSearch-Modal`, `#local-search`), appending a unified "Ask AI" context bar inside the search overlay.
- **Mobile Fullscreen Mode**: A responsive breakpoint design styling that transforms the Chat Panel into a fullscreen app on screens under `480px` wide.
- **Automatic Page Context**: The active page acts directly as the contextual backdrop for the assistant. When viewing a page, DepthIndex detects the title, route, and headings:
  - Users can click **Summarize Page** to immediately receive a concise summary of the active file.
  - Users can click **Discuss Page** to instantiate a conversation focused explicitly on that page's contents without needing to enter or clarify the topic manually.

