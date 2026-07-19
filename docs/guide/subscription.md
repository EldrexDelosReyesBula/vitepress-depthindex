---
title: Subscription Gating
description: Gate AI features and documentation search behind active user subscription checks.
---

# Subscription Gating

## Overview
VitePress DepthIndex supports subscription gating. This allows you to restrict premium search features, advanced cloud AI models, or full text summaries behind a subscription check.

## Architecture
```mermaid
graph TD
    UserQuery[User Submits Query] --> CheckGate{Subscription Enabled?}
    CheckGate -->|No| Process[Process Query]
    CheckGate -->|Yes| RunCheck[Execute checkAccess()]
    RunCheck -->|Returns true| Process
    RunCheck -->|Returns false| ShowUpgrade[Show Upgrade Message & Link]
```

## Configuration
Configure subscription gates in `.vitepress/config.ts` under `usageLimits.subscription`:
```typescript
usageLimits: {
  subscription: {
    enabled: true,
    upgradeUrl: 'https://mycompany.com/billing',
    upgradeMessage: 'Unlock premium search features with a pro plan.'
  }
}
```

## Check Access Function
Define the async authorization check using `checkAccess`:
- The function must return a `Promise<boolean>`.
- It executes in the browser context, allowing it to inspect local session variables, cookies, or query your authentication servers.
```typescript
usageLimits: {
  subscription: {
    checkAccess: async () => {
      try {
        const response = await fetch('/api/user/subscription');
        const data = await response.json();
        return data.active === true;
      } catch {
        return false;
      }
    }
  }
}
```

## Free Tier Limits
You can combine subscriptions with token quotas to offer a free tier. For example, allow 5 free queries per day, and require a subscription to run additional searches:
```typescript
usageLimits: {
  tokens: {
    maxPerUserPerDay: 5
  },
  subscription: {
    enabled: true,
    checkAccess: async () => {
      return checkPremiumUserStatus();
    }
  }
}
```

## Premium Features
Gated features can include:
- Cloud AI synthesis (while keeping local on-device search free).
- High-performance models (such as `gpt-4o` vs local templates).
- Full page summaries and code export tools.

## Upgrade Messaging
When a non-subscriber attempts to access premium features:
1. The input field displays a lock icon.
2. The user settings panel displays a notice with your configured `upgradeMessage`.
3. Clicking the action button redirects the user to your `upgradeUrl`.

## Example Integration
For a complete copy-paste example of a gated documentation site, check out the [Subscription Docs Portal Example Page](/examples/subscription-docs).
