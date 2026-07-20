# Search Overview Examples

## Default Overview Mode

### Configuration
By default, DepthIndex enables `overview` mode when search bar integration is active:
```typescript
DepthIndex({
  searchBar: {
    mode: 'overview'
  }
})
```

### User Experience
A small robot icon with the badge **AI Overview** appears at the top of VitePress local search results. As users type, the AI overview updates dynamically.

### Screenshot
*AI Overview displays clean summary text at the top of the VitePress search modal results.*

---

## Custom Max Length

### Configuration
Set character threshold before truncating:
```typescript
DepthIndex({
  searchBar: {
    mode: 'overview',
    overviewMaxLength: 200
  }
})
```

### Result
The output text limits itself to 200 characters, resolving cleanly at the end of the last complete sentence.

---

## No Expand Button

### Configuration
Hide the "Chat" button from the overview header:
```typescript
DepthIndex({
  searchBar: {
    mode: 'overview',
    showExpandButton: false
  }
})
```

### Result
The summary card displays without the expand/chat button. The user can still click anywhere on the card to open the chat panel.

---

## Custom Placeholder

### Configuration
Overwrite the default search input placeholder text:
```typescript
DepthIndex({
  searchBar: {
    mode: 'overview',
    placeholder: 'Ask the Docs Bot a question...'
  }
})
```

### Result
The search bar displays `"Ask the Docs Bot a question..."` inside the input before the user begins typing.

---

## Custom Logo

### Configuration
Replace the default robot SVG icon:
```typescript
DepthIndex({
  searchBar: {
    mode: 'overview',
    logo: {
      src: '/my-custom-bot-avatar.png',
      alt: 'Company AI assistant'
    }
  }
})
```

### Result
The AI Overview card renders the custom avatar image in the top-left of the header.
