---
title: "Using Built-in Analytics to Improve Your Documentation"
description: "How to monitor search success rates and discover common developer topics."
---

# Using Built-in Analytics

Good documentation is a living asset. To know what to update, you must understand what developers are searching for and where they are getting stuck.

DepthIndex includes a built-in, privacy-compliant analytics reporting system.

## Enabling Analytics

To log analytics events, configure an anonymous endpoint in your configuration options:

```typescript
DepthIndex({
  analytics: {
    enabled: true,
    endpoint: 'https://analytics.mycompany.com/log',
    trackHelpfulness: true // Adds thumbs-up/down feedback triggers
  }
})
```

## Tracked Metrics

Our analytics tracker pushes anonymous events to your endpoint. The schema logs:

1. **Feedback Ratios**: Logs user votes on synthesized responses.
2. **Search Latency**: Reports client-side vector search and LLM response execution speeds.
3. **Usage Ratios**: Displays the percentage of queries resolved locally vs. cloud fallbacks.

This data allows you to identify performance bottlenecks and monitor search accuracy over time.
