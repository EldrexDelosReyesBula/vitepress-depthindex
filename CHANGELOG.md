# Changelog

All notable changes to the **VitePress DepthIndex** project will be documented in this file.

---

## [1.0.0] - 2026-07-12
Initial production release of VitePress DepthIndex, an offline-first, local-first search and reasoning engine for VitePress documentation sites. Created and maintained by **Eldrex Delos Reyes Bula**.

### Features Added
#### Build-Time Indexing Pipeline
* **Structured Markdown Extractor**: Implemented unified Markdown parser extracting YAML frontmatter metadata, H1-H6 headings, text sections, links, code blocks (language and source), and Mermaid diagrams.
* **Crawler Security Exclusions**: Excluded hidden system folders and local tool config paths (e.g. `.git/`, `.devdiff/`, `.changeset/`, `.vscode/`) from crawling to avoid indexing credentials or source configurations.
* **Smart Overlapping Chunker**: Splits long page sections into logical text chunks with configurable limits and a 50-word context overlap to prevent sentence fragmentation.
* **IDF & Vocabulary Generator**: Generates document frequency maps, vocab arrays, and BM25-compatible Inverse Document Frequencies.
* **Quantized Vectorization**: Encodes chunks as sparse Float32 vectors normalized to unit length, quantizing indices and values to 4 decimal places to minimize database footprint.

#### Serialization & Caching
* **Base64 LZ-String Compression**: Compresses compiled JSON data databases before writing to disk, saving over 81% space (~2.75MB compressed to ~0.51MB for 1,000 pages).
* **PWA Service Worker**: Emits scoped `/depthindex-sw.js` supporting a network-first, background-refresh cache policy for the compressed index.
* **LLMs.txt Consolidated Outputs**: Generates standard outline `llms.txt`, consolidated `llms-full.txt`, and formatted JSONL records `llms.jsonl` in the output folder.

#### On-Device Search & NLP
* **Stemmer & Tokenizer**: Implemented on-device tokenizer and Porter stemmer to strip word suffixes.
* **Fuzzy NLP Query Expansion**: Preprocesses search strings, matches word roots, and expands search terms dynamically.
* **BM25 scoring**: Implemented exact keyword scoring normalized for average document length.
* **Cosine Similarity**: Runs high-performance sparse dot-products against unit-normalized vectors.
* **Relevance Boosting**: Applies a +20% score boost for heading matches and a +30% score boost for document title matches.
* **Candidate Filtering Optimization**: Queries inverted index posting lists first to isolate matched chunks, lowering search latencies to **~20.5ms** under heavy loads.

#### Conversational AI & UI
* **Personalization Engine**: Tracks query history (up to 15 items) and topic affinity weight maps locally, generating relevant suggested questions.
* **Bring Your Own Key Cloud Adapter**: Secure browser-direct connections to Gemini, OpenAI, and Anthropic APIs.
* **Opt-In Privacy Controls**: Settings menu allowing users to toggle history personalization, clear search profiles, and configure API providers.
* **Vue UI Components**: Floating launcher button, search modal (Ctrl+K), and natural language AI assistant chat overlay.

#### Documentation Site
* Structured full VitePress docs site under `docs/` containing guides, configurations, SDK blueprints, security procedures, licenses, and support guidelines.
* Configured a **unified sidebar navigation config** to display all resources transparently.

---

### Contact & Support
* **Author**: Eldrex Delos Reyes Bula
* **Email**: eldrexdelosreyesbula@gmail.com
* **PayPal Donation URL**: [paypal.me/eldrexbula](https://www.paypal.com/paypalme/eldrexbula)
