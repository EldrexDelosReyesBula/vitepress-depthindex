---
title: Tool Attributions
description: Credits and attributions for third-party libraries, packages, and tools powering DepthIndex.
---

# Tool Attributions

**VitePress DepthIndex** stands on the shoulders of giants. This page credits and documents all core libraries, compilation tools, and testing utilities used in this project.

---

## 1. Core Runtime Dependencies

These libraries compile into the client-side package to power retrieval and compression:

* **[minisearch](https://github.com/lucaong/minisearch)**: A lightweight, high-performance client-side search engine. Used for posting list lookups and keyword indexing.
* **[lz-string](https://github.com/pieroxy/lz-string)**: High-speed compression algorithm. Powers the build-time quantization serialization and browser-side lazy index decompressions.
* **[stemmer](https://github.com/words/stemmer)**: Implementations of the Porter Stemmer algorithm, helping tokenizers reduce words to their common linguistic roots.
* **[remove-stopwords](https://github.com/fergiemcdowall/remove-stopwords)**: Vocabulary stopword reference lists, filtering common words (like `the`, `and`) during query preprocessing.

---

## 2. Peer & Framework Tools

* **[VitePress](https://github.com/vuejs/vitepress)**: Next-generation Vue-powered static site builder. Builds the core documentation pipeline and plugin interfaces.
* **[Vue.js](https://github.com/vuejs/core)**: Reactive JavaScript framework. Powers the search modal, floating button launchers, citations grids, and AI assistant chat templates.
* **[Vite](https://github.com/vitejs/vite)**: Fast frontend build tool and dev server. Orchestrates plugin compilation, HTML injection hooks, and virtual modules.

---

## 3. Development & Testing Ecosystem

* **[tsup](https://github.com/egoist/tsup)**: Zero-config bundler powered by esbuild. Compiles all TS modules into standard ESM and CommonJS packages.
* **[TypeScript](https://github.com/microsoft/TypeScript)**: Typed superset of JavaScript, ensuring type safety and compile-time checks across the codebase.
* **[Vitest](https://github.com/vitest-dev/vitest)**: High-performance unit testing framework. Runs indexing math checks, BM25 scorers, and the 1,000-page latency stress test.
* **[devdiff](https://github.com/EldrexDelosReyesBula/devdiff)**: Git changes analysis and commit tracking helper.
