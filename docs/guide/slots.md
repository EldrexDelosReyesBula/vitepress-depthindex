---
title: Vue Slot System
description: Customize chat panel layouts and inputs using custom Vue slots and slot props.
---

# Vue Slot System

## Overview
VitePress DepthIndex's Vue components (such as `DepthIndexPanel.vue`) support layout overrides using standard Vue slots, allowing you to insert custom branding, custom inputs, or footer elements.

## Available Slots

### header
Overrides the entire top header container of the side panel.

### logo
Customizes the branding logo area in the top-left of the panel header.

### title
Customizes the text title of the chat overlay (default: config `panel.title`).

### header-actions
Overrides the controls in the top-right of the header (such as the Fullscreen, Settings, and Close buttons).

### welcome
Overrides the initial empty welcome state dashboard.

### welcome-icon
Customizes the icon shown in the welcome screen.

### welcome-text
Customizes the welcome text and subtitle descriptions.

### suggestions
Customizes the list of suggested questions displayed in the welcome dashboard.

### messages
Overrides the entire scrolling message list viewport.

### message
Customizes individual user and assistant chat message elements.

### footer
Overrides the bottom input and formatting footer container.

### input
Customizes the chat text input field and submit buttons.

### attribution
Overrides the `"Powered by DepthIndex"` copyright and attribution link.

## Slot Props
Some slots pass properties back to their parents:
- **`message` slot**: Passes `{ message: MessageObj, index: number }`.
- **`suggestions` slot**: Passes `{ suggestions: string[], onSelect: (q: string) => void }`.
- **`header` slot**: Passes `{ size: string, onClose: () => void, toggleFullscreen: () => void }`.

## Examples

### Overriding the Welcome Panel
```vue
<!-- Custom theme setup using slots -->
<template>
  <FloatingButton>
    <template #welcome>
      <div class="custom-welcome">
        <h3>Welcome to our Developer Hub</h3>
        <p>Ask anything about our SDK configs.</p>
      </div>
    </template>
  </FloatingButton>
</template>
```

### Overriding the Attribution Footer
```vue
<template>
  <FloatingButton>
    <template #attribution>
      <span class="custom-attribution">
        Enterprise Assistant v1.1.6
      </span>
    </template>
  </FloatingButton>
</template>
```
