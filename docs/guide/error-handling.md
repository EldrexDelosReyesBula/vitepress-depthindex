---
title: Error Handling
description: Discover how VitePress DepthIndex manages runtime failures, error categories, and user reporting pipelines.
---

# Error Handling

## Error Categories
DepthIndex groups runtime errors into the following categories:
- **`INDEX_LOAD`**: Failure to download, decompress, or parse the compressed search index payload.
- **`SEARCH_EXECUTION`**: Failures encountered during tokenization, stemming, or dot-product matching.
- **`RENDERING`**: Code block, KaTeX math, or markdown compilation errors.
- **`NETWORK`**: Loss of connection during search mode checks or cloud API calls.
- **`STORAGE`**: IndexedDB storage access restrictions or local storage quota limits.
- **`CLOUD_API`**: Key validation, request timeouts, or model API rate limits.
- **`VALIDATION`**: Plugin configuration mismatches or invalid manifest parameters.
- **`SECURITY`**: PII firewall violations, invalid ECDSA verification signatures, or origin blocks.
- **`UNKNOWN`**: Fallback category for unexpected errors.

## Error Severity Levels
Errors are classified into four severity levels:
- **`info`**: Minor anomalies that do not affect the search workflow (e.g. storage quota adjustments).
- **`warning`**: Non-blocking errors (e.g., service worker load failure; falls back to standard fetch).
- **`error`**: A blocking issue (e.g. cloud API query failure; falls back silently to local search).
- **`critical`**: System-wide failures (e.g., index files missing or database corruption).

## User-Facing Errors
When an error occurs, DepthIndex keeps the interface functional and shows user-friendly notifications instead of cryptic logs. For instance, if a cloud API call fails, the chat panel displays an inline warning suggesting local search instead of crashing.

## Error Recovery Actions
- **Database Reset**: If IndexedDB storage gets corrupted, the system attempts to clear the database and re-download the index automatically.
- **Cache Purge**: When storage limits are exceeded, the quota manager automatically removes old query sessions.
- **Offline Fallback**: If network calls fail, the engine shifts search requests from cloud to local index structures.

## Developer Error Reporting
Developers can configure error reporting destinations:
```typescript
// Error report config schema
export interface ErrorReportConfig {
  enabled: boolean;
  target: 'github' | 'email' | 'custom' | 'none';
  githubRepo?: string; // e.g. 'username/repo'
  emailAddress?: string;
  customEndpoint?: string;
}
```

### GitHub Issues
Directs users to open a GitHub issue with pre-filled error details. DepthIndex requests explicit user confirmation before opening the URL.

### Email Reports
Prepares an email containing the error summary and prompts the user to send it to the configured support email address.

### Custom Endpoint
Sends structured JSON payloads containing error traces directly to a custom API log aggregator.

## Rate Limiting
To prevent abuse and manage API costs, you can set client rate limits in your configuration:
```typescript
usageLimits: {
  rateLimit: {
    queriesPerMinute: 10,
    cooldownMessage: 'Too many queries. Please wait a moment.'
  }
}
```

## PII in Error Reports
To protect user privacy, all error reporting payloads are routed through the client-side Privacy Firewall. The firewall automatically scrubs:
- API Keys (e.g. OpenAI `sk-` keys).
- Personal Data (emails, names, phone numbers).
- Local chat history records.

## Debug Mode
For development, you can enable verbose console logging. This outputs complete tokenizer stems, vector similarity dot-products, and pipeline stage timings:
```typescript
// Enable debug log logs
DepthIndex({
  extensions: [{
    manifest: { id: 'debug-logger', permissions: ['read:docs'] },
    hooks: {
      onError: (err) => console.log('[DepthIndex Debug]', err)
    }
  }]
})
```

## Silent Retry Mechanism
When a transient network error occurs during a cloud call, DepthIndex does not show an error immediately. It attempts up to 3 silent retries using an exponential backoff strategy before falling back to local synthesis.
