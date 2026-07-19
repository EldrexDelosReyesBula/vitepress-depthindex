---
title: "Creating Internal Company Documentation with AI Search"
description: "How to deploy DepthIndex on private LANs, corporate intranets, and secure internal servers."
---

# Internal Company Documentation with AI Search

Many companies use VitePress to host internal wikis, engineering guidelines, and API references. Because this information is confidential, security and data leak prevention are critical.

DepthIndex is designed to run securely inside corporate intranets.

## LAN and Offline Deployments

Since DepthIndex can execute completely inside the client's browser (Local mode), you can host your documentation on private networks without external internet access.

* **No External API Keys**: You do not need to share credentials with external companies.
* **100% On-Premises**: The documentation index, query parsing, and synthesis pipeline stay within your local network boundary.

## Secure Intranet Configurations

To ensure compliance with corporate security standards, disable external integrations in your configuration:

```typescript
DepthIndex({
  mode: 'local',
  analytics: {
    enabled: false // Disables telemetry reporting entirely
  },
  personalization: {
    enabled: false // Disables client-side history storage
  }
})
```

This ensures that confidential engineering wikis remain private.
