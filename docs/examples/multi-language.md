---
title: Allow Language Selection Example
description: Allow users to switch between English and Tagalog settings dynamically.
---

# Allow Language Selection

## Configuration
To allow users to switch languages via the settings panel, configure the `allowUserChange` option in `.vitepress/config.ts`:
```typescript
import { defineConfig } from 'vitepress';
import DepthIndex from 'vitepress-plugin-depthindex';

export default defineConfig({
  vite: {
    plugins: [
      DepthIndex({
        language: {
          default: 'en',
          allowUserChange: true, // Enables the user dropdown selector
          availableLanguages: ['en', 'tl']
        }
      })
    ]
  }
});
```

## User Experience
When language selection is enabled:
1. **Settings Dropdown**: A language selection dropdown appears in the chat settings menu.
2. **Immediate Updates**: Choosing a language (such as Tagalog) translates all buttons, placeholder texts, and settings labels instantly in the browser.
3. **Persisted Preference**: The user's selection is saved in `localStorage` under `depthindex-language` so that their preference is remembered on future visits.
