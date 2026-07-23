# Webhooks

## Overview
DepthIndex Webhook SDK allows backend systems to receive real-time notifications for search queries, user feedback, citation clicks, and subscription events with HMAC signature verification.

## Available Events

| Event Name | Description |
|------------|-------------|
| `search.query` | Triggered when a search query is submitted |
| `search.no_results` | Triggered when a search yields zero matches |
| `feedback.positive` | User gave positive feedback on an answer |
| `feedback.negative` | User gave negative feedback on an answer |
| `citation.click` | User clicked a citation link |
| `panel.open` | Search chat panel opened |
| `panel.close` | Search chat panel closed |
| `subscription.created` | Subscription activated |
| `subscription.updated` | Subscription plan changed |
| `subscription.cancelled` | Subscription cancelled |
| `user.signup` | User account registration |

## Payload Format

```json
{
  "event": "search.query",
  "timestamp": "2026-07-23T12:00:00.000Z",
  "data": {
    "query": "How to configure WebGPU"
  },
  "signature": "c2lnbmF0dXJlX2htYWNfc2hhMjU2..."
}
```

## Signature Verification
All payloads include an HMAC SHA-256 signature in the `X-DepthIndex-Signature` header. Verify the signature on your server using your webhook secret.

## Retry Logic
Configure retry attempts for failed webhook requests:

```typescript
DepthIndex({
  webhooks: [
    {
      url: 'https://api.mycompany.com/depthindex-events',
      secret: 'whsec_secret_key',
      events: ['search.query', 'feedback.negative'],
      retry: {
        maxRetries: 3,
        backoff: 'exponential',
        initialDelay: 1000,
      },
    },
  ],
})
```

## Security
DepthIndex automatically sanitizes sensitive fields (like API keys, passwords, tokens) from webhook payloads before transmission.
