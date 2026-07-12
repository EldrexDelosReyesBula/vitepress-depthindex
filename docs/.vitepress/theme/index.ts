import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import FloatingButton from '../../../src/components/FloatingButton.vue';

// Configuration options for our documentation search engine
const options = {
  searchMode: 'on-device',
  indexConfig: {
    chunkSize: 500,
    overlapSize: 50,
    excludePages: ['/changelog'],
    includeCodeBlocks: true,
    includeMermaid: true,
  },
  ui: {
    theme: 'auto',
    position: 'bottom-right',
    showFloatingButton: true,
    enableFullscreen: true,
    enableModal: true,
  },
  personalization: {
    enabled: true,
    storage: 'localStorage',
  },
  offline: {
    enabled: true,
    cacheStrategy: 'network-first',
  },
  llmText: {
    enabled: true,
    formats: ['txt', 'jsonl'],
    includeMetadata: true,
  },
};

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      // Injects the search floating button and chat overlay at the bottom of the layout
      'layout-bottom': () => h(FloatingButton, { options })
    });
  }
};
