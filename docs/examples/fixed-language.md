---
title: Force Single Language Example
description: Lock the user interface and AI prompts to a single, fixed language.
---

# Force Single Language

## Configuration
To lock your documentation's UI and AI responses to a specific language, configure the `forceLanguage` option inside `.vitepress/config.ts`:
```typescript
import { defineConfig } from 'vitepress';
import DepthIndex from 'vitepress-plugin-depthindex';

export default defineConfig({
  vite: {
    plugins: [
      DepthIndex({
        language: {
          forceLanguage: 'tl' // Forces Tagalog interface only
        }
      })
    ]
  }
});
```

## Behavior
When a single language is forced:
1. **Disabled Selectors**: The language selector in the settings panel is automatically hidden and disabled.
2. **Localized UI**: All interface strings (buttons, input fields, settings, warnings) default to the locked language immediately.
3. **AI Prompts**: If using hybrid or cloud modes, system prompts are injected with instructions to generate answers only in the forced language.

## Use Case
This configuration is ideal for:
- Regional documentation portals targeted at a specific language audience (e.g. a Tagalog-only developer portal).
- Multi-repo translation setups, where each subpath (e.g. `/es/` or `/tl/`) runs its own localized VitePress instances.
