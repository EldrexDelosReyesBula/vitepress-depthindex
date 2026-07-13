# Limitations & Use Cases

VitePress DepthIndex is a powerful, local-first intelligence layer designed specifically for static documentation. To get the most out of the plugin, it is important to understand its target use cases, deployment scenarios, and performance boundaries.

---

## 🎯 Where to Use

DepthIndex is ideal for:
1. **Developer Portals & API Reference Sites**: Where developers need to find syntax, usage guides, and configuration options quickly.
2. **Product Documentation**: Interactive guides for enterprise software, hardware manuals, or SaaS tools.
3. **Internal Team Wikis**: Knowledge bases built with VitePress that require strict data privacy and local-first execution.
4. **Offline Documentation**: Docs shipped inside desktop apps, electron shells, or offline-capable PWAs.

---

## 📅 When to Use

Choose DepthIndex when:
* **Privacy is Paramount**: You want search queries and synthesized answers to remain entirely client-side without sending documentation content to third-party databases.
* **Cost Efficiency is Required**: You want to avoid paying recurring monthly fees for cloud vector databases (e.g. Pinecone, pgvector) or cloud search APIs.
* **Offline Capability is Essential**: Your users need access to search and AI assistant features even in low-connectivity or air-gapped environments.
* **Hybrid Execution is Preferred**: You want to offer fast on-device processing by default, with the option to leverage cloud LLMs (Gemini, OpenAI, Anthropic) if the user provides their own API key.

---

## 🛠️ How to Use: Core Integration Flow

Integrating DepthIndex involves three simple steps:

### 1. Register the Plugin
In `docs/.vitepress/config.ts`:
```typescript
import { defineConfig } from 'vitepress';
import DepthIndex from 'vitepress-plugin-depthindex';

export default defineConfig({
  vite: {
    plugins: [
      DepthIndex({
        searchMode: 'on-device', // or 'hybrid'
        seo: {
          siteName: 'Your Docs Site',
        }
      })
    ]
  }
});
```

### 2. Inject the Component
In your theme file `docs/.vitepress/theme/index.ts`:
```typescript
import DefaultTheme from 'vitepress/theme';
import DepthIndexPanel from 'vitepress-plugin-depthindex/client';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Register the component
    app.component('DepthIndexPanel', DepthIndexPanel);
  }
};
```

### 3. Add to Layout
You can include it inside your custom Layout wrapper, or let it load automatically through the built-in slot injections.

---

## ⚠️ Limitations of the Plugin

While DepthIndex is highly optimized, on-device execution comes with natural technical boundaries:

| Limitation Area | Description | Boundary / Mitigation |
|-----------------|-------------|-----------------------|
| **Site Scale** | Massive documentation sites will result in larger index files. | Recommended for sites under **2,000 pages**. Beyond this, the initial index download size (~5MB compressed) may impact mobile load times. |
| **Local Synthesis** | Local on-device answer synthesis is rule-based and syntactic. | Local mode cannot answer complex logical reasoning queries that are not directly stated in the text. *Mitigation:* Use hybrid mode with cloud LLM adapters. |
| **Browser Storage** | IndexedDB is used to save sessions and user topic affinities. | Private tabs or browser storage-clear operations will wipe message history. Storage is subject to browser-controlled quota limits (typically 50MB+). |
| **Worker Overheads** | Web workers require COOP/COEP headers to use SharedArrayBuffer in high-concurrency mode. | If these headers are blocked by the hosting provider, DepthIndex falls back to main-thread search automatically. |

> [!IMPORTANT]
> **Data Sanitization**: DepthIndex includes client-side PII filters that sanitize API keys, JWTs, and email addresses from queries. However, do not paste extremely sensitive personal information into search fields as an industry-standard best practice.

> [!TIP]
> **Index Optimization**: Use the `exclude` option in the plugin configuration to skip index generation for archive pages, changelogs, or large tabular pages that don't benefit from semantic search.
