---
title: SDK Reference
description: API documentation for the Plugin Registry, Compliance checks, and Sandboxed Storage utilities.
---

# SDK Reference

Detailed API specifications for classes inside the DepthIndex Plugin SDK.

## PluginRegistry
Manages the registration, activation, deactivation, and lifecycle hook execution for all registered extensions:
- **`register(manifest, hooks)`**: Registers a plugin, runs manifest validations, and checks compliance. Returns a `Promise<RegistrationResult>`.
- **`activate(pluginId)`**: Triggers the `onActivate` hook and registers the plugin's hooks.
- **`deactivate(pluginId)`**: Triggers the `onDeactivate` hook and removes the plugin's hooks from execution queues.
- **`executeHook(hookName, ...args)`**: Sequentially triggers all active hooks registered for a lifecycle event.

## PluginContext
The isolated context object passed to all hooks, providing sandboxed access to loggers, local storage engines, and translation utilities.

## SandboxedStorage
An isolated storage provider wrapper. It prefixes all keys with the plugin's ID to prevent conflicts:
- **`get<T>(key)`**: Resolves a JSON-parsed storage item. Returns `Promise<T | null>`.
- **`set<T>(key, value)`**: Saves a JSON-serializable item.
- **`remove(key)`**: Deletes a storage item.
- **`clear()`**: Deletes all storage items owned by the plugin.
- **`getUsage()`**: Returns the total storage bytes consumed by the plugin.

## PluginLogger
The logging class used by extensions to output details:
- **`debug(message, ...args)`**: Outputs debug messages.
- **`info(message, ...args)`**: Outputs info logs.
- **`warn(message, ...args)`**: Outputs warnings.
- **`error(message, ...args)`**: Outputs errors.
Log prefixes match the plugin's ID (e.g. `[DepthIndex:my-plugin]`).

## UIExtensionPoints
Provides methods to add HTML elements or custom renderers directly to the chat interface:
- **`addHeaderButton(button)`**: Appends a custom button to the panel header.
- **`addBeforeMessages(element)`**: Inserts an HTML element above the message viewport.
- **`addAfterMessages(element)`**: Inserts an HTML element below the message viewport.
- **`addFooterContent(element)`**: Appends content to the panel input footer.
- **`registerRenderer(contentType, renderer)`**: Registers a custom content parser (e.g. video files, CSV records).

## I18nAPI
Provides methods to translate strings inside extensions:
- **`registerPack(pack)`**: Registers a new translation pack native dictionary.
- **`setLanguage(code)`**: Changes the current UI translation locale.
- **`t(key, params)`**: Translates a key string. Supports string parameters interpolation.
- **`getAvailableLanguages()`**: Returns list of available translation languages.

## ComplianceEnforcer
Audits extensions during registration to ensure compliance with privacy regulations:
- **`validateAllPlugins(plugins)`**: Audits permission manifests and data disclosure configs. Checks for GDPR, CCPA, and Ph Data Privacy (RA 10173) compliance.
- **`generateDisclosureNotice(report)`**: Returns a formatted text disclosure summary to display to users.

## ExtensionTemplate
To create a compliant extension, conform to the following boilerplate template:
```typescript
import { PluginManifest, PluginHooks, PluginPermission } from 'vitepress-plugin-depthindex/sdk';

export const manifest: PluginManifest = {
  id: 'my-custom-plugin',
  name: 'Custom Logger',
  version: '1.1.6',
  description: 'Logs events to the console.',
  author: { name: 'Support Team' },
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

export const hooks: PluginHooks = {
  onBeforeSearch(query, context) {
    context.logger.info(`User queried: ${query}`);
    return query;
  }
};
```
