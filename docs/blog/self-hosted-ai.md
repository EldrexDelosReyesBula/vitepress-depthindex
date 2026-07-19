---
title: "Self-Hosting AI for Your Documentation"
description: "How to route synthesis requests through your own proxy endpoints to protect corporate API keys."
---

# Self-Hosting AI for Your Documentation

In enterprise environments, exposing public API keys in client-side code is a security vulnerability. Additionally, corporate policies may restrict sending data directly to third-party endpoints.

DepthIndex supports custom proxy endpoints, allowing you to route all requests through your own secure, self-hosted AI servers.

## Configuring a Custom Endpoint

Instead of configuring OpenAI or Gemini credentials directly in the plugin options, set your `endpoint` URL:

```typescript
DepthIndex({
  mode: 'hybrid',
  cloud: {
    provider: 'openai', // Tells DepthIndex to send OpenAI-compatible payloads
    endpoint: 'https://api.mycompany.internal/v1/chat/completions',
    model: 'internal-llama-3'
  }
})
```

## Enterprise Benefits

By routing synthesis requests through an internal proxy gateway, you get:
* **Token Rate-Limiting**: Enforce daily token quotas per user.
* **Security Audits**: Log corporate requests internally for security audits.
* **Internal LLM Routing**: Run on-premises models (like Llama 3 or Mistral) without sending data to public clouds.
