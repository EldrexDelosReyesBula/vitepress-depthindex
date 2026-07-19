---
title: UI Customization
description: Customize layouts, fonts, dark modes, animations, and stylesheets in VitePress DepthIndex.
---

# UI Customization

## Overview
VitePress DepthIndex supports comprehensive UI style customization. Because elements are injected inside the client viewport, you can style the chat panel, search modal, floating buttons, and message blocks using CSS variables or custom CSS classes.

## CSS Variables
DepthIndex defines styled tokens inside a default stylesheet (`depthindex-tokens.css`). You can override these variables globally to customize the design theme. For the full list of tokens, see the [CSS Custom Properties Reference](/guide/css-reference).

## Panel Styling
The side chat assistant panel (`.depthindex-panel`) can be styled using the following properties:
```css
:root {
  --depthindex-panel-bg: rgba(255, 255, 255, 0.85); /* Glassmorphism background */
  --depthindex-panel-width: 380px;
  --depthindex-panel-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  --depthindex-panel-border: 1px solid rgba(255, 255, 255, 0.18);
}
```

## Search Bar Styling
Customize the search bar and inline AI answer container:
```css
:root {
  --depthindex-search-bar-border: 2px solid var(--vp-c-brand);
  --depthindex-inline-answer-bg: var(--vp-c-bg-soft);
  --depthindex-inline-answer-padding: 16px;
}
```

## Floating Button Styling
Customize the launcher bubble:
```css
:root {
  --depthindex-floating-size: 56px;
  --depthindex-floating-bg: var(--vp-c-brand);
  --depthindex-floating-icon-size: 20px;
}
```

## Message Bubbles
Style user messages and AI response bubbles inside the chat timeline:
```css
:root {
  --depthindex-bubble-user-bg: var(--vp-c-brand);
  --depthindex-bubble-user-text: #ffffff;
  --depthindex-bubble-ai-bg: var(--vp-c-bg-mute);
  --depthindex-bubble-ai-text: var(--vp-c-text-1);
}
```

## Code Blocks
Customize code blocks embedded within chat answers:
```css
:root {
  --depthindex-code-bg: #1e1e1e;
  --depthindex-code-color: #d4d4d4;
  --depthindex-code-radius: 6px;
}
```

## Citations
Style citation link anchors and hover states:
```css
:root {
  --depthindex-citation-bg: var(--vp-c-brand-dimm);
  --depthindex-citation-color: var(--vp-c-brand);
  --depthindex-citation-radius: 50%;
}
```

## Dark Mode
DepthIndex respects VitePress's dark mode state automatically. When the site's dark mode toggles, DepthIndex applies overrides based on the following classes:
```css
.dark {
  --depthindex-panel-bg: rgba(30, 30, 30, 0.85);
  --depthindex-bubble-ai-bg: #2d2d2d;
  --depthindex-bubble-ai-text: #f3f4f6;
  --depthindex-text-primary: #f3f4f6;
}
```

## Custom Fonts
By default, the plugin inherits the parent typography families configured by VitePress (typically Inter or Outfit). To apply a custom typography family:
```css
:root {
  --depthindex-font-family: 'Roboto Mono', monospace;
}
```

## Custom Icons (FontAwesome)
DepthIndex auto-injects FontAwesome 6 icons dynamically for panel interfaces and launcher buttons. You can change launcher icons in your configuration:
```typescript
floatingButton: {
  icon: 'fa-solid fa-sparkles' // FontAwesome icon class
}
```

## Animation Control
To disable or control the speed of UI animations (such as the launcher pulse effect or message entry transitions):
```css
:root {
  --depthindex-transition-speed: 0.3s;
  --depthindex-pulse-animation: none; /* Disables launcher pulse */
}
```

## Complete Theme Examples
For complete copy-paste CSS theme examples, check out the following resources:
- [Custom Glassmorphism Theme Example](/examples/custom-theme)
- [Custom Brand Colors Example](/examples/custom-ui)
