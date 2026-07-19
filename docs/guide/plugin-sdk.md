---
title: Plugin SDK
description: Learn how to build, test, and publish custom extensions for VitePress DepthIndex.
---

# Plugin SDK

## Overview
VitePress DepthIndex features a sandboxed **Plugin SDK** (`src/sdk/index.ts`) that allows developers to extend the search engine, pre-process queries, add custom renderers, and integrate custom UI buttons.

## Creating an Extension
An extension is a JavaScript object that contains:
1. An **Extension Manifest** defining the plugin's metadata, permissions, and compliance.
2. An optional set of **Lifecycle Hooks** that trigger during runtime events.

## Extension Manifest
Every extension must declare a manifest. This manifest is audited during build time to ensure it complies with security and privacy requirements.

### Required Fields
- `id`: Unique alphanumeric identifier (e.g. `my-plugin`).
- `name`: Human-readable name.
- `version`: Semantic version string.
- `description`: Summary of what the plugin does.
- `author`: Name and contact information of the author.

### Permissions
Plugins must request permission to access specific features:
```typescript
export enum PluginPermission {
  READ_DOCS = 'read:docs',
  READ_QUERIES = 'read:queries',
  READ_RESULTS = 'read:results',
  WRITE_SEARCH = 'write:search',
  WRITE_SYNTHESIS = 'write:synthesis',
  NETWORK = 'network',
  STORAGE = 'storage',
  EXTERNAL_COMMUNICATION = 'external:communication',
  READ_PERSONALIZATION = 'read:personalization',
  WRITE_UI = 'write:ui',
}
```

### Data Disclosure
All plugins must disclose what data they collect and where it is stored:
```typescript
export interface DataDisclosure {
  collectsData: boolean;
  collectedData?: string[];
  storageLocation: 'local' | 'external' | 'both';
  externalEndpoints?: string[];
  thirdPartySharing: boolean;
  privacyPolicyUrl?: string;
}
```

### Compliance Statement
Manifests must declare GDPR, CCPA, and Ph Data Privacy (RA 10173) compliance:
```typescript
export interface ComplianceStatement {
  gdpr: boolean;
  ccpa: boolean;
  phDataPrivacy: boolean;
  piiHandling: 'none' | 'sanitized' | 'processed' | 'stored';
  securityMeasures: string[];
}
```

## Lifecycle Hooks
Hook into the runtime lifecycle of DepthIndex:
- **`onRegister`**: Triggered when the plugin is registered.
- **`onActivate`**: Triggered when the plugin is enabled.
- **`onDeactivate`**: Triggered when the plugin is disabled.
- **`onBeforeSearch`**: Modifies the search query before running search.
- **`onAfterSearch`**: Filters or enhances search results.
- **`onBeforeSynthesize`**: Runs before answer synthesis starts.
- **`onAfterSynthesize`**: Modifies the generated response.
- **`onBeforeRender`**: Runs before UI elements are rendered.
- **`onAfterRender`**: Modifies HTML elements after rendering.
- **`onError`**: Handles runtime errors.
- **`onDestroy`**: Runs during cleanup.

## Plugin Context
Lifecycle hooks receive a `PluginContext` parameter that exposes sandboxed utilities:
```typescript
export interface PluginContext {
  manifest: PluginManifest;
  depthIndexVersion: string;
  siteContext: SiteProfile;
  searchEngine?: DepthIndexEngine;
  storage: SandboxedStorage;
  logger: PluginLogger;
  ui: UIExtensionPoints;
  i18n: I18nAPI;
}
```

## Sandboxed Storage
Provides key-value storage isolated by the plugin's ID:
```typescript
export interface SandboxedStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getUsage(): Promise<number>;
}
```

## UI Extension Points
Add custom UI elements without modifying the core codebase:
```typescript
export interface UIExtensionPoints {
  addHeaderButton(button: HeaderButton): void;
  addBeforeMessages(element: HTMLElement): void;
  addAfterMessages(element: HTMLElement): void;
  addFooterContent(element: HTMLElement): void;
  registerRenderer(contentType: string, renderer: any): void;
}
```

## I18n API
Exposes the localization engine, allowing plugins to translate their custom UI elements dynamically.

## Publishing Extensions
To publish an extension:
1. Package it as an ESM module.
2. List the required dependency `vitepress-plugin-depthindex` under `peerDependencies` in your `package.json`.
3. Publish to npm under `vitepress-depthindex-plugin-*` prefix.

## Extension Template
```typescript
import { PluginManifest, PluginHooks, PluginPermission } from 'vitepress-plugin-depthindex/sdk';

export const myPluginManifest: PluginManifest = {
  id: 'my-custom-plugin',
  name: 'Custom Logger',
  version: '1.0.0',
  description: 'Logs search queries to console',
  author: { name: 'Dev Team' },
  permissions: [PluginPermission.READ_QUERIES],
  dataDisclosure: {
    collectsData: false,
    storageLocation: 'local',
    thirdPartySharing: false
  },
  compliance: {
    gdpr: true,
    ccpa: true,
    phDataPrivacy: true,
    piiHandling: 'none',
    securityMeasures: ['None']
  }
};

export const myPluginHooks: PluginHooks = {
  onBeforeSearch(query, context) {
    context.logger.info(`User searched for: ${query}`);
    return query;
  }
};
```

## Example Extensions
For real-world examples, check out the following guides:
- **[Self-Hosted AI Example](/examples/self-hosted-ai)**: Routes requests through a custom API proxy.
- **[Multilingual Setup Example](/examples/multilingual)**: Registers custom community translation packs.
