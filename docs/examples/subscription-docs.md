---
title: Subscription Docs Example
description: Learn how to restrict search and AI features behind active subscription checks.
---

# Subscription Docs

## Configuration
Enable subscription gating in your configuration under `usageLimits.subscription`:
```typescript
import { defineConfig } from 'vitepress';
import DepthIndex from 'vitepress-plugin-depthindex';

export default defineConfig({
  vite: {
    plugins: [
      DepthIndex({
        usageLimits: {
          subscription: {
            enabled: true,
            upgradeUrl: 'https://mycompany.com/billing',
            upgradeMessage: 'Access to the AI search assistant requires a Pro Plan.'
          }
        }
      })
    ]
  }
});
```

## Check Access
Define the `checkAccess` routine inside your configuration. This function is executed client-side, allowing you to check cookie keys, check local variables, or query your billing database:
```typescript
usageLimits: {
  subscription: {
    checkAccess: async () => {
      // 1. Check if user token is in local storage
      const token = localStorage.getItem('user_pro_token');
      if (!token) return false;
      
      // 2. Validate token against auth server
      try {
        const response = await fetch('/api/billing/validate', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        return data.valid === true;
      } catch {
        return false; // Fallback to false if server fails
      }
    }
  }
}
```

## Free vs Premium
With subscription gating enabled:
- **Free users**: Can browse the documentation pages normally, but search inputs and the floating chat bubble are locked.
- **Premium users**: Access is unlocked. The search bar displays inline AI answers, and the side panel chat interface is available.
- **Upgrade Prompts**: Locked components display your custom `upgradeMessage` with a button linking directly to the checkout page specified by `upgradeUrl`.
