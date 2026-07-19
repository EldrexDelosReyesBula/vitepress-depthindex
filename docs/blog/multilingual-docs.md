---
title: "Making Your Docs Speak Any Language with DepthIndex"
description: "Set up multi-lingual indexing and translations to support global developers."
---

# Making Your Docs Speak Any Language

Developers build software in every pool of the world, and they ask questions in many languages. Supporting multi-lingual documentation search is crucial for global developer platforms.

DepthIndex features native internationalization (`i18n`) support out-of-the-box.

## Multi-Language Translation Packs

DepthIndex has translation support built directly into the client-side package. You can configure the active language or allow the plugin to detect the user's browser language automatically:

```typescript
DepthIndex({
  i18n: {
    defaultLanguage: 'en',
    fallbackLanguage: 'en',
    supportedLanguages: ['en', 'tl', 'es'],
    autoDetect: true
  }
})
```

## Built-in Translations

The SDK includes standard translation files for:
* **English (`en`)**: The default pack.
* **Tagalog (`tl`)**: Native Filipino localization pack.

## AI Answer Translation

If you deploy DepthIndex in Hybrid mode, the cloud synthesizer can translate local search results dynamically. If a user asks a question in Spanish, DepthIndex reads English documentation paragraphs, translates them on-the-fly, and outputs a Spanish answer with correct inline citations to the English source pages.
