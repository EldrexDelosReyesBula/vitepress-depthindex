# Changelog

All notable changes to the **VitePress DepthIndex** project will be documented in this file.

---

## [1.1.3] - 2026-07-13

### Fixed
- **Context-aware suggested questions**: Suggestions are now generated dynamically from the actual headings of the currently viewed page, not from a static category guess. Each page now surfaces questions relevant to its own content (e.g., an installation page shows "How do I install this?", an API page shows "How do I authenticate?", etc.). Falls back to profile-type defaults only when the page has no headings.

### Changed
- `generateSuggestedQuestions()` now reads live DOM headings and maps them to natural language questions before falling back to type-based defaults.

## [1.1.1] - 2026-07-13

### Fixed
- Web Worker loading issue in production environments by emitting `search-worker.js` as a root-level static asset (`/depthindex-search-worker.js`) and resolving it relative to Vite's `BASE_URL`.
- Service Worker fetch listener `TypeError: Failed to convert value to 'Response'` by throwing a proper network error when offline resources are missing from the cache, allowing browsers to handle the offline state gracefully.
- Service Worker registration scope resolution to support base subpaths.

## [1.1.0] - 2026-07-13

### Added
- Core Plugin SDK (`src/sdk/index.ts`) supporting sandbox localStorage and plugin lifecycle registry
- Compliance Enforcer (`src/sdk/compliance.ts`) verifying plugin permissions and data disclosure compliance
- Bilingual Translation Engine (`src/extensions/i18n/index.ts`) with English (`en`) and Tagalog (`tl`) packs
- Message editing and query resending capabilities for user messages in the chat interface
- User confirmation prompt before writing error details to clipboard and opening external GitHub issues pages
- Fully translated settings and configuration panel (`CloudConfigPanel.vue`)
- SVG icon system replacing all emoji icons in UI
- YouTube video embed support with lazy-loaded iframes
- Image rendering with lightbox and error fallback
- Video player for MP4/WebM files
- Device detection for low/medium/high performance profiles
- Chunked index loading for better memory management
- `SECURITY.md` with vulnerability reporting process
- Supply chain security improvements (`npm audit` in prepublish)
- Package name corrected to `vitepress-plugin-depthindex` everywhere
- "Powered by DepthIndex" attribution enforcement
- `overrides` in package.json for CVE mitigation
- "Limitations & Use Cases" documentation page in the VitePress sidebar guide
- Loading animation stages (Thinking, Analyzing, Generating) for the page summarization action

### Changed
- Default error reporting target repository updated to `EldrexDelosReyesBula/vitepress-depthindex`
- Animations now persist across all query types (summarize, follow-ups)
- Error reporting: shows copy fallback instead of auto-redirecting to GitHub
- IndexedDB operations sanitize Vue proxies before storage
- Quota exceeded handler cleans old sessions automatically
- Progress indicators show percentage and stage messages

### Fixed
- Code block Copy button JavaScript code leak by separating HTML SVG icons from the onclick attribute context
- KaTeX math horizontal layout collapse by preloading and auto-injecting `katex.min.css` dynamically in Vite server and compiling it into static HTML output files
- Chat panel context banner "Viewing" title made a clickable link routing to the active page context
- Related topics made into clickable Markdown links pointing to documentation pages
- Citation reference links sanitized to remove `.md` extensions for clean routing
- TypeScript compilation type errors resolved by separating submit event signatures from inner query execution routines
- Mandatory user confirmation check enforced before any automatic error reporting redirection or issue page submission triggers
- `DataCloneError` when storing messages with Vue reactive properties
- Error report redirecting users without GitHub permissions
- Loading animations disappearing after page summarize
- Regex global flag safety for all PII detection patterns
- Citation navigation with proper anchor IDs
- Thread safety for concurrent async answer synthesis

### Security
- Added `SECURITY.md` with disclosure policy
- High CVE dependency flagged for override
- All npm audit checks pass before publish
- Regular dependency audits enforced via `prepublishOnly`

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
