---
title: Search Bar Integration
description: Learn how VitePress DepthIndex integrates inline AI responses inside default search inputs.
---

# Search Bar Integration

## Overview
VitePress DepthIndex integrates directly into VitePress's built-in search bars (such as `.VPLocalSearchBox`, `.DocSearch-Modal`, or custom search input selectors). It displays inline AI-synthesized answers directly at the top of the search results list, providing instant answers as users type.

## Enabling Search Bar AI
Search bar integration is enabled by default. To customize or verify it, configure the `searchBar` property in `.vitepress/config.ts`:
```typescript
import { defineConfig } from 'vitepress';
import DepthIndex from 'vitepress-plugin-depthindex';

export default defineConfig({
  vite: {
    plugins: [
      DepthIndex({
        searchBar: {
          enabled: true, // Enables inline search bar answers
          position: 'top' // Displays results above standard matches
        }
      })
    ]
  }
});
```

## How Inline AI Answers Work
When a user types a query in the search input:
1. DepthIndex intercepts the keystroke and runs the query through the local search worker.
2. The `IntentEngine` parses the query's intent in the background.
3. An abbreviated, high-confidence answer is generated and displayed in a clean container at the top of the search modal.
4. Inline responses include a mandatory "Powered by DepthIndex" footer attribution.

## Search Bar vs Panel
| Characteristic | Search Bar Inline AI | Sidebar Chat Panel |
| :--- | :--- | :--- |
| **Trigger Method** | Keyboard search modal (`⌘K` / typing) | Clicking the floating launcher button |
| **Interface Style** | Horizontal layout, inline results list | Vertical messaging bubbles |
| **Response Detail** | Short summaries (typically <300 chars) | Full detailed responses with code blocks |
| **Interactions** | Non-conversational (single query) | Multi-turn chat conversations |
| **Use Case** | Quick lookups (e.g. CLI options, config keys) | Conceptual guidance, tutorials, debugging |

## Using Both Together
Using both features together provides the best experience:
1. Users can type a quick question in the search bar.
2. If they need a more detailed answer, they can click the "Discuss" or "Expand" button next to the inline answer.
3. This opens the side chat panel and copies their query over automatically to continue the conversation.

## Customization

### Placeholder Text
Customize the placeholder text displayed inside the search input element:
```typescript
searchBar: {
  placeholder: 'Search docs or ask AI...'
}
```

### Custom Logo
Add a custom branding logo next to the inline search bar answers:
```typescript
searchBar: {
  logo: {
    src: '/assets/custom-ai-logo.png',
    alt: 'AI Assistant'
  }
}
```

### Keyboard Shortcuts
Change the keyboard shortcut displayed in the search bar tooltip:
```typescript
searchBar: {
  shortcut: 'Ctrl+/'
}
```

### Max Answer Length
Limit the character count of inline search answers to prevent UI clutter:
```typescript
searchBar: {
  maxAnswerLength: 300 // Cuts off and appends ellipsis
}
```

## Disabling Features

### Disable Search Bar AI
To show only standard keyword search results without inline AI answers:
```typescript
searchBar: {
  enabled: false
}
```

### Disable Panel
To disable the sidebar chat panel completely:
```typescript
panel: {
  enabled: false
}
```

### Disable Floating Button
To hide the floating launcher button:
```typescript
floatingButton: {
  enabled: false
}
```

## Mode Combinations
- **Local-Only Search Bar**: Use `searchMode: 'on-device'`. Offers fast, offline-compatible inline answers.
- **Hybrid Search Bar**: Use `searchMode: 'hybrid'`. Inline questions query the local worker first, then call cloud APIs to refine the answer.
- **Modal-Only (No Sidebar)**: Set `panel.enabled = false` and `floatingButton.enabled = false` to provide a clean, distraction-free search experience.
