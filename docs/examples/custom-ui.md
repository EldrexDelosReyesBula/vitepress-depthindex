---
title: Custom Design Example
description: Learn how to customize theme colors, shadows, and fonts in VitePress DepthIndex.
---

# Custom Design

## CSS Variables
You can customize the design of VitePress DepthIndex by overriding global CSS variable tokens. Create a custom stylesheet (e.g. `docs/styles/depthindex-theme.css`) and add your variables.

## Custom Theme
Here is a complete custom theme stylesheet that applies a deep violet color palette, custom shadows, and rounded borders:
```css
/* docs/styles/depthindex-theme.css */
:root {
  /* Accent Colors */
  --depthindex-color-primary: #7c3aed; /* Violet */
  --depthindex-color-primary-hover: #6d28d9;
  --depthindex-color-primary-dimm: rgba(124, 58, 237, 0.1);

  /* Panel Dimensions & Backgrounds */
  --depthindex-panel-width: 380px;
  --depthindex-bg-panel: #fcfbfe;
  --depthindex-bg-input: #ffffff;
  
  /* Message Bubble Customization */
  --depthindex-bg-message-user: #7c3aed;
  --depthindex-bg-message-ai: #f5f3ff;
  --depthindex-border-radius-lg: 16px;
  --depthindex-border-radius-md: 12px;

  /* Typography */
  --depthindex-font-family: 'Outfit', sans-serif;
  --depthindex-font-size-base: 14px;
}

/* Dark Mode Overrides */
.dark {
  --depthindex-bg-panel: #121016;
  --depthindex-bg-input: #1b1822;
  --depthindex-bg-message-ai: #1f1a28;
  --depthindex-text-primary: #f5f3ff;
}
```

## Result
Import this file in `.vitepress/theme/index.ts` to apply the styles:
```typescript
import DefaultTheme from 'vitepress/theme';
import './depthindex-theme.css'; // Imports variable overrides

export default {
  extends: DefaultTheme
}
```
Once loaded:
- The floating launcher bubble will display in violet.
- Message bubbles will appear in violet (user) and soft violet-tinted grey (AI).
- Card corners will render with soft, rounded profiles (`16px`/`12px`).
