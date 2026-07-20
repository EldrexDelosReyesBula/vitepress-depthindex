# Search Bar Overview Mode

## Overview
DepthIndex introduces a highly integrated search bar experience designed to provide quick, on-device AI answers directly in your documentation search box. With v1.2.0, you can customize this behavior using two distinct display modes: **AI Overview Mode** (default) and **Ask AI Button Mode**.

---

## How It Works

### Overview vs Full Answer
When a user types a query in the search bar, DepthIndex automatically performs a local search across the documentation index. 
- In **Overview Mode**, the plugin displays a concise, stripped-down summary at the top of the search dropdown.
- Clicking the card or the "Chat" button transfers the query to the **Full Chat Panel**, where the user can view the complete synthesized answer, complete with complex formatting, code snippets, interactive tables, and citation details.

### What Gets Stripped
To keep the search bar clean and focused, Overview Mode automatically filters out complex layout components:
- **Code Blocks**: Fenced code blocks are stripped and replaced with `[code example]` (or `[code examples]` for consecutive blocks).
- **Tables**: Markdown tables are replaced with `[table]` or `[tables]`.
- **Mermaid Diagrams**: Diagrams are replaced with `[diagram]`.
- **Images/Videos**: Stripts out markdown images and YouTube embeds, replacing them with `[image]` or `[video]` placeholders.
- **Badges/Headers**: References, confidence metrics, and related topics sections are removed.

---

## Configuration

Add the `searchBar` options into your VitePress configuration file (`.vitepress/config.ts`):

### Overview Mode
Shows a concise AI summary at the top of the search dropdown.
```typescript
// .vitepress/config.ts
export default defineConfig({
  vite: {
    plugins: [
      DepthIndex({
        searchBar: {
          mode: 'overview',
          overviewMaxLength: 400,
          showExpandButton: true
        }
      })
    ]
  }
})
```

### Button Mode
Shows only an "Ask AI" button in the search bar. Clicking it opens the chat panel directly.
```typescript
// .vitepress/config.ts
export default defineConfig({
  vite: {
    plugins: [
      DepthIndex({
        searchBar: {
          mode: 'button',
          askAIButtonText: '🤖 Ask AI'
        }
      })
    ]
  }
})
```

### Disabling Search Bar AI
Disables all AI functionality within the search bar, keeping it as a standard local search bar. The chat panel remains available via other triggers.
```typescript
// .vitepress/config.ts
export default defineConfig({
  vite: {
    plugins: [
      DepthIndex({
        searchBar: {
          mode: 'none'
        }
      })
    ]
  }
})
```

---

## Overview Text

### Max Length
The default maximum length for the overview text is **400 characters**. This can be customized using the `overviewMaxLength` property.

### Content Rules
To maintain formatting simplicity, only plain text and basic inline markdown styling are allowed. The generator truncates text gracefully at sentence boundaries to avoid cut-off words.

### Formatting Support
The overview text supports the following basic markdown syntax:
- **Bold**: `**text**` renders as bold.
- *Italic*: `*text*` renders as italic.
- `Inline Code`: Backticks are preserved as inline code formatting.
- [Links](https://example.com): Hyperlinks are rendered as clickable tags.

---

## Transfer to Chat

### Click Behavior
Clicking anywhere on the AI Overview card (except on external links or buttons) will automatically close the search modal and open the full chat panel with the query pre-filled to generate a complete answer.

### Enter Key Behavior
Pressing the **Enter** key while the search input is focused will automatically transfer the query to the main chat panel.

---

## Customization

### Placeholder Text
Customize the placeholder text inside the input box:
```typescript
searchBar: {
  placeholder: 'Type your query or ask the AI...'
}
```

### Custom Logo
Set a custom brand logo or icon for the AI indicator:
```typescript
searchBar: {
  logo: {
    src: '/custom-logo.png',
    alt: 'My Docs Bot'
  }
}
```

### Button Text
Define custom text for the button when using `button` mode:
```typescript
searchBar: {
  askAIButtonText: 'Consult Assistant'
}
```

---

## Examples

For ready-to-use configuration patterns, check out the [Overview Examples](/examples/search-overview) and [Button Examples](/examples/search-button) sections.

---

## Best Practices
- **Use Overview Mode** for general-purpose documentation sites where quick context helps users locate sections faster.
- **Use Button Mode** if your users prefer a clean Algolia-like look and are more likely to want a full-page conversation.
- **Keep Max Length Under 500** characters to ensure search dropdown layouts remain readable on smaller laptop screens.
