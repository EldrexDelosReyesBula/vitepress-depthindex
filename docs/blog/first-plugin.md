---
title: "Building Your First DepthIndex Plugin"
description: "Use the DepthIndex SDK to build custom extensions, tabs, and analytics integrations."
---

# Building Your First DepthIndex Plugin

DepthIndex features a modular architecture. By using the **DepthIndex SDK**, you can extend the core assistant panel, register custom UI tabs, hook into lifecycle events, and integrate third-party tools.

## The Extension Interface

A DepthIndex plugin is defined by a manifest and an activation lifecycle hook:

```typescript
import { PluginManifest, PluginContext } from 'vitepress-plugin-depthindex/sdk';

const myPlugin = {
  manifest: {
    id: 'my-custom-extension',
    name: 'Feedback Tab',
    version: '1.0.0',
    description: 'Adds a custom feedback form to the assistant panel',
    author: { name: 'DevTeam' },
    permissions: ['write:ui']
  },
  
  activate(ctx: PluginContext) {
    ctx.logger.info('Feedback Plugin Activated!');
    
    // Inject a custom tab inside the assistant card
    ctx.ui.registerTab({
      id: 'feedback-tab',
      label: 'Feedback',
      component: 'FeedbackForm'
    });
  }
};
```

## Publishing Custom Extensions

You can distribute custom plugins as NPM packages. Site owners can register your plugin in their `config.ts`:

```typescript
DepthIndex({
  plugins: [
    myPlugin
  ]
})
```

## Custom UI Elements

By utilizing Vue templates inside custom slots, you can extend the chat panel with custom HTML widgets:

```html
<!-- FeedbackForm.vue -->
<template>
  <div class="feedback-widget">
    <h3>Help us improve</h3>
    <textarea v-model="feedback" placeholder="What went wrong?"></textarea>
    <button @click="submit">Send</button>
  </div>
</template>
```
