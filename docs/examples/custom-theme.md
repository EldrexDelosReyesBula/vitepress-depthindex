---
title: Custom Theme Example
description: Learn how to build a premium glassmorphism theme using custom CSS variable overrides.
---

# Custom Theme

## CSS Overrides
Apply a modern, premium **glassmorphism** design theme by overriding CSS variable tokens in your custom stylesheets:
```css
/* docs/styles/glassmorphism.css */
:root {
  /* Transparency Surfaces */
  --depthindex-bg-panel: rgba(255, 255, 255, 0.65);
  --depthindex-bg-input: rgba(255, 255, 255, 0.4);
  
  /* Borders & Blurs */
  --depthindex-border-panel: 1px solid rgba(255, 255, 255, 0.3);
  --depthindex-border-input: 1px solid rgba(255, 255, 255, 0.2);
  
  /* Primary Accent Colors */
  --depthindex-color-primary: #ec4899; /* Pink accent */
  --depthindex-color-primary-hover: #db2777;
  
  /* Shadows & Radius */
  --depthindex-shadow-panel: 0 10px 50px rgba(236, 72, 153, 0.1);
  --depthindex-border-radius-lg: 24px;
  --depthindex-border-radius-md: 16px;
}

/* Backdrops Filter */
.depthindex-panel {
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}

/* Dark Mode Support */
.dark {
  --depthindex-bg-panel: rgba(20, 18, 24, 0.7);
  --depthindex-bg-input: rgba(255, 255, 255, 0.05);
  --depthindex-border-panel: 1px solid rgba(255, 255, 255, 0.08);
}
```

## Result
Once the stylesheet is imported:
- The chat overlay panel displays with a semi-transparent, blurred backdrop.
- Shadows cast a soft pink glow around the assistant.
- Accent items, hyperlinks, and buttons highlight in a premium pink color, updating dynamically when dark mode is toggled.
