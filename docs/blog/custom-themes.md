---
title: "Customizing Your AI Panel: Themes, Colors, and Fonts"
description: "How to use DepthIndex CSS variable tokens to theme your conversational panel to match your documentation styling."
---

# Customizing Your AI Panel: Themes, Colors, and Fonts

DepthIndex is built to integrate with your documentation design system. Instead of styling components with rigid stylesheets, DepthIndex uses CSS custom properties (variables) that inherit from your theme.

## The Custom Token Map

All components are styled using variables prefixed with `--di-`. To customize the appearance of the assistant panel, override these variables at the parent level in your custom CSS stylesheet:

```css
/* Custom panel overrides */
.depthindex-panel {
  /* Brand colors */
  --di-brand: #3eaf7c;
  --di-brand-dark: #3a9e70;
  
  /* Text and background */
  --di-bg: #ffffff;
  --di-text: #2c3e50;
  
  /* Borders and headers */
  --di-border-color: #eaecef;
  --di-header-bg: #3eaf7c;
  --di-header-text: #ffffff;
  
  /* Typography */
  --di-font-family: 'Outfit', sans-serif;
  --di-border-radius: 12px;
}

/* Dark mode overrides */
.dark .depthindex-panel {
  --di-bg: #1a1a1a;
  --di-text: #e2e8f0;
  --di-border-color: #2d3748;
}
```

## Fonts and Typography

DepthIndex inherits the default typography of your VitePress site. However, if you want to use a specific font for the AI chat panel, import the font in your stylesheet and apply it:

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap');

.depthindex-panel {
  --di-font-family: 'Space Grotesk', sans-serif;
}
```

By configuring these variables, you can create a custom glassmorphism theme or a sleek, dark terminal layout matching your brand identity.
