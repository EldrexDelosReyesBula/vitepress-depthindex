# Troubleshooting

This guide provides troubleshooting solutions for common errors encountered when using VitePress DepthIndex.

---

## Installation Issues

### "Cannot find module" errors
If compiling throws module resolution errors, ensure that you have configured Node module resolution in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"
  }
}
```

### TypeScript errors
Ensure you cast the Vite plugin instance to `any` in your configuration if the local Vite versions differ:
```typescript
plugins: [
  DepthIndex() as any
]
```

### Peer dependency warnings
If package managers throw warnings about peer dependency version mismatches, use the `--legacy-peer-deps` flag (for npm) or configure `peerDependencyRules` (for pnpm).

### Build failures
If builds fail during index serialization, ensure that you do not have recursive or cyclic imports inside your markdown pages.

---

## Search Issues

### Search bar not appearing
Ensure that your VitePress theme has default search enabled. The plugin integrates directly into the standard search modal container.

### AI answers not showing
Confirm that search results are returning at least one match. DepthIndex relies on grounded documentation search results to synthesize answers.

### Search only works on homepage
Verify that you are using version `1.2.0` or higher, which includes full Vue-route SPA observer patches.

### Slow search performance
If query latency is high, confirm that your search vocabulary is compressed. You can profile search latency by accessing `window.__DEPTHINDEX_RUNTIME__?.getDiagnostics()`.

### Incorrect search results
Ensure that you have defined appropriate metadata tags in your pages, as DepthIndex weighs title and header matches higher than body content.

---

## Panel Issues

### Floating button not appearing
Check if client scripts were successfully injected. If you are using a completely custom layout theme, make sure to add the `<DepthIndexPanel />` component manually.

### Panel won't open
Check the browser console for JavaScript exceptions. A common cause is VitePress hydration mismatches during mounting.

### Messages not saving
Verify that IndexedDB is enabled in your browser settings. Private browsing modes may restrict database operations.

### Panel stuck loading
This indicates that the search worker failed to load. Check that the script path `/assets/search-worker.js` is accessible at your deployment root.

---

## Cloud AI Issues

### API key not working
Verify that your API key is correct and has the necessary permissions. Ensure you have selected the appropriate provider setting (e.g. `gemini` / `openai` / `anthropic`).

### Rate limit exceeded
Configure a local cache or switch the `searchMode` to `hybrid` to decrease API calls by using local indexing.

### Connection test fails
Check browser network logs to verify if a Content Security Policy (CSP) is blocking API calls to the provider's domain.

### Fallback not triggering
Confirm that `searchMode` is set to `hybrid`. In `cloud` mode, a connection error will display as a hard failure.

---

## Offline Issues

### Service worker not registering
Service workers require an HTTPS connection. Verify that your site is served over SSL.

### HTTPS not configured
Configure HTTP-to-HTTPS redirects on your static host settings.

### Cached content stale
If content is not updating, clear the browser cache or force a service worker update by closing all open tabs of your site.

### Storage quota exceeded
If IndexedDB throws quota errors, check device disk space. DepthIndex automatically attempts database cleanup when quota limits are met.

---

## Performance Issues

### High memory usage
Reduce the total number of indexed document chunks by excluding massive guides or external folder structures.

### Slow initial load
Utilize delta-indexing so that clients only pull changed content updates instead of downloading the entire document index on every visit.

### Lag on mobile devices
DepthIndex automatically profiles devices and switches to Low-End mode (reducing vector resolutions and disabling animations) on mobile viewports.

### Battery drain
Avoid setting recurring search actions or running intensive background crawlers on mobile batteries.

---

## Error Messages

### "Failed to execute 'put' on 'IDBObjectStore'"
This error occurs when the database quota is reached. Clear application storage in devtools.

### "Web Worker error"
Indicates that the browser is blocking web workers. Check your CSP policy to ensure `worker-src 'self' blob:` is enabled.

### "MIME type error"
Ensure that your web server serves `.js` files with the header `Content-Type: application/javascript`.

### "deleteMessage is not a function"
Update your npm installation to ensure your local packages are synchronized with version `1.2.0` or higher.

---

## Getting Help

### GitHub Issues
If you encounter a bug, open an issue on the repository:
👉 [GitHub Issues](https://github.com/EldrexDelosReyesBula/vitepress-depthindex/issues)

### Console Logs
Run your browser with devtools open to trace debug warnings.

### Diagnostic Report
Type this command in the developer console to export a complete system diagnostic state:
```javascript
window.__DEPTHINDEX_RUNTIME__?.getDiagnostics();
```
