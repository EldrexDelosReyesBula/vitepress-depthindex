<img width="1968" height="799" alt="depthindex-wordmark" src="https://github.com/EldrexDelosReyesBula/vitepress-depthindex/blob/main/assets%2Fdepthindex-wordmark.png" />

# VitePress DepthIndex

[![npm version](https://img.shields.io/npm/v/vitepress-plugin-depthindex.svg)](https://www.npmjs.com/package/vitepress-plugin-depthindex)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**VitePress DepthIndex** is a production-grade, offline-first search and reasoning engine designed to turn standard documentation sites into AI-native experiences — running entirely on-device with zero server dependencies, no API keys, and zero latency.

Designed and developed by **Eldrex Delos Reyes Bula** (eldrexdelosreyesbula@gmail.com).

---

## 📖 Full Documentation

For detailed installation guides, configuration schemas, API references, FAQs, and custom CSS styling templates, visit our official documentation site:

👉 **[https://depthindex.vercel.app](https://depthindex.vercel.app)**

---

## 🎯 Key Features

* **On-Device Hybrid Search**: Combines **BM25 exact keyword matching** and **dense TF-IDF Cosine similarity** using sparse vector quantization.
* **AI Conversational Assistant**: Vue-based conversational UI overlay that provides responses, links citation highlights, and tracks local query personalization.
* **PWA & Offline-First**: Pre-registers a service worker (`depthindex-sw.js`) to cache and run search indexes and outlines without internet connections.
* **LLMs.txt Generation**: Automatically compiles metadata-rich summaries (`llms.txt`, `llms-full.txt`, and `llms.jsonl`) for AI crawling agents.
* **100% Privacy Compliance**: No central servers, trackers, or telemetries. Optional cloud LLM API keys (OpenAI, Gemini, Anthropic) are stored locally in the browser's `localStorage`.

---

## ⚡ Quick Start

### 1. Install the Plugin

```bash
# npm
npm install vitepress-plugin-depthindex --save-dev

# pnpm
pnpm add -D vitepress-plugin-depthindex
```

### 2. Configure VitePress

Add the plugin to your `.vitepress/config.ts`:

```typescript
import { defineConfig } from 'vitepress';
import DepthIndex from 'vitepress-plugin-depthindex';

export default defineConfig({
  title: 'My Docs Site',
  vite: {
    plugins: [
      DepthIndex({
        searchMode: 'on-device', // 'on-device' | 'hybrid' | 'cloud'
        offline: {
          enabled: true // Enable service worker caching
        }
      })
    ]
  }
});
```

---

## 🤝 Contributing & Code of Conduct

We welcome community extensions and fixes! Please review our [Contributing Guidelines](https://depthindex.vercel.app/community/contributing) and [Code of Conduct](https://depthindex.vercel.app/community/code-of-conduct) before making pull requests.

---

## 💖 Support & Donations

This plugin is free and open-source. If you enjoy using DepthIndex, please consider supporting the project:

* **PayPal Support Link**: [paypal.me/eldrexbula](https://www.paypal.com/paypalme/eldrexbula)
* **Author**: Eldrex Delos Reyes Bula
* **Email**: eldrexdelosreyesbula@gmail.com
