---
title: Changelog
description: All notable changes to VitePress DepthIndex
---

# Changelog

All notable changes to the **VitePress DepthIndex** project are documented here.

---

## [1.1.4] — 2026-07-13

### Fixed
- **Citation HTML rendered as raw text** — The markdown renderer now extracts and protects existing HTML tags (`<sup>`, `<div>`, `<a>`, etc.) before inline formatting. Citation superscripts from `insertCitations()` are correctly preserved.
- **`[object Object]` in Related Topics** — Heading entries stored as objects are coerced to strings via `.text`, `.title`, or `String()` fallbacks before being added to the Related Topics list.
- **Citation HTML attributes visible in output** — `insertCitations()` now generates compact, single-line `<sup><a class="cite">` HTML. Removed multi-line template literals and the `data-citation` attribute.
- **Confidence score too low (43%)** — Rewrote the confidence formula: base (30% when results exist) + source diversity (0–25%) + relevance score (0–35%) + content richness (code/headings/length) + cluster bonus. Typical responses now show **65–85%**.
- **Greeting shows internal site classification** — Removed "This appears to be an **api** for **technical users**" from greeting variants. All greeting templates now use friendly user-facing language.
- **Removed duplicate `.references-section` CSS** — Consolidated citation and reference styles into `DepthIndexPanel.vue`, adding `.cite`, `.cite:hover`, `.reference-item:target` highlight, and correct `scroll-margin-top`.

### Changed
- Citation HTML class renamed from `citation-link` to `cite` for shorter, cleaner markup.
- `calculateConfidence` now adds a 30% base score whenever results are found.

---

## [1.1.3] — 2026-07-13

### Fixed
- **Context-aware suggested questions** — Suggestions are now generated dynamically from the actual headings of the currently viewed page. Falls back to profile-type defaults only when the page has no headings.

### Changed
- `generateSuggestedQuestions()` now reads live DOM headings and maps them to natural language questions.

---

## [1.1.1] — 2026-07-13

### Fixed
- Web Worker loading in production environments by emitting `search-worker.js` as a root-level static asset.
- Service Worker `TypeError: Failed to convert value to 'Response'` by throwing proper network errors when offline resources are missing.
- Service Worker registration scope for sites on base subpaths.

---

## [1.1.0] — 2026-07-13

### Added
- Core Plugin SDK (`src/sdk/index.ts`) with sandboxed localStorage and plugin lifecycle registry.
- Compliance Enforcer (`src/sdk/compliance.ts`) verifying plugin permissions and data disclosure.
- Bilingual Translation Engine with English (`en`) and Tagalog (`tl`) language packs.
- Message editing and query resending capabilities.
- SVG icon system replacing all emoji icons.
- YouTube video embed support with lazy-loaded iframes.
- Image rendering with lightbox and error fallback.
- `SECURITY.md` with vulnerability reporting process.
- Supply chain security improvements (`npm audit` in prepublish).
- Loading animation stages (Thinking, Analyzing, Generating).

### Changed
- Default error reporting repository updated to `EldrexDelosReyesBula/vitepress-depthindex`.
- Animations persist across all query types.

### Fixed
- Code block Copy button JavaScript code leak.
- KaTeX math horizontal layout collapse.
- `DataCloneError` when storing messages with Vue reactive properties.
- Citation navigation with proper anchor IDs.
- Thread safety for concurrent async answer synthesis.

### Security
- Added `SECURITY.md` with disclosure policy.
- All `npm audit` checks pass before publish.

---

## [1.0.0] — 2026-07-12

Initial production release of VitePress DepthIndex — an offline-first, local-first search and reasoning engine for VitePress documentation sites. Created and maintained by **Eldrex Delos Reyes Bula**.

### Features Added

- **Build-Time Indexing** — Structured Markdown extractor, smart chunking, IDF/BM25 vocabulary, and quantized vectorization.
- **Compression & Caching** — LZ-String Base64 compression (~81% savings), PWA service worker, LLMs.txt outputs.
- **On-Device Search** — Stemmer, fuzzy NLP query expansion, BM25 scoring, cosine similarity, relevance boosting.
- **Conversational AI & UI** — Personalization engine, cloud adapter (Gemini/OpenAI/Anthropic BYOK), Vue UI components.
- **Documentation Site** — Full VitePress docs with guides, SDK blueprints, security procedures, and support guidelines.

---

### Contact & Support

- **Author**: Eldrex Delos Reyes Bula
- **Email**: eldrexdelosreyesbula@gmail.com
- **PayPal**: [paypal.me/eldrexbula](https://www.paypal.com/paypalme/eldrexbula)
