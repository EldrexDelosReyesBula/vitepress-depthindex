---
title: "How to Contribute Translations to DepthIndex"
description: "Step-by-step guide to adding and testing new language packs for the open-source community."
---

# How to Contribute Translations to DepthIndex

We want DepthIndex to be accessible to developers in every language. If you speak a language that is not currently supported, you can contribute a translation pack.

## Translation File Structure

Language packs are simple JSON files stored under `src/extensions/i18n/packs/`. A translation file contains strings for all UI buttons, placeholders, and error messages:

```json
{
  "code": "es",
  "name": "Español",
  "translations": {
    "panel.placeholder": "Pregúntale al asistente...",
    "panel.search_button": "Buscar",
    "panel.summarize_button": "Resumir página",
    "panel.close_button": "Cerrar",
    "error.empty_query": "Por favor, escribe una pregunta.",
    "error.no_results": "No se encontraron resultados para tu consulta."
  }
}
```

## How to Test Your Translation

To test your translation locally:
1. Fork the DepthIndex repository.
2. Add your pack file inside `src/extensions/i18n/packs/`.
3. Import the file in `src/extensions/i18n/index.ts` and register it in the `translationPacks` map.
4. Run unit tests to verify structure compliance:

```bash
npm run test
```

Once verified, submit a Pull Request. We highlight all translation contributors in our release logs!
