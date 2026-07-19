---
title: "Building a Subscription-Based Documentation Portal"
description: "Learn how to gate AI features, restrict search indexing, and require API tokens for premium documentation tiers."
---

# Building a Subscription-Based Documentation Portal

Some businesses monetize their developer portals. Under this model, access to basic documentation is free, but advanced tutorials and interactive AI features require a subscription.

DepthIndex supports subscription gating out-of-the-box.

## Configuring Subscription Gating

To restrict AI search to authenticated users, configure the `subscription` parameters in your configuration:

```typescript
DepthIndex({
  subscription: {
    enabled: true,
    promptMessage: 'Subscribe to Premium to unlock AI answers!',
    loginUrl: 'https://myportal.com/login',
    validateToken: async (token) => {
      // Validate user token against your database
      const res = await fetch('https://api.myportal.com/verify?token=' + token);
      return res.ok;
    }
  }
})
```

## User Experience

When subscription gating is enabled:
1. Anonymous users see standard keyword results.
2. An upgrade banner prompts them to log in to unlock AI responses.
3. Authenticated users input their token to activate the interactive chat assistant.

This ensures you can monetize your documentation assets securely.
