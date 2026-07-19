---
title: TypeScript Types
description: Complete TypeScript type definition dictionary for VitePress DepthIndex.
---

# TypeScript Types

Exhaustive TypeScript type definitions for configuring and extending VitePress DepthIndex.

## DepthIndexOptions
The root configuration options object:
```typescript
export interface DepthIndexOptions {
  searchMode?: 'on-device' | 'cloud' | 'hybrid';
  placement?: PlacementConfig;
  searchBar?: SearchBarConfig;
  panel?: PanelConfig;
  floatingButton?: FloatingButtonConfig;
  cloudAPI?: {
    provider: 'openai' | 'gemini' | 'anthropic' | 'custom';
    endpoint?: string;
    model?: string;
    apiKey?: string;
  };
  indexConfig: {
    chunkSize: number;
    overlapSize: number;
    excludePages: string[];
    includeCodeBlocks: boolean;
    includeMermaid: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    position: 'bottom-right' | 'bottom-left';
    showFloatingButton: boolean;
    enableFullscreen: boolean;
    enableModal: boolean;
    showSettingsButton?: boolean;
    defaultSize?: 'compact' | 'normal' | 'fullscreen';
    customClass?: string;
    triggerIcon?: string;
    title?: string;
  };
  features?: {
    allowUserCloudConfig?: boolean;
    showAttribution?: boolean;
    allowEdit?: boolean;
    allowFeedback?: boolean;
  };
  personalization: {
    enabled: boolean;
    storage: 'localStorage' | 'indexedDB';
    maxHistory?: number;
  };
  offline: {
    enabled: boolean;
    cacheStrategy: 'network-first' | 'cache-first';
  };
  llmText: {
    enabled: boolean;
    formats: ('txt' | 'jsonl' | 'markdown')[];
    includeMetadata: boolean;
  };
  seo?: SEOConfig;
  extensions?: any[];
  analytics?: AnalyticsConfig;
  privacy?: {
    showNotice?: boolean;
    privacyPolicyUrl?: string;
  };
  language?: LanguageConfig;
  settings?: SettingsConfig;
  ai?: {
    personality?: AIPersonalityConfig;
    logo?: {
      src?: string;
      alt?: string;
      size?: 'sm' | 'md' | 'lg';
      position?: 'header' | 'welcome' | 'both';
    };
  };
  usageLimits?: UsageLimitsConfig;
}
```

## SearchBarConfig
Configuration schema for the inline search bar results:
```typescript
export interface SearchBarConfig {
  enabled?: boolean;
  position?: 'top' | 'bottom';
  maxAnswerLength?: number;
  showExpandButton?: boolean;
  placeholder?: string;
  logo?: {
    src?: string;
    icon?: string;
    alt?: string;
  };
  shortcut?: string;
}
```

## PanelConfig
Options for the floating side-panel assistant overlay:
```typescript
export interface PanelConfig {
  enabled?: boolean;
  position?: 'right' | 'left';
  defaultSize?: 'compact' | 'normal' | 'fullscreen';
  showHistory?: boolean;
  logo?: {
    src?: string;
    icon?: string;
    alt?: string;
  };
  title?: string;
  subtitle?: string;
  showSettings?: boolean;
}
```

## FloatingButtonConfig
Customizes the viewport corners CTA trigger bubble:
```typescript
export interface FloatingButtonConfig {
  enabled?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  icon?: string;
  pulse?: boolean;
  label?: string;
}
```

## AIPersonalityConfig
Configure the response personality, tone registers, and fallback behaviors:
```typescript
export interface AIPersonalityConfig {
  preset?: 'professional' | 'friendly' | 'concise' | 'teacher' | 'mentor' | 'custom';
  customPrompt?: string;
  tone?: {
    formality?: 'casual' | 'neutral' | 'formal';
    enthusiasm?: 'reserved' | 'balanced' | 'enthusiastic';
    verbosity?: 'concise' | 'balanced' | 'detailed';
    emojis?: 'none' | 'minimal' | 'moderate';
    firstPerson?: boolean;
  };
  behavior?: {
    alwaysCite?: boolean;
    suggestFollowUps?: boolean;
    admitUncertainty?: boolean;
    offerElaboration?: boolean;
    greeting?: 'warm' | 'brief' | 'none';
  };
}
```

## LanguageConfig
Localization parameters:
```typescript
export interface LanguageConfig {
  default?: string;
  allowUserChange?: boolean;
  availableLanguages?: string[];
  forceLanguage?: string;
  translateAnswers?: boolean;
  communityTranslationsUrl?: string;
}
```

## AnalyticsConfig
Configure client-side telemetry limits and endpoints:
```typescript
export interface AnalyticsConfig {
  enabled?: boolean;
  storage?: 'indexeddb' | 'localstorage' | 'memory' | 'none';
  externalEndpoint?: string;
  externalHeaders?: Record<string, string>;
  batchSize?: number;
  flushInterval?: number;
  maxEvents?: number;
  trackedCategories?: ('search' | 'click' | 'feedback' | 'error' | 'session' | 'navigation')[];
  excludePages?: string[];
}
```

## UsageLimitsConfig
Enforces limits on client requests and token usages:
```typescript
export interface UsageLimitsConfig {
  tokens?: {
    maxPerRequest?: number;
    maxPerUserPerDay?: number;
    maxPerUserPerMonth?: number;
    maxContextTokens?: number;
    maxResponseTokens?: number;
  };
  response?: {
    localMaxChars?: number;
    cloudMaxChars?: number;
    inlineMaxChars?: number;
    truncationMessage?: string;
  };
  rateLimit?: {
    queriesPerMinute?: number;
    queriesPerHour?: number;
    cooldownMessage?: string;
  };
}
```

## SEOConfig
Options for the build-time meta injector and AI robots.txt crawler policies:
```typescript
export interface SEOConfig {
  siteUrl?: string;
  siteName: string;
  siteDescription: string;
  author?: string;
  twitterHandle?: string;
  defaultImage?: string;
  googleSiteVerification?: string;
  aiCrawlerPolicy?: 'allow' | 'disallow' | 'selective';
}
```

## PluginManifest
The metadata interface required for all extensions and plugins:
```typescript
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  permissions: PluginPermission[];
  minDepthIndexVersion: string;
  dataDisclosure: DataDisclosure;
  compliance: ComplianceStatement;
}
```

## PluginHooks
Hook callbacks for extending core search/synthesize routines:
```typescript
export interface PluginHooks {
  onRegister?: (context: PluginContext) => void | Promise<void>;
  onActivate?: (context: PluginContext) => void | Promise<void>;
  onDeactivate?: (context: PluginContext) => void | Promise<void>;
  onBeforeSearch?: (query: string, context: PluginContext) => string | Promise<string>;
  onAfterSearch?: (results: SearchResult[], context: PluginContext) => SearchResult[] | Promise<SearchResult[]>;
  onBeforeSynthesize?: (query: string, results: SearchResult[], context: PluginContext) => void | Promise<void>;
  onAfterSynthesize?: (answer: SynthesizedAnswer, context: PluginContext) => SynthesizedAnswer | Promise<SynthesizedAnswer>;
}
```

## PluginContext
The sandboxed execution environment passed to plugin lifecycle hooks:
```typescript
export interface PluginContext {
  manifest: PluginManifest;
  depthIndexVersion: string;
  siteContext: SiteProfile;
  searchEngine?: DepthIndexEngine;
  storage: SandboxedStorage;
  logger: PluginLogger;
  ui: UIExtensionPoints;
}
```
