---
title: "How to Add Your Own Logo and Branding to DepthIndex"
description: "Guide to adding custom assets, branding text, and license notices to the floating button and panel headers."
---

# How to Add Your Own Logo and Branding

Every brand is unique, and your developer tools should reflect your identity. DepthIndex allows you to replace default icons and branding text with your own logo assets.

## Registering Custom Logos

To customize branding, open your `.vitepress/config.ts` file and configure the branding options inside the DepthIndex plugin configuration block:

```typescript
import { defineConfig } from 'vitepress';
import DepthIndex from 'vitepress-plugin-depthindex';

export default defineConfig({
  vite: {
    plugins: [
      DepthIndex({
        branding: {
          logoUrl: '/assets/my-company-logo.png', // URL path under public folder
          title: 'DevHelper AI',
          subtitle: 'Powered by MyCompany',
          footerNotice: '© 2026 MyCompany Inc.',
        }
      })
    ]
  }
});
```

## Custom floating button layout

You can also use Vue slots to customize the floating button itself. In your `docs/.vitepress/theme/index.ts`, import and pass custom components into the slot:

```typescript
import DefaultTheme from 'vitepress/theme';
import FloatingButton from 'vitepress-plugin-depthindex/components/FloatingButton.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Register custom triggers or wrapper templates
  }
};
```

This flexibility ensures that your AI assistant feels like an organic extension of your documentation portal.
