# Advanced Tips & Tricks

## Overview
Unlock the full potential of DepthIndex. This document outlines optimization techniques, hidden features, CSS tricks, security policies, and performance tunings.

---

## Search Bar Tips

### Quick Overview Mode
Use `overview` mode to deliver instantly loading summaries of documentation articles. It keeps the search dropdown light by removing heavy formatting.

### Transfer to Panel
Configure `Enter` key or click redirects to bridge search dropdown queries into full conversations.

### Keyboard Shortcuts
Configure custom shortcuts (like `⌘K` or `/`) to open the search bar or focus the AI panel.

### Custom Placeholders
Dynamically change placeholder text depending on what section of the docs the user is viewing.

---

## Panel Tips

### Multi-Turn Conversations
Use follow-up queries to drill down into complex API details without restating your application context.

### Follow-Up Detection
Tune sensitivity levels (`strict`, `normal`, `relaxed`) to optimize the parser's thread detection.

### Page Summarize vs Discuss
Use floating page actions (Summarize/Discuss) to quickly distill long articles without copy-pasting.

### Silent Retry Mechanism
Enable automatic silent failover. If a cloud model times out, the local index is queried instantly.

---

## Customization Tips

### CSS Variable Overrides
DepthIndex uses CSS custom properties (`--di-primary`, etc.) for theme mapping. Overwrite these in `theme/custom.css`.

### Slot Injection
Inject custom Vue components into pre-defined layout slots (headers, welcome banners, or action footer lists).

### Custom AI Personality Presets
Define a unique persona for your bot (e.g. "friendly support", "strict compiler reference") under `ai.personality`.

### Logo & Branding
Inject custom logos/SVGs to make the assistant feel natively integrated.

---

## Performance Tips

### Reducing Index Size
Exclude redundant routes (like changelogs, tags, or search pages) in `indexConfig.excludePages` to save bandwidth.

### Memory Optimization
Configure cache size limits to prevent excessive memory usage on mobile devices.

### Low-End Device Mode
DepthIndex auto-detects device hardware and turns off client-side embeddings on low-end processors.

### Chunked Index Loading
Load index files lazily upon the user focusing the search bar rather than at page load.

---

## Cloud AI Tips

### Cost Optimization
Use small models (like `gemini-1.5-flash` or `gpt-4o-mini`) for search overviews, routing to expensive models only for complex reasoning.

### Token Limit Management
Cap context tokens using `usageLimits.tokens.maxContextTokens`.

### Fallback Configuration
Set up local client search as the primary fallback when a cloud provider fails.

### Custom Endpoints
Hook up self-hosted Llama/Mistral models using OpenAI-compatible custom endpoints.

---

## Security Tips

### Environment Variables
Store server-side API keys using `process.env` during VitePress compile time.

### API Key Protection
Encrypt and sandbox client-side custom keys using standard encryption layers.

### Content Security Policy
Add necessary domains (`aistudio.google.com`, `api.openai.com`) to your `connect-src` CSP header.

### PII Sanitization
Enable PII filtering in `compliance` settings to strip phone numbers, names, and emails before sending queries.

---

## Debugging Tips

### Console Commands
Run commands in browser console:
- `window.DepthIndex.clear()` — Clear local DB.
- `window.DepthIndex.inspect()` — Show memory statistics.

### Error Logs
Enable developer error logs in `analytics` configurations.

### Memory Inspection
Trace active storage footprints under Application → IndexedDB.

### Performance Profiling
Check timing metrics under Network → JS execution.

---

## Undocumented Features

### Direct Panel Control
Control panel programmatically:
```javascript
window.dispatchEvent(new CustomEvent('depthindex:open-panel'));
```

### Programmatic Search
Search via JavaScript:
```javascript
const results = await window.DepthIndex.search('API key');
```

### Custom Renderers
Override the markdown engine with a custom layout engine.

### Analytics Events
Listen to query events:
```javascript
window.addEventListener('depthindex:query', (e) => {
  console.log('Query executed:', e.detail.query);
});
```
