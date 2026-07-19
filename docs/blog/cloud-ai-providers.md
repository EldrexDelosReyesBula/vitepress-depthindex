---
title: "Adding Cloud AI to Your Docs: OpenAI, Gemini, or Claude"
description: "How to connect remote cloud LLMs to synthesize highly detailed answers in Hybrid and Cloud modes."
---

# Adding Cloud AI to Your Docs

While on-device synthesis is fast and cost-effective, complex inquiries often benefit from the reasoning capabilities of large language models.

DepthIndex allows you to connect remote cloud LLM providers to power Hybrid and Cloud modes.

## Supported Providers

DepthIndex supports multiple cloud LLM adapters out-of-the-box:

* **Google Gemini**: Recommended for fast, cost-effective reasoning.
* **OpenAI (GPT-4o)**: Standard developer option.
* **Anthropic Claude**: Ideal for highly structured coding output.

## Configuring Provider Credentials

To connect a provider, configure the `cloud` options block in your configuration. We recommend using environment variables to keep your API credentials secure during compilation:

```typescript
DepthIndex({
  mode: 'hybrid',
  cloud: {
    provider: 'gemini', // Options: 'openai' | 'gemini' | 'claude'
    apiKey: process.env.DEPTHINDEX_CLOUD_API_KEY,
    model: 'gemini-1.5-flash',
    maxTokens: 1000
  }
})
```

During deployment, ensure `DEPTHINDEX_CLOUD_API_KEY` is added to your hosting platform's environment variables (such as Vercel, Netlify, or Cloudflare).
