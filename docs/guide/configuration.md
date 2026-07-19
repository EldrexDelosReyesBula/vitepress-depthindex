---
title: Configuration Reference
description: Complete options schema, properties, and environment variables configuration for VitePress DepthIndex.
---

# Configuration

## Default Configuration
By default, VitePress DepthIndex runs as a zero-latency, local-first search utility. The minimum configuration inside `.vitepress/config.ts` is:
```typescript
import { defineConfig } from 'vitepress';
import DepthIndex from 'vitepress-plugin-depthindex';

export default defineConfig({
  vite: {
    plugins: [DepthIndex()]
  }
});
```
This applies the following default parameters:
- **`searchMode`**: `'on-device'`
- **`placement`**: `{ mode: 'all' }`
- **`searchBar`**: Enabled, max inline answer length of `500` characters, shortcut `⌘K`.
- **`panel`**: Enabled, side mounting on the right, show settings page and history.
- **`floatingButton`**: Enabled, pulse effect, chat dots icon.
- **`offline`**: Enabled, registers `depthindex-sw.js` with `network-first` cache.
- **`llmText`**: Enabled, formats `txt` and `jsonl` generated in output directory.

## Complete Options Reference

The configuration parameters are passed to `DepthIndex(options)`:

### searchMode
```typescript
searchMode?: 'on-device' | 'cloud' | 'hybrid';
```
- `'on-device'`: Search and answer generation run entirely inside the client browser.
- `'cloud'`: Search indexing is skipped, and queries are handled via cloud providers.
- `'hybrid'`: Performs local keyword/semantic filtering first, then enhances the results using a cloud model.

### placement
```typescript
placement?: {
  mode: 'search-bar' | 'panel' | 'cta' | 'both' | 'all';
  searchBarSelector?: string;
}
```
Controls which UI launcher mounts in the DOM. Default is `'all'`.

### searchBar
```typescript
searchBar?: {
  enabled?: boolean;
  position?: 'top' | 'bottom';
  maxAnswerLength?: number;
  showExpandButton?: boolean;
  placeholder?: string;
  logo?: { src?: string; icon?: string; alt?: string; };
  shortcut?: string;
}
```
Settings for inline AI results inside the default search box.

### panel
```typescript
panel?: {
  enabled?: boolean;
  position?: 'right' | 'left';
  defaultSize?: 'compact' | 'normal' | 'fullscreen';
  showHistory?: boolean;
  logo?: { src?: string; icon?: string; alt?: string; };
  title?: string;
  subtitle?: string;
  showSettings?: boolean;
}
```
Settings for the side chat assistant overlay panel.

### floatingButton
```typescript
floatingButton?: {
  enabled?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  icon?: string;
  pulse?: boolean;
  label?: string;
}
```
Configure the launcher floating bubble in the viewport corners.

### indexConfig
```typescript
indexConfig: {
  chunkSize: number;
  overlapSize: number;
  excludePages: string[];
  includeCodeBlocks: boolean;
  includeMermaid: boolean;
}
```
Build-time parsing configurations. Default is `{ chunkSize: 500, overlapSize: 50, excludePages: ['/changelog'], includeCodeBlocks: true, includeMermaid: true }`.

### offline
```typescript
offline: {
  enabled: boolean;
  cacheStrategy: 'network-first' | 'cache-first';
}
```
Configure service worker caching strategies for index JSON payloads.

### llmText
```typescript
llmText: {
  enabled: boolean;
  formats: ('txt' | 'jsonl' | 'markdown')[];
  includeMetadata: boolean;
}
```
Generates standardized text representations (`llms.txt`, `llms.jsonl`) for AI web spiders.

### cloudAPI
```typescript
cloudAPI?: {
  provider: 'openai' | 'gemini' | 'anthropic' | 'custom';
  endpoint?: string;
  model?: string;
  apiKey?: string;
}
```
API keys and endpoints for serverless/hybrid cloud model calls.

### ai (personality)
```typescript
ai?: {
  personality?: AIPersonalityConfig;
  logo?: {
    src?: string;
    alt?: string;
    size?: 'sm' | 'md' | 'lg';
    position?: 'header' | 'welcome' | 'both';
  };
}
```
Configure the conversational assistant's response tone and presets. See `AIPersonalityConfig` for details.

### language
```typescript
language?: {
  default?: string;
  allowUserChange?: boolean;
  availableLanguages?: string[];
  forceLanguage?: string;
  translateAnswers?: boolean;
  communityTranslationsUrl?: string;
}
```
Setup i18n localization options. Built-in languages include English (`en`) and Tagalog (`tl`).

### analytics
```typescript
analytics?: {
  enabled?: boolean;
  storage?: 'indexeddb' | 'localstorage' | 'memory' | 'none';
  externalEndpoint?: string;
  externalHeaders?: Record<string, string>;
  batchSize?: number;
  flushInterval?: number;
  maxEvents?: number;
  trackedCategories?: ('search' | 'click' | 'feedback' | 'error' | 'session' | 'navigation')[];
  excludePages?: string[];
  notice?: NoticeConfig;
}
```
Telemetry setup. Kept completely private by default and restricted by the Privacy Firewall.

### privacy
```typescript
privacy?: {
  showNotice?: boolean;
  privacyPolicyUrl?: string;
}
```
Show GDPR/compliance notice banners in the UI.

### settings
```typescript
settings?: {
  showSettings?: boolean;
  allowCloudConfig?: boolean;
  allowModeChange?: boolean;
  allowLanguageChange?: boolean;
  hiddenSections?: ('cloud' | 'mode' | 'language' | 'history')[];
}
```
Controls which sections are displayed in the user settings panel.

### usageLimits
```typescript
usageLimits?: {
  tokens?: {
    maxPerRequest?: number;
    maxPerUserPerDay?: number;
    maxPerUserPerMonth?: number;
  };
  response?: {
    localMaxChars?: number;
    cloudMaxChars?: number;
    inlineMaxChars?: number;
  };
  rateLimit?: {
    queriesPerMinute?: number;
    queriesPerHour?: number;
  };
}
```
Enforces client rate limits and token ceilings to optimize API budgets.

### seo
```typescript
seo?: {
  siteUrl?: string;
  siteName: string;
  siteDescription: string;
  author?: string;
  twitterHandle?: string;
  defaultImage?: string;
  googleSiteVerification?: string;
  aiCrawlerPolicy?: 'allow' | 'disallow' | 'selective';
}
```
Inject meta tags, open graph fields, sitemaps, and AI crawler blocks.

### personalization
```typescript
personalization: {
  enabled: boolean;
  storage: 'localStorage' | 'indexedDB';
  maxHistory?: number;
}
```
Configures local search history logs and topic affinities. Off (`enabled: false`) by default.

### errorReporting
Configure via the `extensions` mechanism as an `ErrorReportingExtension`. Controls destination endpoints and scrubbing parameters.

### extensions
```typescript
extensions?: any[];
```
Accepts community translation packs or plugin hooks that hook into search/render lifecycles.

## Environment Variables
- **`VITE_DEPTHINDEX_CLOUD_API_KEY`**: If set in your build or local environment, DepthIndex locks browser storage inputs for keys. Calls to the cloud provider will automatically use this value.

## Configuration Examples

### Hybrid Mode with Local Cache
```typescript
import DepthIndex from 'vitepress-plugin-depthindex';

export default {
  vite: {
    plugins: [
      DepthIndex({
        searchMode: 'hybrid',
        cloudAPI: {
          provider: 'gemini',
          model: 'gemini-1.5-flash',
        },
        personalization: {
          enabled: true,
          maxHistory: 10
        }
      })
    ]
  }
}
```

## TypeScript Types
For the complete list of types, see the [TypeScript Types API Reference](/api/types).
