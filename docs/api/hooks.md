---
title: Lifecycle Hooks
description: Hook API references, types, parameters, and examples in VitePress DepthIndex.
---

# Lifecycle Hooks

Hook into the lifecycle events of VitePress DepthIndex using custom plugins.

## onRegister
Triggered when the plugin is registered inside the `PluginRegistry`.
- **Signature**: `onRegister?(context: PluginContext): void | Promise<void>`
- **Use Case**: Initialize database schemas, check for updates, or register custom content renderers.
```typescript
onRegister(context) {
  context.logger.info(`${context.manifest.name} initialized!`);
}
```

## onActivate
Triggered when the plugin transitions to the `active` status.
- **Signature**: `onActivate?(context: PluginContext): void | Promise<void>`
- **Use Case**: Add UI control buttons to the panel header or setup event listeners.

## onDeactivate
Triggered when the user disables the plugin in the settings.
- **Signature**: `onDeactivate?(context: PluginContext): void | Promise<void>`
- **Use Case**: Remove UI elements and release memory references.

## onBeforeSearch
Runs before a search query is executed.
- **Signature**: `onBeforeSearch?(query: string, context: PluginContext): string | Promise<string>`
- **Return value**: The modified query string.
- **Use Case**: Strip whitespace, translate input keywords, or apply custom NLP expansion filters.

## onAfterSearch
Runs after search matches are retrieved from the index.
- **Signature**: `onAfterSearch?(results: SearchResult[], context: PluginContext): SearchResult[] | Promise<SearchResult[]>`
- **Return value**: The filtered or enhanced search results list.
- **Use Case**: Re-rank results, remove matching chunks from excluded categories, or inject custom metadata.

## onBeforeSynthesize
Runs before the synthesis step starts.
- **Signature**: `onBeforeSynthesize?(query: string, results: SearchResult[], context: PluginContext): void | Promise<void>`
- **Use Case**: Log user query requests for analytics or adjust synthesis parameters dynamically.

## onAfterSynthesize
Runs after the AI answer has been generated.
- **Signature**: `onAfterSynthesize?(answer: SynthesizedAnswer, context: PluginContext): SynthesizedAnswer | Promise<SynthesizedAnswer>`
- **Return value**: The modified answer payload.
- **Use Case**: Verify response text structure, format custom highlights, or inject related topic links.

## onBeforeRender
Runs before message HTML elements are appended to the DOM.
- **Signature**: `onBeforeRender?(element: HTMLElement, context: PluginContext): void | Promise<void>`

## onAfterRender
Runs after message HTML elements are mounted in the UI.
- **Signature**: `onAfterRender?(element: HTMLElement, context: PluginContext): void | Promise<void>`
- **Use Case**: Apply custom syntax highlighting classes or attach click event listeners to custom buttons.

## onError
Triggered when an error occurs in the runtime.
- **Signature**: `onError?(error: DepthIndexError, context: PluginContext): void | Promise<void>`
- **Use Case**: Send log reports to custom logging servers.

## onDestroy
Triggered when the chat panel components are destroyed.
- **Signature**: `onDestroy?(context: PluginContext): void | Promise<void>`
- **Use Case**: Clear storage objects and teardown connections.
