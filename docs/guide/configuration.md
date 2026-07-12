---
title: Configuration Options
description: Explore the complete configuration properties and schema parameters for the DepthIndex plugin.
---

# Configuration Options

DepthIndex comes with a highly configurable option schema. You can customize search behaviors, indexing thresholds, cloud models, UI styling, and caching.

## Configuration Schema

Here is the complete options list with default values:

```typescript
export interface DepthIndexOptions {
  // Search Mode: on-device, cloud, or hybrid
  // - on-device: runs search and answer synthesis locally in the browser (zero keys, offline)
  // - hybrid: runs search locally, but calls cloud LLM APIs for conversational answers
  searchMode: 'on-device' | 'cloud' | 'hybrid';
  
  // Optional Cloud API Configuration
  cloudAPI?: {
    provider: 'openai' | 'gemini' | 'anthropic' | 'custom';
    endpoint?: string;
    model?: string;
    apiKey?: string; // Stored securely on client or build variables
  };
  
  // Index parameters
  indexConfig: {
    chunkSize: number;       // Words per chunk (default: 500)
    overlapSize: number;     // Word overlap between chunks (default: 50)
    excludePages: string[];  // Relative URLs/prefixes to exclude from indexing
    includeCodeBlocks: boolean; // Index code block contents (default: true)
    includeMermaid: boolean;    // Index mermaid diagram texts (default: true)
  };
  
  // UI preferences
  ui: {
    theme: 'light' | 'dark' | 'auto'; // Theme matching
    position: 'bottom-right' | 'bottom-left'; // Floating launcher position
    showFloatingButton: boolean; // Shows floating launcher (default: true)
    enableFullscreen: boolean;   // Enables fullscreen toggle for Chat Assistant
    enableModal: boolean;        // Enables keyboard-driven search modal (Ctrl+K)
  };
  
  // local storage personalization
  personalization: {
    enabled: boolean;            // Tracks search history & topic affinities
    storage: 'localStorage';
  };
  
  // Service Worker configurations
  offline: {
    enabled: boolean;            // Generates and registers PWA service worker
    cacheStrategy: 'network-first';
  };
  
  // LLMs.txt generation
  llmText: {
    enabled: boolean;            // Emits LLM formats
    formats: ('txt' | 'jsonl' | 'markdown')[]; // Formats to generate
    includeMetadata: boolean;    // Include frontmatter metadata
  };
}
```
