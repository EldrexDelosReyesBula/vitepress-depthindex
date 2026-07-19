---
title: Custom Branding Example
description: Learn how to add custom logos, icon classes, and branding tags to the chat panel.
---

# Custom Branding

## Configuration
To add your company logo or custom assistant icon to the chat assistant panel, configure the `panel.logo` option in `.vitepress/config.ts`:
```typescript
import { defineConfig } from 'vitepress';
import DepthIndex from 'vitepress-plugin-depthindex';

export default defineConfig({
  vite: {
    plugins: [
      DepthIndex({
        panel: {
          logo: {
            src: '/assets/corporate-logo.svg', // Path to your logo image
            alt: 'My Company Logo'
          },
          title: 'DevHelper',
          subtitle: 'Ask anything about our documentation.'
        }
      })
    ]
  }
});
```

## Logo Requirements
For the best display:
- **Format**: Vector graphics (`.svg`) are recommended for crisp scaling on high-density displays, but `.png` is also supported.
- **Dimensions**: Sized at `32x32` pixels for headers, and `64x64` pixels for welcome screen displays.
- **Coloring**: Ensure the logo has a transparent background to blend with both light and dark themes.

## Result
Once configured, the custom logo will be displayed:
- In the top-left corner of the side panel header.
- At the top of the welcome screen dashboard.
- Next to inline search bar answers when users run keyboard queries.
