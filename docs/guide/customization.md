---
title: Customization Overview
description: Learn about customization options, styles, slot overrides, and forks.
---

# Customization Overview

## Layers of Customization
VitePress DepthIndex supports several customization layers to help you integrate search and AI elements into your design theme:

### CSS Variables
Override global styling tokens (such as colors, margins, fonts, and dark mode rules) inside your stylesheets. For the full list of tokens, see the [CSS Reference](/guide/css-reference).

### Configuration Options
Customize plugin properties (such as UI buttons, sizes, search shortcuts, and positions) in `.vitepress/config.ts`. See the [Configuration Guide](/guide/configuration) for details.

### Slot System
Use Vue slots to override UI sections (such as headers, footers, welcome banners, and icons) with your own Vue components. For the list of available slots, see the [Vue Slot System Guide](/guide/slots).

### Plugin SDK
Create custom extensions to hook into search and synthesis lifecycles. See the [Plugin SDK Guide](/guide/plugin-sdk) for developer details.

### Complete Fork
If you need to make major changes to the indexing pipeline or UI components, you can fork the project on GitHub:
```bash
git clone https://github.com/EldrexDelosReyesBula/vitepress-depthindex.git
```
The codebase is open-source and released under the MIT License.

## Quick Start
To apply custom styles:
1. Create a custom CSS file (e.g. `docs/styles/depthindex-custom.css`).
2. Add your variable overrides:
   ```css
   :root {
     --depthindex-floating-bg: #8b5cf6; /* Violet CTA button */
     --depthindex-font-family: 'Inter', sans-serif;
   }
   ```
3. Import the CSS file in your `.vitepress/theme/index.ts`.

## Attribution Requirements
To support the project, DepthIndex displays a small `"Powered by DepthIndex"` footer attribution inside the search modal and chat panel. You can hide the attribution by setting `features.showAttribution = false` in your configuration, but we appreciate keeping it enabled to help other developers discover the library.
