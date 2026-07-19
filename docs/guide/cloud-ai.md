---
title: Cloud AI Setup
description: Configure Google Gemini, OpenAI, Anthropic, or custom endpoints for VitePress DepthIndex.
---

# Cloud AI Setup

## Supported Providers

### OpenAI
To use OpenAI models (such as `gpt-4o` or `gpt-4o-mini`):
```typescript
cloudAPI: {
  provider: 'openai',
  model: 'gpt-4o-mini'
}
```

### Google Gemini
To use Google Gemini models (such as `gemini-1.5-flash` or `gemini-1.5-pro`):
```typescript
cloudAPI: {
  provider: 'gemini',
  model: 'gemini-1.5-flash'
}
```

### Anthropic Claude
To use Anthropic Claude models (such as `claude-3-5-sonnet`):
```typescript
cloudAPI: {
  provider: 'anthropic',
  model: 'claude-3-5-sonnet-20240620'
}
```

### Custom Endpoint
To route queries through a self-hosted API gateway or custom proxy:
```typescript
cloudAPI: {
  provider: 'custom',
  endpoint: 'https://api.mycompany.com/v1/chat/completions',
  model: 'custom-model-name'
}
```
Custom endpoints must conform to standard OpenAI chat completion schemas.

## User-Side API Keys
If you leave `apiKey` blank in the configuration, users can enter their own API keys in the chat panel settings. Entered keys are stored securely in the user's browser `localStorage` and are never sent to the site owner or third-party servers.

## Server-Side API Keys (Environment Variables)
To provide a free out-of-the-box AI assistant for your users, you can configure a server-side API key. Inject the key using the following environment variable during the build process:
```bash
VITE_DEPTHINDEX_CLOUD_API_KEY=your_secret_api_key
```
If this environment variable is detected:
- The user settings panel is automatically locked.
- Users cannot view or modify the API keys.
- Client requests route through the pre-configured token automatically.

## Data Flow & Privacy
When a query is processed in hybrid or cloud modes:
1. The client-side Privacy Firewall intercepts the payload.
2. It scrubs personal data (such as emails, phone numbers, and API keys).
3. The cleaned payload is sent directly to the cloud provider's official endpoint.
4. Data is subject to the provider's privacy policies; standard enterprise endpoints do not use API data to train models.

## Token Limits
To manage your API costs, you can set maximum token limits in your configuration:
```typescript
usageLimits: {
  tokens: {
    maxPerRequest: 1000,
    maxPerUserPerDay: 5000,
    maxContextTokens: 4000
  }
}
```

## Cost Optimization
- **Use Hybrid Mode**: Searching locally first keeps token counts low, as only the most relevant document chunks are sent to the cloud model.
- **Select Compact Models**: Use lightweight models (such as `gpt-4o-mini` or `gemini-1.5-flash`) to optimize response times and lower API costs.
- **Set Character Limits**: Limit the response size to prevent models from generating excessively long answers:
  ```typescript
  usageLimits: {
    response: {
      cloudMaxChars: 800
    }
  }
  ```

## Fallback Behavior
If cloud calls fail (due to API key errors, rate limits, or network issues), the chat assistant automatically falls back to local synthesis. It formats an answer based on local document text, ensuring users get a response without displaying visible errors.

## Testing Connection
To verify your cloud setup:
1. Open the side chat panel in your browser.
2. Open the settings menu and verify that your cloud provider is selected.
3. Send a test query (e.g. `"Test connection"`).
4. Inspect the network tab in Developer Tools: verify that requests route directly to the provider's API.

## Troubleshooting
- **API Key Errors (401)**: Double-check that your API key is correct and has not expired.
- **Quota Exceeded (429)**: You have hit your AI provider's rate limits. Check your billing status or configure token limits in DepthIndex.
- **Blocked Requests**: If you are using a custom endpoint, ensure that CORS headers are configured correctly to allow requests from your documentation domain.
