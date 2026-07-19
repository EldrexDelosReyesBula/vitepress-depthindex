---
title: Multi-Language Setup Example
description: Learn how to configure bilingual support and add custom language translation packs.
---

# Multi-Language Setup

## Configuration
To enable language selection in the settings panel and support multiple translation packs, configure the `language` options in `.vitepress/config.ts`:
```typescript
import { defineConfig } from 'vitepress';
import DepthIndex from 'vitepress-plugin-depthindex';

export default defineConfig({
  vite: {
    plugins: [
      DepthIndex({
        language: {
          default: 'en',
          allowUserChange: true,
          availableLanguages: ['en', 'tl', 'es']
        }
      })
    ]
  }
});
```

## Adding Languages
You can add custom translation packs (such as Spanish) using the `extensions` array:
```typescript
import DepthIndex from 'vitepress-plugin-depthindex';

const spanishPack = {
  type: 'language',
  pack: {
    code: 'es',
    nativeName: 'Español',
    englishName: 'Spanish',
    direction: 'ltr',
    author: { name: 'Maria Dev' },
    translations: {
      'settings.title': 'Configuración de DepthIndex',
      'settings.close': 'Cerrar',
      'panel.input_placeholder': 'Pregunta algo sobre la documentación...',
      'panel.welcome_title': 'Hola, ¿cómo puedo ayudarte hoy?'
    }
  }
};

export default {
  vite: {
    plugins: [
      DepthIndex({
        extensions: [spanishPack]
      })
    ]
  }
}
```

## Testing
To verify your multi-language setup:
1. Start your local dev server: `npm run dev`.
2. Open the side chat assistant panel.
3. Click the gear icon in the top-right corner to open the Settings panel.
4. Under the language selector, choose **Español** or **Tagalog**.
5. Verify that all UI elements, placeholder texts, and headings update to the selected language instantly without page reloads.
