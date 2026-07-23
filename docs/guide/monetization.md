# Monetization & Subscription

## Overview
VitePress DepthIndex features a complete Subscription & Monetization SDK that allows documentation owners, SaaS platforms, and enterprise portals to gate features, limit daily search queries, and monetize AI documentation search.

## Subscription Plans

### Defining Plans
You can define multiple tier plans (e.g. Free, Pro, Enterprise) inside the DepthIndex plugin options:

```typescript
DepthIndex({
  subscription: {
    enabled: true,
    provider: 'stripe', // 'stripe' | 'paddle' | 'lemonsqueezy' | 'gumroad' | 'custom'
    plans: [
      {
        id: 'free',
        name: 'Free Tier',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: {
          maxQueriesPerDay: 10,
          maxTokensPerQuery: 500,
          cloudAI: false,
          chatHistory: false,
          citations: true,
          codeBlocks: true,
          exportChats: false,
          customAI: false,
          prioritySupport: false,
        },
      },
      {
        id: 'pro',
        name: 'Pro Member',
        price: 19,
        currency: 'USD',
        interval: 'month',
        features: {
          maxQueriesPerDay: 500,
          maxTokensPerQuery: 4000,
          cloudAI: true,
          chatHistory: true,
          citations: true,
          codeBlocks: true,
          exportChats: true,
          customAI: true,
          prioritySupport: true,
        },
      },
    ],
    checkAccess: async () => {
      const res = await fetch('/api/user/subscription');
      return res.json();
    },
  },
})
```

### Feature Gates
DepthIndex checks user features dynamically before performing queries or rendering premium elements:
- `canAccess(feature)`
- `canQuery()`
- `trackQuery()`

### Checking Access
Use `SubscriptionGate` programmatically in your custom components or headless engine:

```typescript
import { SubscriptionGate } from 'vitepress-plugin-depthindex/sdk';

const gate = new SubscriptionGate(config);
const canUseCloudAI = await gate.canAccess('cloudAI');
```

## Payment Providers
DepthIndex seamlessly integrates with major payment platforms:
- **Stripe**
- **Paddle**
- **LemonSqueezy**
- **Gumroad**
- **Custom Provider**

## Usage Tracking
DepthIndex tracks user query counts against daily plan limits (`maxQueriesPerDay`). When limits are reached, customizable upgrade prompts are presented.

## Upgrade Prompts
Configure upgrade call-to-actions directly:

```typescript
ui: {
  showUpgradePrompts: true,
  upgradeMessage: 'Upgrade to Pro for unlimited AI search & cloud responses.',
  upgradeUrl: '/pricing',
}
```

## Webhook Integration
Sync subscription lifecycle events (`subscription.created`, `subscription.updated`, `subscription.cancelled`) to your backend via standard HMAC webhooks.
