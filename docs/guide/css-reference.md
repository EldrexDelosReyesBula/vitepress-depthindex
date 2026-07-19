---
title: CSS Custom Properties Reference
description: Dictionary of all CSS variables and custom properties inside VitePress DepthIndex.
---

# CSS Custom Properties Reference

Customize the design of VitePress DepthIndex using the following CSS variable tokens. Add these overrides to your custom CSS stylesheets.

## Primary Colors
- `--depthindex-color-primary`: Theme accent color (default: `var(--vp-c-brand)`).
- `--depthindex-color-primary-hover`: Hover state for buttons and links.
- `--depthindex-color-primary-dimm`: Light transparency blend of primary color.

## Surfaces
- `--depthindex-bg-panel`: Background of the chat overlay (default: `var(--vp-c-bg)`).
- `--depthindex-bg-input`: Background of text entry containers.
- `--depthindex-bg-message-user`: Background of user chat bubbles.
- `--depthindex-bg-message-ai`: Background of assistant response bubbles.

## Borders
- `--depthindex-border-panel`: Border line color for the panel separator.
- `--depthindex-border-input`: Border stroke for input fields.
- `--depthindex-border-radius-lg`: Radius for containers and panels (default: `12px`).
- `--depthindex-border-radius-md`: Radius for input fields and bubbles (default: `8px`).

## Text
- `--depthindex-text-primary`: Standard text color (default: `var(--vp-c-text-1)`).
- `--depthindex-text-secondary`: Description and subtitle text color (default: `var(--vp-c-text-2)`).
- `--depthindex-text-muted`: Placeholder text color.

## Typography
- `--depthindex-font-family`: Text font family (default: inherits system sans-serif).
- `--depthindex-font-size-base`: Content body font size (default: `14px`).
- `--depthindex-font-size-sm`: Caption and attribution text size.

## Spacing
- `--depthindex-spacing-sm`: Small margin padding gaps (default: `8px`).
- `--depthindex-spacing-md`: Medium layout spacing (default: `16px`).
- `--depthindex-spacing-lg`: Panel content margin paddings (default: `24px`).

## Shadows
- `--depthindex-shadow-panel`: Shadows for panels (default: `0 8px 32px rgba(0, 0, 0, 0.08)`).
- `--depthindex-shadow-button`: Floating button launcher shadow.

## Transitions
- `--depthindex-transition-speed`: Global CSS transition duration (default: `0.2s`).
- `--depthindex-transition-ease`: Animation easing curve (default: `cubic-bezier(0.4, 0, 0.2, 1)`).

## Panel
- `--depthindex-panel-width`: Standard width of the side panel (default: `360px`).
- `--depthindex-panel-z-index`: Layout depth layering (default: `100`).

## Floating Button
- `--depthindex-floating-size`: Dimensions of the launcher bubble (default: `56px`).
- `--depthindex-floating-icon-size`: Icon size inside the launcher.

## Search Bar
- `--depthindex-search-bar-height`: Inline search bar height parameters.
- `--depthindex-search-bar-shadow`: Shadows for active search inputs.

## Messages
- `--depthindex-message-avatar-size`: Dimensions of author logos.
- `--depthindex-message-gap`: Gap between consecutive message bubbles.

## Code Blocks
- `--depthindex-code-bg`: Code segment background color (default: `var(--vp-c-code-bg)`).
- `--depthindex-code-border`: Border surrounding embedded source files.

## Citations
- `--depthindex-citation-bg`: Citation tag background.
- `--depthindex-citation-color`: Citation tag text color.

## Scrollbar
- `--depthindex-scrollbar-width`: Width of scroll containers (default: `6px`).
- `--depthindex-scrollbar-thumb`: Scroll thumb color.

## Dark Mode Overrides
Apply dark mode overrides using the `.dark` class selector:
```css
.dark {
  --depthindex-bg-panel: #1e1e1e;
  --depthindex-bg-message-ai: #2b2b2b;
  --depthindex-text-primary: #e5e7eb;
}
```
