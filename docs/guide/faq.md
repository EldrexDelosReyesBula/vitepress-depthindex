---
title: FAQ & Troubleshooting
description: Frequently asked questions and resolution steps for common errors and limitations.
---

# Frequently Asked Questions & Troubleshooting

This section covers common errors, platform limitations, security configurations, and frequently asked questions for developers integrating **VitePress DepthIndex**.

---

## 1. Common Errors & Resolutions

### Error: "API key for [provider] is missing"
* **Why it happens**: You configured `searchMode: 'hybrid'` or `searchMode: 'cloud'`, but no build-time API key was set in the configuration options, and the user hasn't configured a local browser API key.
* **Resolution**:
  - **Option A (User Configuration)**: Direct users to click the **Settings Gear Icon** ⚙️ on the Chat Assistant UI panel. They can select their API provider (OpenAI, Gemini, or Anthropic) and input their personal API key. This key is saved in their browser's local storage.
  - **Option B (Build Configuration)**: Pass the key directly in the plugin options (not recommended for public repositories):
    ```typescript
    DepthIndex({
      cloudAPI: {
        provider: 'openai',
        apiKey: 'your-openai-api-key'
      }
    })
    ```

### Error: "CORS / Blocked by browser security policies"
* **Why it happens**: When calling cloud models directly from the browser (like Anthropic's Claude API), the browser might block requests due to CORS safety constraints if the provider doesn't permit browser fetches.
* **Resolution**: 
  - To bypass CORS constraints, configure a custom proxy or gateway endpoint under the `custom` provider.
  - Set `cloudAPI.provider: 'custom'` and set the `cloudAPI.endpoint` URL to point to your secure API gateway (which appends the appropriate authorization headers and forwards requests).
  - Our Anthropic client uses `'dangerously-allow-browser': 'true'` header fields where supported, but browser-direct Anthropic calls are best handled behind a lightweight proxy.

### Error: "Cannot find module 'fs' or 'path' or its corresponding type declarations"
* **Why it happens**: During TypeScript building or tsup compiles, Node.js types are missing from the compiler scope.
* **Resolution**: Install `@types/node` as a devDependency in your documentation repository:
  ```bash
  npm install -D @types/node
  ```

### Error: "listen EADDRINUSE: address already in use :::4173"
* **Why it happens**: When running `npm run docs:preview` (or `vitepress preview docs`), another active local development server or background process is already listening on the default preview port (`4173`).
* **Resolution**: Run the preview server on a different free port by appending the port argument:
  ```bash
  npm run docs:preview -- --port 4175
  ```

### Error: "DataCloneError: object could not be cloned"
* **Why it happens**: Browser database engines (`IndexedDB`) require stored objects to contain strictly *structured cloneable* data. Passing raw Vue reactive proxies or callback functions directly to IndexedDB object stores throws a clone exception.
* **Resolution**: DepthIndex automatically sanitizes data and unwraps Vue proxies before IndexedDB persistence. If you are developing custom plugins that write to IndexedDB, sanitize custom structures using `toRaw()` or a JSON serialization fallback.

### Behavior: Consent Dialog before Error Report Redirections
* **Why it happens**: To respect user privacy and prevent unexpected outbound traffic, DepthIndex prompts the user with a confirmation dialog before writing error metadata to the clipboard and launching external issue tracker pages.
* **Resolution**: Users can click "OK" to approve the redirection or "Cancel" to dismiss.

---

## 2. Limitations

* **No Local Generative AI (Default)**: Out-of-the-box, the local "On-Device" search mode does not run a heavy local LLM (like WebLLM) to generate conversational sentences. Instead, it extracts the most relevant document sections, links, and code blocks, and synthesizes a structured offline summary response. For full natural language conversational chat, enable `hybrid` mode.
* **Storage Footprint**: The LZ-String index compressed footprint is extremely small (~0.5MB per 1000 pages). However, for extremely large documentation sites (exceeding 10,000 pages), the index size may exceed 5MB. In such cases, lazy loading ensures page load speeds are not affected, but initial search interaction will have a brief download latency.
* **Cross-Device Keys**: Because client-side API keys are stored exclusively in the browser's `localStorage` for privacy compliance, users will need to input their API key once per device.

---

## 3. FAQs

### Can I style the floating button or search overlay to match my theme?
Yes. The plugin UI components inherit CSS theme variables from VitePress (such as `--vp-c-brand`, `--vp-c-bg`, and `--vp-c-text-1`). You can also override the custom component CSS classes directly in your `.vitepress/theme/custom.css` file. (See the [Community & Customization Guide](/guide/community) for examples).

### Does it index external links or external markdown assets?
No. DepthIndex operates entirely at build time. It only extracts and indexes markdown files that are part of the VitePress project root. It will not crawl external web links.

### How do I disable the default Floating Button and render my own Search Bar?
Set `ui.showFloatingButton: false` and `ui.enableModal: false` in the configuration. You can then import the programmatic client-side engine `DepthIndexEngine` from the package client exports and build your own input components.

### Is the PWA registration safe for multi-site hosts?
Yes. The service worker is scoped to the base path of the site where the script is located (`/depthindex-sw.js`). It will only intercept and cache GET requests for that specific origin.
