---
title: FAQ & Troubleshooting
description: Frequently asked questions and troubleshooting steps for VitePress DepthIndex.
---

# FAQ & Troubleshooting

## General

### What is VitePress DepthIndex?
It is a local-first, on-device search and conversational AI assistant plugin designed for VitePress documentation sites.

### Does it require a paid subscription?
No. DepthIndex is open-source and free. In on-device mode, it runs entirely client-side without incurring any API fees.

## Installation

### Why does my build fail with "Cannot find module"?
Verify that the package is added to your `package.json` dependencies and run a clean install:
```bash
npm install
```

### Can I use DepthIndex with TypeScript?
Yes. DepthIndex includes type definitions out-of-the-box. If your configuration uses strict typings, cast the plugin registry inside `.vitepress/config.ts`:
```typescript
plugins: [DepthIndex() as any]
```

## Configuration

### How do I disable the floating chat button?
Disable it in your configuration:
```typescript
floatingButton: {
  enabled: false
}
```

### How do I change the default search shortcut?
Change the shortcut tooltip in the search bar settings:
```typescript
searchBar: {
  shortcut: 'Ctrl+/'
}
```

## Search Issues

### Why are some pages missing from the search results?
- Check if pages are listed in `indexConfig.excludePages`.
- Verify that pages contain valid Markdown headers (`#`, `##`) for extraction.
- Clear your browser's IndexedDB database (`depthindex_secure_store`) to ensure the local index is updated.

### How do I improve search result relevance?
Reduce the `chunkSize` (e.g. to 300 words) in your index configurations to isolate smaller text blocks, which yields more precise matches.

## Cloud AI Issues

### Why does the chat assistant show "Unauthorized (401)"?
Ensure your API key is correct and active. If you are using environment variables, verify that `VITE_DEPTHINDEX_CLOUD_API_KEY` is set correctly on your build server.

### What happens if I hit my API rate limits?
DepthIndex will automatically display a rate-limiting notification in the UI and fall back to local template answers silently.

## Offline Issues

### Why does search fail when I am offline?
- Verify that the Service Worker (`depthindex-sw.js`) is registered correctly.
- Ensure your site is served over **HTTPS** (or localhost), which is required for browser caching.

### How do I verify offline caching?
Open Developer Tools, go to the Application tab, select Service Workers, and check the "Offline" checkbox. Refresh the page to test caching.

## Performance

### Why is the search modal lagging?
- Reduce the number of search results to render (e.g. limit to 3 results).
- Quantize vectors to `int8` in your performance settings.
- Ensure that the Web Worker is enabled to run search computations on a background thread.

## UI Issues

### How do I customize colors to match my brand?
Override the global CSS variable tokens in your custom stylesheet. For example:
```css
:root {
  --depthindex-color-primary: #3b82f6; /* Custom Blue */
}
```

### Can I use custom icons?
Yes. DepthIndex uses FontAwesome icons. You can configure custom icon classes (e.g. `fa-solid fa-brain`) under `floatingButton.icon`.

## Error Messages

### "Signature invalid" in console
This means the index file has failed integrity verification checks. Verify your deploy pipeline signatures or clear your browser's IndexedDB storage.

### "Quota Exceeded" in console
IndexedDB is full. The engine automatically purges old chat sessions to free up space.

## Getting Help
If you cannot find a solution to your problem:
- Open a GitHub issue at [EldrexDelosReyesBula/vitepress-depthindex/issues](https://github.com/EldrexDelosReyesBula/vitepress-depthindex/issues).
- Send an email to the maintainer: `eldrexdelosreyesbula@gmail.com`.
