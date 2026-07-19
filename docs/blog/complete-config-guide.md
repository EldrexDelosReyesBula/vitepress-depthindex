---
title: "The Complete DepthIndex Configuration Guide"
description: "A comprehensive reference guide detailing every configuration key, parameter, and default setting."
---

# The Complete DepthIndex Configuration Guide

This guide provides a comprehensive reference for configuring the DepthIndex plugin options in your `config.ts` file.

## Options Schema

```typescript
interface DepthIndexOptions {
  // Search execution mode: 'local' | 'hybrid' | 'cloud'
  mode?: 'local' | 'hybrid' | 'cloud';
  
  // Custom branding details
  branding?: {
    logoUrl?: string;
    title?: string;
    subtitle?: string;
    footerNotice?: string;
  };
  
  // Personalization settings
  personalization?: {
    enabled?: boolean;
    maxHistory?: number;
  };
  
  // Cloud model parameters (for Hybrid/Cloud modes)
  cloud?: {
    provider?: 'openai' | 'gemini' | 'claude';
    apiKey?: string;
    model?: string;
    endpoint?: string;
    maxTokens?: number;
  };
  
  // Analytics configuration
  analytics?: {
    enabled?: boolean;
    endpoint?: string;
    trackHelpfulness?: boolean;
  };
}
```

## Default Options

If you register DepthIndex without passing parameters, the following defaults are applied:

```typescript
const DEFAULT_OPTIONS = {
  mode: 'local',
  personalization: {
    enabled: false,
    maxHistory: 20
  },
  analytics: {
    enabled: false
  }
};
```
