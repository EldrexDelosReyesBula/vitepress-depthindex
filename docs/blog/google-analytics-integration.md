---
title: "How to Add Google Analytics to Your DepthIndex Docs"
description: "Log search queries, user feedback, and citation clicks directly to Google Analytics."
---

# Google Analytics Integration

Many documentation teams use Google Analytics (GA4) to monitor user behavior. Integrating DepthIndex with GA4 helps you track search events, user feedback, and citation clicks.

## Registering GA4 Events

To track search events, use the SDK hooks to trigger Google Analytics calls:

```typescript
import DepthIndex from 'vitepress-plugin-depthindex';

// Monitor search clicks and feedback inside VitePress configuration
DepthIndex({
  analytics: {
    enabled: true,
    customTracker: (event, payload) => {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'depthindex_' + event, {
          query: payload.query,
          latency_ms: payload.latencyMs,
          rating: payload.rating,
          page_url: payload.pageUrl
        });
      }
    }
  }
})
```

## Tracked GA4 Conversions

Once configured, the following events will appear in your Google Analytics dashboard:
* `depthindex_search`: Triggered on every successful query.
* `depthindex_feedback`: Logged when a user rates an answer.
* `depthindex_citation_click`: Fired when a user clicks an inline citation badge.
