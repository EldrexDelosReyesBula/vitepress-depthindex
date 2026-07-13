---
title: Plugin SDK & Registry
description: Complete developer guide to extending DepthIndex using custom plugins, sandboxed storage, and permissions.
---

# Plugin SDK & Registry Guide

VitePress DepthIndex features a modular **Plugin SDK** that allows developers to extend search, indexing, formatting, and UI capabilities with custom on-device plugins.

To guarantee user privacy and supply chain security, the Plugin SDK implements a strict **Permissions Model** and an automated **Compliance Enforcer**. This ensures that all third-party extensions disclose their data behaviors upfront.

---

## 1. Core Architecture

The Plugin SDK consists of three major components:
1. **`PluginManifest`**: A declarative definition of the plugin, its author, requirements, permissions, and data disclosures.
2. **`PluginRegistry`**: The manager class that validates, registers, activates, and dispatches lifecycle events to plugins.
3. **`PluginContext`**: The sandboxed context object passed to plugins, providing restricted access to allowed APIs (like a sandboxed `localStorage`).

```
┌─────────────────────────────────────────────────────────────┐
│                    DEPTHINDEX CORE                           │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    PluginRegistry                    │  │
│  └──────────┬───────────────────────────────┬───────────┘  │
│             │                               │              │
│    Instantiates & checks            Dispatches events      │
│             ▼                               ▼              │
│  ┌────────────────────┐          ┌────────────────────┐    │
│  │ ComplianceEnforcer │          │   Custom Plugin    │    │
│  │ - Permissions Check│          │ - onRegister()     │    │
│  │ - GDPR/CCPA Audit  │          │ - onActivate()     │    │
│  └────────────────────┘          └────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Declaring a Plugin Manifest

Every plugin must expose a metadata object compliant with the `PluginManifest` schema. 

### Manifest Interface
```typescript
export interface PluginManifest {
  id: string;                      // Unique slug (e.g. "my-custom-plugin")
  name: string;                    // Human-readable plugin name
  version: string;                 // Semantic version string (e.g. "1.0.0")
  description: string;             // Brief explanation of functionality
  author: {
    name: string;
    email?: string;
  };
  permissions: ('local-storage' | 'network')[]; // Declared API capabilities
  minDepthIndexVersion: string;    // Minimum supported engine version
  dataDisclosure: {
    collectsData: boolean;         // Declares if PII or query metrics are processed
    storageLocation: 'local' | 'cloud' | 'none';
    thirdPartySharing: boolean;    // Declares if data is sent to external services
  };
  compliance: {
    gdpr: boolean;                 // GDPR policy compliant
    ccpa: boolean;                 // CCPA policy compliant
    phDataPrivacy: boolean;        // PH Data Privacy Act compliant
    piiHandling: 'none' | 'sanitized' | 'raw';
    securityMeasures: string[];    // Array of measures (e.g. ["encryption"])
  };
}
```

---

## 3. Creating a Custom Plugin

Below is a complete implementation example of a custom plugin that extends the database schema or adds localization packs.

### Complete TypeScript Example

```typescript
import { PluginRegistry, PluginManifest, PluginContext } from 'vitepress-plugin-depthindex/sdk';

// 1. Define Manifest
const manifest: PluginManifest = {
  id: 'custom-logger-plugin',
  name: 'Telemetry Logger',
  version: '1.0.0',
  description: 'Log search queries for on-device diagnostics.',
  author: {
    name: 'Jane Doe',
    email: 'jane@example.com'
  },
  permissions: ['local-storage'], // Requests only local storage access
  minDepthIndexVersion: '1.1.0',
  dataDisclosure: {
    collectsData: true,
    storageLocation: 'local',
    thirdPartySharing: false // Strictly on-device
  },
  compliance: {
    gdpr: true,
    ccpa: true,
    phDataPrivacy: true,
    piiHandling: 'sanitized',
    securityMeasures: ['local-encryption']
  }
};

// 2. Define Lifecycle Handlers
const handlers = {
  onRegister: (ctx: PluginContext) => {
    console.log(`[Plugin System] Registered: ${manifest.name}`);
    
    // Use sandboxed local storage
    ctx.storage.setItem('registered_at', new Date().toISOString());
  },
  
  onActivate: (ctx: PluginContext) => {
    console.log(`[Plugin System] Activated: ${manifest.name}`);
    
    // Perform initialization logic
    const registeredAt = ctx.storage.getItem('registered_at');
    console.log(`Plugin was registered originally at: ${registeredAt}`);
  },
  
  onDeactivate: (ctx: PluginContext) => {
    console.log(`[Plugin System] Deactivated: ${manifest.name}`);
    
    // Clear temp files or event listeners
  }
};

// 3. Register with the Engine Registry
const registry = new PluginRegistry();
registry.register(manifest, handlers);

// 4. Activate the Plugin
registry.activate(manifest.id);
```

---

## 4. The Permissions Model & Sandboxed Storage

To protect host applications, plugins are **prevented** from direct access to global scopes or unfiltered disk operations:

* **Sandboxed `localStorage`**: Plugins receive a wrapped storage client that automatically namespaces all keys to `depthindex_plugin_${manifest.id}_`. This prevents one plugin from reading or corrupting keys belong to other plugins or the main VitePress runtime.
* **Compliance Checks**: If a plugin attempts to execute network calls or write data but its manifest does not declare `network` or `local-storage` permissions, the `ComplianceEnforcer` blocks execution and throws a security error.

### Sandboxed Storage API Methods
* `ctx.storage.setItem(key: string, value: string): void`
* `ctx.storage.getItem(key: string): string | null`
* `ctx.storage.removeItem(key: string): void`
* `ctx.storage.clear(): void` (Clears keys within the plugin namespace only)

---

## 5. Security & Compliance Enforcement

When registering a plugin, `PluginRegistry` executes the `ComplianceEnforcer` validation routine:

```typescript
import { ComplianceEnforcer } from 'vitepress-plugin-depthindex/sdk';

const enforcer = new ComplianceEnforcer();
const result = enforcer.verifyPluginCompliance(manifest);

if (!result.compliant) {
  console.error('Plugin registration blocked:', result.violations);
  throw new Error(`Compliance violation: ${result.violations.join(', ')}`);
}
```

### Automatic Blocking Violations
1. **Invalid MinVersion**: Registration is aborted if the host engine is older than the declared `minDepthIndexVersion`.
2. **Undeclared Privacy Behaviors**: If the plugin code utilizes data writing hooks but `dataDisclosure.collectsData` is configured as `false`.
3. **Empty Author Fields**: To maintain open traceability, plugins without author information will be rejected.
