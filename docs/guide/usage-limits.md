---
title: Usage & Token Limits
description: Manage API token usage, response lengths, rate limits, and subscription access checks.
---

# Usage & Token Limits

## Overview
VitePress DepthIndex includes a usage and rate-limiting system that helps you manage API budgets and prevent abuse in hybrid or cloud modes.

## Token Limits
Configure maximum token thresholds under `usageLimits.tokens`:

### Per Request
- **`maxPerRequest`**: Maximum prompt + completion tokens allowed for a single query (default: `1000`).

### Per User Per Day
- **`maxPerUserPerDay`**: Daily limit per browser session (default: `5000`). Tracks token consumption inside the client's local storage.

### Per User Per Month
- **`maxPerUserPerMonth`**: Monthly limit per browser session (default: `20000`).

## Response Length Limits
Limit response character counts to prevent long completions:

### Local Answers
- **`localMaxChars`**: Maximum characters for local template responses (default: `800`).

### Cloud Answers
- **`cloudMaxChars`**: Maximum characters for cloud AI responses (default: `1000`).

### Inline Answers
- **`inlineMaxChars`**: Maximum characters for inline search bar answers (default: `300`).

## Rate Limiting
Prevent spamming by limiting query frequencies under `usageLimits.rateLimit`:
- **`queriesPerMinute`**: Maximum queries allowed per minute (default: `10`).
- **`queriesPerHour`**: Maximum queries allowed per hour (default: `50`).
- **`cooldownMessage`**: Message displayed when rate limits are exceeded (default: `"Too many queries. Please wait a moment."`).

## Subscription Gating
For premium documentation sites, you can restrict access to search and AI features using a custom access check:
```typescript
usageLimits: {
  subscription: {
    enabled: true,
    checkAccess: async () => {
      // Custom verification logic (e.g. check auth token)
      return localStorage.getItem('user_token') !== null;
    },
    upgradeUrl: 'https://mycompany.com/pricing',
    upgradeMessage: 'Upgrade to a Premium plan to unlock unlimited search and AI assistant access.'
  }
}
```

## Checking Usage
Users can check their remaining token usage and rate limits at the bottom of the settings panel, helping them monitor their daily/monthly allowances.

## User Messaging
When a usage limit is hit:
- The input field is disabled.
- An alert is displayed in the chat panel with instructions on how to upgrade or wait for cooldown timers.
