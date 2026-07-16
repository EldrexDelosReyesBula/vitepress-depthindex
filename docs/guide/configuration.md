---
title: Configuration Options
description: Explore the complete configuration properties and schema parameters for the DepthIndex plugin.
---

# Configuration Options

DepthIndex comes with a highly configurable option schema. You can customize search behaviors, indexing thresholds, cloud models, UI styling, placement, and caching.

## Configuration Schema

Here is the complete options list with default values:

```typescript
export interface DepthIndexOptions {
  // Search Mode: on-device, cloud, or hybrid
  // - on-device: runs search and answer synthesis locally in the browser (zero keys, offline)
  // - hybrid: runs search locally, but calls cloud LLM APIs for conversational answers
  searchMode: 'on-device' | 'cloud' | 'hybrid';
  
  // Placement rules for the plugin components
  placement?: {
    // Mode: 'search-bar' (only search bar integration), 'panel' (only AI chat panel),
    // 'cta' (only floating button), 'both' (floating button + search bar), 'all' (all of them)
    mode: 'search-bar' | 'panel' | 'cta' | 'both' | 'all';
    searchBarSelector?: string;
  };

  // AI search bar integration options
  searchBar?: {
    enabled?: boolean;
    position?: 'top' | 'bottom';         // Inline AI answer position relative to matches
    maxAnswerLength?: number;            // Trim length (default: 500)
    showExpandButton?: boolean;          // Show "Chat" expand button (default: true)
    placeholder?: string;                // Search bar placeholder overrides
    logo?: {
      src?: string;                      // Custom logo image path
      icon?: string;                     // Custom icon class (e.g., fontawesome class)
      alt?: string;
    };
    shortcut?: string;                   // Keyboard shortcut hint (default: '⌘K')
  };

  // Full AI chat panel configuration
  panel?: {
    enabled?: boolean;
    position?: 'right' | 'left';
    defaultSize?: 'compact' | 'normal' | 'fullscreen';
    showHistory?: boolean;
    logo?: {
      src?: string;
      icon?: string;
      alt?: string;
    };
    title?: string;                      // Header title
    subtitle?: string;                   // Empty-state subtitle
    showSettings?: boolean;              // User cloud api config panel access
  };

  // Floating CTA launcher button configuration
  floatingButton?: {
    enabled?: boolean;
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    icon?: string;
    pulse?: boolean;
    label?: string;                      // Button text (default: 'Ask AI')
  };

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
  
  // UI preferences (legacy/fallback parameters; automatically deep-merged for backward compatibility)
  ui: {
    theme: 'light' | 'dark' | 'auto'; // Theme matching
    position: 'bottom-right' | 'bottom-left'; // Floating launcher position
    showFloatingButton: boolean; // Shows floating launcher (default: true)
    enableFullscreen: boolean;   // Enables fullscreen toggle for Chat Assistant
    enableModal: boolean;        // Enables keyboard-driven search modal (Ctrl+K)
  };
  
  // local storage personalization
  personalization: {
    enabled: boolean;            // Tracks search history & topic affinities (default: false)
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

## Backward Compatibility & Configuration Merging

The plugin features a robust deep-merge configuration layer. If you have legacy options specified in `ui.*` (e.g., `ui.position`, `ui.showFloatingButton`), they will automatically map to the new structured layout (`floatingButton.position`, `floatingButton.enabled`, etc.) without breaking your configuration.

### Example Options Configuration

Add the plugin to your `.vitepress/config.ts` like so:

```typescript
import { defineConfig } from 'vitepress';
import DepthIndex from 'vitepress-plugin-depthindex';

export default defineConfig({
  vite: {
    plugins: [
      DepthIndex({
        searchMode: 'on-device',
        placement: {
          mode: 'all'
        },
        searchBar: {
          placeholder: 'Ask AI or search...',
          shortcut: '⌘K'
        },
        floatingButton: {
          enabled: true,
          label: 'Ask AI'
        }
      })
    ]
  }
});
```
