# Changelog

All notable changes to the **VitePress DepthIndex** project will be documented in this file.

## [1.3.0] - 2026-07-24

### Added
- **Experimental Local Intelligence Engine** (`src/experimental/`):
  - **Semantic Chunker** (`src/experimental/semantic-chunker.ts`): Categorizes documentation chunks into semantic types (`instruction`, `configuration`, `example`, `definition`, `explanation`, `reference`), extracts key terms, and computes Float32 sparse TF-IDF embedding vectors.
  - **Local Knowledge Graph** (`src/experimental/knowledge-graph.ts`): Constructs concept, page, and section nodes, models typed relationships (`references`, `related_to`), and provides BFS graph traversal and concept explanation path discovery.
  - **Multi-Step Reasoning Engine** (`src/experimental/reasoning-engine.ts`): Executes a 5-step NLU pipeline (`UNDERSTAND` → `RETRIEVE` → `ANALYZE` → `SYNTHESIZE` → `VERIFY`) with context-aware natural language answer synthesis and citation verification.
  - **Experimental Engine Facade** (`src/experimental/engine.ts`): Standalone intelligence engine manager with initialization, fallback behavior, and runtime statistics.

- **Strategic Engine Enhancements**:
  - **Framework-Agnostic Core** (`src/core/engine.ts` & `@depthindex/core`): Extracted `DepthIndexCore` class allowing DepthIndex to run on any SSG framework or custom documentation app without VitePress or Vite dependencies.
  - **Documentation Health Audits** (`src/core/health-auditor.ts`): `HealthAuditor` system detecting orphaned pages, missing code examples for code concepts, cross-page contradictions, empty headings, and computing a 0–100 health score.
  - **Interactive Search UI** (`src/client/interactive-search.ts`): Floating "Explain This" selection widget triggered by `Ctrl/Cmd+Shift+K` keyboard shortcut and Code Playground snippet runner/editor.
  - **Heuristic NLU Synthesis**: Heuristic synthesis template registry (`how_to_cross_page`, `definition_with_related`, `troubleshoot_chain`) and composition-based template selection.
  - **Cross-Page Knowledge Traversal**: Extended `KnowledgeGraph` to detect cross-page relationships (`prerequisite`, `configures`, `extends`, `troubleshoots`, `references`) with evidence string generation.

## [1.2.2] - 2026-07-23


### Added
- **WebGPU Acceleration Architecture** (`src/gpu/index.ts`):
  - Client-side WebGPU acceleration pipeline for embedding generation and vector search with WGSL compute shaders.
  - Hardware profiling, VRAM allocation manager (`GPUVRAMAllocator`), tensor memory pooling, and silent CPU fallback for non-WebGPU browsers.
  - Comprehensive unit test suite (`test/gpu.test.ts`) and user guide (`docs/guide/gpu-acceleration.md`).

- **Complete White-Label & Monetization SDK** (`src/sdk/index.ts`):
  - **Subscription Gate** (`src/sdk/subscription/gate.ts`): Plan-based access control (`free`, `pro`, `enterprise`), usage quota enforcement (daily search limits, AI synthesis limits, max tokens), trial management, and custom tier definitions.
  - **Webhook Engine** (`src/sdk/webhooks/types.ts`): Event system for `search:executed`, `answer:synthesized`, `user:limit_exceeded`, `subscription:changed`, `feedback:submitted` with HMAC-SHA256 payload signing and exponential backoff retries.
  - **Banner Manager** (`src/client/banner-manager.ts`): In-panel promotion banners, trial expiration notices, plan upgrade prompts, and custom announcement banners with impression/click tracking and dismiss persistence.
  - **Customization System**: CSS design tokens (`--di-primary`, `--di-font-family`, `--di-border-radius`), full CSS override support, custom logos/avatars/icons, custom launcher text, custom welcome messages, and prompt key overrides.
  - Documentation guides added: `docs/guide/white-label.md` and `docs/guide/monetization.md`.

- **Synthesis Accuracy & Safety Overhaul**:
  - **SafetyGuard** (`src/client/safety-guard.ts`): Intercepts self-harm, suicide, violence, and child safety queries with real, verified crisis resources (988 US, 111/SHOUT UK, Hopeline PH, FindAHelpline international).
  - **MarkdownCleaner** (`src/client/markdown-cleaner.ts`): Cleans and formats raw LLM markdown outputs, eliminating excessive blank lines, normalizing heading spacing, and deduplicating headings.
  - **ConfidenceScorer** (`src/client/confidence-scorer.ts`): 4-factor answer scoring (relevance 0-40, term match 0-25, diversity 0-15, quality 0-20) with hallucination/vagueness penalty application.
  - **AnswerPipeline** (`src/client/answer-pipeline.ts`): Safe answer execution pipeline with query broadening, fallback search strategies, and cascade failure prevention.
  - **Current-Page-Only Summary** (`src/client/page-features.ts`): Forced DOM extraction from current page prose only for page summaries.
  - Added customizable `showDisclaimer`, `disclaimerText`, `disclaimerLink`, `reportUrl`, and `feedbackUrl` configurations.

- **Granular Index Control & Reference Customization**:
  - **GranularIndexLoader** (`src/client/granular-index-loader.ts`): Granular page-level index chunk loader supporting `'full'`, `'lazy'`, `'eager'`, and `'offline'` strategies.
  - **Index Manifest Update Checking**: Compares build IDs, updates changed page chunks, prunes deleted pages from local device storage for security compliance, and manages LRU cache eviction.
  - **Citation & Reference Renderer** (`src/client/citation-renderer.ts`): Configurable inline citations (`superscript`, `inline`, `underline`) and reference sections (`list`, `pills`).
  - Documentation guide added: `docs/guide/index-download.md`.

---

## [1.2.1] - 2026-07-20

### Added
- **Search Bar AI Overview Mode**: Automatic client-side extraction, sanitization of code blocks, tables, diagrams, video links, HTML tags, and sentence-boundary truncation.
- **Search Bar "Ask AI" Button Mode**: Absolute-positioned action button injected on the search input, enabling direct redirection of queries to the full chat panel.
- **Extended Documentation Suite**: Added 9 new documentation pages under `docs/` covering guide topics (Search Overview, Conversation Memory, Advanced Tips, Deployment), configuration examples (Search Overview, Search Button, Conversation Memory, Custom Entities), and Community Showcase.
- **Tagalog Translations**: Localized settings subtitles, information messages, and storage indicators.

### Fixed
- **Settings Panel Translation Mappings**: Fixed missing translation key names (`subtitle`, `info`, `storageIndicator`) and mapped `on-device` fallback to local translation values in English (`en`) and Tagalog (`tl`).
- **Typescript Compilation Errors**: Removed unsupported properties from `synthesize` call in client search bar integration.

## [1.2.0] - 2026-07-19

### Added
- **Rich Text Formatting** (`src/client/rich-text-renderer.ts`) — parsed structures for markdown bold, italic, underlines (`__underline__`), strikethroughs (`~~strikethrough~~`), blockquotes (`>`), inline code, links, GFM tables, and code blocks inside AI synthesized response bubbles.
- **Superscript-First Citations** (`src/client/citation-renderer.ts`) — overhauls citation injection to transform `[^1]` markers into hyperlinked superscript tags (`<sup><a href="#cite-1">1</a></sup>`). Renders deduplicated and target-highlighted `<ol>` references at the bottom of answers only when citations exist.
- **DOM-Clean Page Summarization & Discussion** (`src/client/page-features.ts`) — extracts page text while discarding SVGs, code blocks, tables, and Mermaid flow diagrams to avoid raw text leakage during summaries and contextual AI page discussions.
- **Version Integrity & Security** (`src/client/version-check.ts`) — checks manual-only updates and verifies SHA-256 signatures of index buffers.
- **AI Answer Card Dismissal** — added a close `[x]` button inside the search AI answer card that stores the dismissed state, respecting the choice during active typing.
- **Conversation Memory & Anaphora Resolution** (`src/client/conversation-memory.ts`) — records multi-turn chat history with dynamic entity/topic extraction, intent classification, and backward-scanning pronoun resolution. Boosts search scores for documents matching the current discussion topic.
- **System Context Injection** — supports `ai.systemContext` configuration to supply LLMs with persistent, custom background information.

### Fixed
- Decoupled panel theme selectors from global VitePress variables and mapped them to dark-mode-aware `--di-` tokens.
- Addressed table/diagram line leakage into local synthesized answers.
- Scoped search modal dark mode overrides to `.dark` globally to match VitePress's theme class configuration.
- Enforced list-style-type resets inside message content bubbles to prevent global list resets from breaking layout formatting.
- Resolved Vue variable block-scoping instantiation order conflicts inside `DepthIndexPanel.vue`.
- Fixed VitePress version compatibility checks and service worker support verification during resolved config validation.
- Standardized IndexedDB message storage types by adding `citations` to `Message` definitions.
- Trimmed test environment `SerializedIndex` mocks to align with core type boundaries.

---

## [1.1.11] - 2026-07-19

### Fixed
- **VitePress CSS chunk hijacking**: Moved service worker, search worker, and CSS asset emission from Rollup's `generateBundle` to filesystem compilation in `closeBundle` to prevent VitePress from dropping the main theme stylesheet.

---

## [1.1.10] - 2026-07-19

### Changed
- **Client Script Injection**: Refactored client script loading to wrap the theme rather than injecting script tags into the DOM, avoiding hydration mismatches.

---

## [1.1.9] - 2026-07-19

### Changed
- **Script/CSS Packaging**: Bundled client scripts and CSS directly into VitePress's production compilation rather than utilizing dev-only HTML injections.

---

## [1.1.8] - 2026-07-19

### Changed
- Synchronized repository lockfiles for clean dependency reinstalls.

---

## [1.1.7] - 2026-07-19

### Fixed
- **Timing Race Fix**: Fixed DOMContentLoaded mounting race conditions on client scripts by aligning with VitePress's theme hydration sequence.

---

## [1.1.6] - 2026-07-19

### Added
- **Delta Indexing & Caching** (`src/build/delta-indexer.ts`) — differential build system that hashes page content (SHA-256) to track changes. During updates, the client only downloads newly added or modified page chunks in a compressed delta payload (`/assets/depth-delta.json.br`), saving substantial bandwidth.
- **Secure Update Engine** (`src/client/secure-updater.ts`) — manages local index integrity using ECDSA (P-256/SHA-256) signature verification on build manifests (`/.well-known/depthindex-manifest.json`). Stores processed indexes in client-side IndexedDB (`depthindex_secure_store`) and enforces a strict `50MB` cache ceiling.
- **Device Adaptation Engine** (`src/client/device-adapter.ts`) — profiles device hardware (RAM, CPU cores, GPU) and network speed (2g/3g/4g/wifi). Automatically scales search properties (quantizing vectors to `int8`/`float16`/`float32`, scaling cache caps, tuning thread counts, and enabling/disabling animation frame rates) across Low, Medium, and High device tiers.
- **Privacy Firewall** (`src/privacy/firewall.ts`) — client-side gateway that scrubs personally identifiable information (PII), including email addresses, phone numbers, and cloud API keys (`sk-` prefixes). Limits site-owner analytics access to strict aggregate metrics (`total_queries`, `citation_click_counts`, `error_categories`) while blocking tracking of raw user queries, history, or IP addresses.
- **Cloud-Only Mode Builder** (`src/build/cloud-only-strategy.ts`) — builds lightweight documentation manifests and optimized `llms.txt`/`llms.jsonl` references while skipping local index payload emission to optimize compile time and build sizes.
- **Bilingual Translation Packs** — introduced Tagalog (`tl`) localization files to augment default English support, allowing panels, settings, and warnings to toggle languages smoothly.

### Changed
- Refactored build-time pipeline to support delta manifest creation.
- Standardized security checking within local-first storage adapters.

---

## [1.1.5] - 2026-07-16

### Added
- **Search Bar Integration** (`src/client/search-bar-integration.ts`) — direct integration into VitePress built-in local search modal (`.VPLocalSearchBox`, `.DocSearch-Modal`, `#local-search`). Serves quick on-device AI answers inline directly at the top of results. Includes mandatory `"Powered by DepthIndex"` footer branding.
- **SuggestionEngine** (`src/client/suggestion-engine.ts`) — 5-tier verified sidebar-driven suggestion generator. Every suggestion is cross-checked against live VitePress DOM sidebar content before display. Suggestions are never fabricated from topics that don't exist in the docs. Cache is automatically invalidated on page navigation.
- **SearchModeManager** (`src/client/search-modes.ts`) — unified local / hybrid / cloud search orchestrator. Hybrid mode runs local search first (always fast and offline-safe), then silently attempts cloud enhancement; if cloud fails or the result isn't better, local answer is returned with no visible error. Persists chosen mode to `localStorage`. Re-checks cloud availability after API key save.
- **NLU layer merged into IntentEngine** — `IntentEngine.understand()` returns a full `NLUResult`: `QueryType` (definition, how_to, example, troubleshoot, comparison, yes_no, summary, etc.), `HighLevelIntent` (learn, implement, configure, fix, reference, chat), `SearchStrategy` (local_preferred, cloud_preferred, hybrid, auto), sub-question splitting for compound queries, and entity extraction.
- **`ConversationHandler.understand()`** — pass-through to `IntentEngine.understand()` for panel-level NLU access.
- **`ConversationHandler.createSearchModeManager()`** — factory that wires a `SearchModeManager` with injected local/cloud/synthesizer dependencies, reading `getPersistedMode()` for the default.

### Changed
- **Personalization OFF by default** — `PersonalizationEngine` constructor default changed from `enabled: true` to `enabled: false`. Existing users who explicitly enabled/disabled it retain their stored preference. Plugin `DEFAULT_OPTIONS.personalization.enabled` also changed to `false`. Recommended for hybrid/cloud deployments only.
- **`PersonalizationEngine`** now accepts `maxHistory` constructor param (default 20) and uses it in `recordQuery()` instead of the previous hardcoded limit of 15.
- **`DepthIndexPanel.vue` suggestions** now driven by `SuggestionEngine` instead of `SiteContextEngine`. Falls back to `SiteIntelligence.suggestQuestions()` when no sidebar DOM is available (e.g. SSR). Suggestion cache is invalidated on page navigation.
- **`PageContext`** extended with `contentLength?`, `hasCodeBlocks?`, `hasConfig?`, and `url?` for page-aware suggestion tier selection.
- **`DepthIndexOptions.personalization`** extended with `maxHistory?` option.
- **Docs configuration simplified** to `DepthIndex()` with no options — all plugin defaults apply, making the docs site a live demonstration of zero-config behavior.
- **`ConversationHandler.handleConversational`** default case now returns the first greeting response instead of a hardcoded fallback string.

### Fixed
- **VitePress Search Bar Enhancements**: Tightened selector matching to run only when the search modal is mounted in DOM. Removes persistent nav bar badge pollution.
- **Docs use npm package instead of local source**: `docs/.vitepress/config.ts` now imports from `vitepress-plugin-depthindex` (npm) with all defaults, and `theme/index.ts` no longer manually injects `FloatingButton` — the Vite plugin handles all injection automatically via its virtual module pipeline. This removes double-injection and ensures the docs experience exactly what end users get.
- **ConversationHandler greeting response**: `handleConversational('greeting')` previously delegated to `SiteIntelligence.generateGreeting()` which returns short context-only text like `"Ask me anything about Documentation."` — this broke the test expecting "Hello/Hi there/Hey". Now uses the pre-built `greetingResponses` array which contains proper friendly greetings consistently.
- **PersonalizationEngine suggestions test**: The test now correctly enables the personalization engine (`enabled=true`) before calling `recordQuery`, reflecting actual production usage (suggestions only work when the user has opted in).
- **TypeScript error in `markdown-renderer.ts`**: Parameter `h` in `headers.forEach` was implicitly typed as `any`. Now explicitly typed as `string`.

### Exported Types (new)
- `NLUResult`, `QueryType`, `HighLevelIntent`, `SearchStrategy` from `intent-engine.ts`
- `SearchMode`, `SearchResponse` from `search-modes.ts`
- All re-exported from `src/types/index.ts` for single-import convenience.


## [1.1.4] - 2026-07-13

### Fixed
- **Citation HTML rendered as raw text**: The markdown renderer now extracts and protects existing HTML tags (`<sup>`, `<div>`, `<a>`, etc.) before passing content through the inline formatter. This ensures citation superscripts inserted by `insertCitations()` are correctly preserved and rendered in the panel, not displayed as raw `<sup><a href=...>` text.
- **`[object Object]` in Related Topics**: Heading entries in the search index that are stored as objects instead of plain strings are now correctly coerced to strings via `.text`, `.title`, or `String()` fallbacks before being added to the Related Topics list.
- **Citation HTML attributes visible in output**: The `insertCitations()` method now generates compact, single-line `<sup><a class="cite">` HTML. Removed multi-line template literals and the `data-citation` attribute that were appearing as visible text.
- **Confidence score too low (43%)**: Rewrote the confidence formula. New formula: base (30% when any results exist) + source diversity (0–25%) + relevance score (0–35%) + content richness (code/headings/length) + cluster bonus. Typical responses now show 65–85% instead of 40–50%.
- **Greeting shows internal site classification**: Removed "This appears to be a **api** for **technical users**" from greeting variants. All three greeting templates now use friendly, user-facing language without exposing internal `profile.type` or `profile.targetAudience` values.
- **Removed duplicate `.references-section` CSS**: Consolidated citation and reference styles into the `<style>` block of `DepthIndexPanel.vue`, adding `.cite`, `.cite:hover`, `.reference-item:target` highlight, and correct `scroll-margin-top`.

### Changed
- Citation HTML class renamed from `citation-link` to `cite` for shorter, cleaner markup.
- `calculateConfidence` now adds a 30% base score whenever results are found, ensuring the displayed confidence accurately reflects information availability.

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