# Ask AI Button Examples

## Default Button Mode

### Configuration
Configure button display inside the VitePress search container:
```typescript
DepthIndex({
  searchBar: {
    mode: 'button'
  }
})
```

### User Experience
A compact, styled action button labeled **Ask AI** is injected on the right side of the search input field. Typing a query and clicking the button (or hitting the Enter key) directly dispatches the question to the full chat panel.

### Screenshot
*Ask AI button rendered inside the right edge of the search bar input box.*

---

## Custom Button Text

### Configuration
Set custom text and emojis for the button:
```typescript
DepthIndex({
  searchBar: {
    mode: 'button',
    askAIButtonText: '🤖 Query Bot'
  }
})
```

### Result
The button label updates to `"🤖 Query Bot"` with adjusted widths and padding.

---

## Button with Search

### Configuration
Optionally combine button mode with customized search input settings:
```typescript
DepthIndex({
  searchBar: {
    mode: 'button',
    placeholder: 'Search docs or ask AI...',
    shortcut: '⌘/'
  }
})
```

### Result
The search bar has a custom shortcut key trigger and matches the placeholder while preserving the quick "Ask AI" action.

---

## No Search Bar AI

### Configuration
Remove all AI features from the search bar (only standard VitePress search results remain):
```typescript
DepthIndex({
  searchBar: {
    mode: 'none'
  }
})
```

### Result
No overview cards or action buttons are injected into the search components.
