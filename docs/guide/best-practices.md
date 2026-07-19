---
title: Best Practices
description: Optimize search index sizes, enhance rendering performance, and secure configurations.
---

# Best Practices

## Index Optimization
- **Configure Exclusions**: Exclude non-content pages (such as drafts, tags, and changelogs) from the indexing pipeline to save space:
  ```typescript
  indexConfig: {
    excludePages: ['/changelog', '/drafts/**']
  }
  ```
- **Tune Chunk Sizes**: Use smaller `chunkSize` values (e.g. 300 words) for technical references and API documentations to yield more precise search results.
- **Toggle Code and Diagram Indexing**: If code blocks or Mermaid diagrams contain boilerplate text, disable them in `indexConfig` to reduce index file sizes.

## Performance Tuning
- **Enable Web Workers**: Keep the Web Worker option enabled to run search computations on a background thread.
- **Decompress Lazily**: Ensure `lazyDecompress` is enabled for low-end device profiles to avoid decompressing all vectors in memory on page load.
- **Limit Result Count**: Keep search limits within a reasonable range (3-5 for mobile, 10 for desktop) to optimize DOM rendering times.

## Memory Management
- **Avoid Global Variables**: Do not store search indexes in global variables, which can lead to memory leaks in single-page applications.
- **Clear Old Sessions**: The quota manager clears old chat sessions automatically when storage limits are exceeded.

## Large Documentation Sites
- For sites with more than 1,000 pages, the local index file can grow to several megabytes.
- Consider using **Hybrid Mode** or **Cloud-Only Mode** to skip local index downloads and route queries through cloud APIs.

## Cloud AI Usage
- **Compact Models**: Use lightweight models (such as `gpt-4o-mini` or `gemini-1.5-flash`) to minimize API latencies and lower token costs.
- **Environment Key Injection**: Inject API keys using `VITE_DEPTHINDEX_CLOUD_API_KEY` on your build server to lock client settings and prevent keys from being leaked in source control.

## Privacy First Design
- **Minimize Analytics**: Keep analytics categories limited to what is necessary for your dashboard.
- **Enable Privacy Banners**: If tracking analytics events, configure the `privacy.showNotice` option to display a GDPR notice banner.

## Accessibility
- DepthIndex's UI elements follow accessibility standards:
  - Input fields contain descriptive labels and placeholders.
  - Interactive buttons support keyboard focus states.
  - Chat elements match color contrast guidelines.

## Mobile Optimization
- **Disable Animations**: Turn off UI animations on mobile devices to prevent lagging.
- **Quantize Vectors**: Use `int8` vector precision on mobile devices to save memory.
- **Lazy Preloads**: Set page preloads to 0 on mobile browsers.

## SEO Tips
- Injects canonical URLs on all pages to prevent duplicate content issues.
- Keep the `aiCrawlerPolicy` set to `selective` or `allow` to help AI search engines index your documentation.

## Security Hardening
- **Signature Verification**: Ensure ECDSA signature checking is enabled in the secure update settings to prevent man-in-the-middle attacks on index files.
- **Clean Local Storage**: Clear API keys and history logs when testing on public computers.

## Deployment Checklist
Before deploying your site to production:
- [ ] Verify that the build completes without errors: `npm run docs:build`.
- [ ] Confirm that `dist/assets/depth-index.json` is generated correctly.
- [ ] Ensure that the service worker `dist/depthindex-sw.js` is registered.
- [ ] Verify that `dist/llms.txt` and `dist/llms.jsonl` are present in the build folder.
- [ ] Double-check that API keys are injected securely using environment variables.
- [ ] Test the search and chat features on both desktop and mobile browsers.
