---
title: Contribute Translations
description: Learn how to add community translations and help localise the DepthIndex UI.
---

# Contribute Translations

Help us localize VitePress DepthIndex for developers around the world!

## How It Works
Localization is managed using JSON language packs registered via the `I18nAPI` inside the `extensions` config list. Native packs (like English and Tagalog) are compiled into the core package.

## File Structure
A language pack is defined as a JSON object matching the following structure:
```json
{
  "code": "es",
  "nativeName": "Español",
  "englishName": "Spanish",
  "direction": "ltr",
  "author": {
    "name": "Maria Dev",
    "email": "maria@dev.es"
  },
  "translations": {
    "settings.title": "Configuración de DepthIndex",
    "panel.input_placeholder": "Pregunta algo sobre la documentación..."
  }
}
```

## Required Keys
To ensure a complete translation, your language pack must translate the following categories:
- **`settings`**: Configuration options, title, descriptions, save and close button labels.
- **`panel`**: Chat input placeholders, headers, welcome messages, error and loading notifications, history lists.
- **`warnings`**: Rate limit warnings, client storage alerts, copy-paste confirmations.

## Testing
To test your custom language pack:
1. Register your pack in your local `.vitepress/config.ts` extensions array.
2. Start the dev server: `npm run dev`.
3. Open settings, switch to your new language, and verify that the UI labels update correctly without alignment issues.

## Submitting
To submit your language pack:
1. Open a pull request containing your new JSON pack file in `src/i18n/translations/`.
2. Add your language code to the supported language list in `src/extensions/i18n/index.ts`.

## Recognition
All translation contributors will be listed on our [Tool Attributions Page](/community/attributions) and in the release changelogs.
