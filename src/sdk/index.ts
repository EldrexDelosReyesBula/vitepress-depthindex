import type { DepthIndexEngine } from '../client/search-engine.js';
import type { AnswerSynthesizer } from '../client/answer-synthesizer.js';
import type { SiteProfile } from '../client/site-context.js';
import { SiteContextEngine } from '../client/site-context.js';
import type { SearchResult } from '../types/index.js';
import { ComplianceEnforcer } from './compliance.js';
import { I18nAPI } from '../extensions/i18n/index.js';

// ─── Permission System ───

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

export interface DataDisclosure {
  collectsData: boolean;
  collectedData?: string[];
  storageLocation: 'local' | 'external' | 'both';
  externalEndpoints?: string[];
  retentionPeriod?: string;
  thirdPartySharing: boolean;
  privacyPolicyUrl?: string;
}

export interface ComplianceStatement {
  gdpr: boolean;
  ccpa: boolean;
  phDataPrivacy: boolean;
  piiHandling: 'none' | 'sanitized' | 'processed' | 'stored';
  securityMeasures: string[];
}

export interface DepthIndexError {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  context?: any;
}

export interface SynthesizedAnswer {
  content: string;
  references: Array<{ title: string; url: string }>;
  confidence: number;
}

// ─── Lifecycle Hooks ───

export interface PluginHooks {
  onRegister?: (context: PluginContext) => void | Promise<void>;
  onActivate?: (context: PluginContext) => void | Promise<void>;
  onDeactivate?: (context: PluginContext) => void | Promise<void>;
  onBeforeSearch?: (query: string, context: PluginContext) => string | Promise<string>;
  onAfterSearch?: (results: SearchResult[], context: PluginContext) => SearchResult[] | Promise<SearchResult[]>;
  onBeforeSynthesize?: (query: string, results: SearchResult[], context: PluginContext) => void | Promise<void>;
  onAfterSynthesize?: (answer: SynthesizedAnswer, context: PluginContext) => SynthesizedAnswer | Promise<SynthesizedAnswer>;
  onBeforeRender?: (element: HTMLElement, context: PluginContext) => void | Promise<void>;
  onAfterRender?: (element: HTMLElement, context: PluginContext) => void | Promise<void>;
  onError?: (error: DepthIndexError, context: PluginContext) => void | Promise<void>;
  onDestroy?: (context: PluginContext) => void | Promise<void>;
}

// ─── Plugin Context ───

export interface PluginContext {
  manifest: PluginManifest;
  depthIndexVersion: string;
  siteContext: SiteProfile;
  searchEngine?: DepthIndexEngine;
  synthesizer?: AnswerSynthesizer;
  storage: SandboxedStorage;
  logger: PluginLogger;
  ui: UIExtensionPoints;
  i18n: I18nAPI;
}

// ─── Sandboxed Storage ───

export interface SandboxedStorage {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getUsage(): Promise<number>;
}

// ─── Plugin Logger ───

export interface PluginLogger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
}

// ─── UI Extension Points ───

export interface UIExtensionPoints {
  addHeaderButton(button: HeaderButton): void;
  addBeforeMessages(element: HTMLElement): void;
  addAfterMessages(element: HTMLElement): void;
  addFooterContent(element: HTMLElement): void;
  registerRenderer(contentType: string, renderer: any): void;
}

export interface HeaderButton {
  id: string;
  icon: string; // SVG string
  label: string;
  onClick: () => void;
  position?: 'left' | 'right';
}

// ─── Registered Plugin representation ───

export interface RegisteredPlugin {
  manifest: PluginManifest;
  hooks: PluginHooks;
  context: PluginContext;
  status: 'registered' | 'active' | 'inactive' | 'error';
  registeredAt: number;
}

export interface RegistrationResult {
  success: boolean;
  error?: string;
}

// ─── Plugin Registry ───

export class PluginRegistry {
  private plugins: Map<string, RegisteredPlugin> = new Map();
  private hooks: Map<string, PluginHooks[]> = new Map();
  private siteContextEngine: SiteContextEngine;

  constructor() {
    this.siteContextEngine = new SiteContextEngine();
  }

  /**
   * Register a plugin
   */
  async register(manifest: PluginManifest, hooks: PluginHooks): Promise<RegistrationResult> {
    // Validate manifest
    const validation = this.validateManifest(manifest);
    if (!validation.valid) {
      return { success: false, error: validation.error! };
    }
    
    // Check permissions against core compliance
    const activePluginsList = Array.from(this.plugins.values());
    // Create a temporary representation to run validation
    const tempPlugin: RegisteredPlugin = {
      manifest,
      hooks,
      context: {} as any,
      status: 'registered',
      registeredAt: Date.now(),
    };
    
    const complianceCheck = ComplianceEnforcer.validateAllPlugins([...activePluginsList, tempPlugin]);
    if (!complianceCheck.passed) {
      const violation = complianceCheck.violations.find(v => v.pluginId === manifest.id);
      return { success: false, error: violation ? violation.message : 'Plugin compliance check failed' };
    }
    
    // Check for conflicts
    if (this.plugins.has(manifest.id)) {
      return { success: false, error: `Plugin "${manifest.id}" is already registered` };
    }
    
    // Create sandboxed context
    const context = this.createPluginContext(manifest);
    
    // Register
    const registered: RegisteredPlugin = {
      manifest,
      hooks,
      context,
      status: 'registered',
      registeredAt: Date.now(),
    };
    
    this.plugins.set(manifest.id, registered);
    
    // Call onRegister hook
    if (hooks.onRegister) {
      try {
        await hooks.onRegister(context);
      } catch (error) {
        console.error(`[DepthIndex SDK] Plugin "${manifest.id}" onRegister failed:`, error);
        this.plugins.delete(manifest.id);
        return { success: false, error: 'Plugin registration failed' };
      }
    }
    
    console.log(`[DepthIndex SDK] Plugin registered: ${manifest.name} v${manifest.version}`);
    
    return { success: true };
  }
  
  /**
   * Activate a plugin
   */
  async activate(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin "${pluginId}" not found`);
    
    plugin.status = 'active';
    
    if (plugin.hooks.onActivate) {
      await plugin.hooks.onActivate(plugin.context);
    }
    
    // Register all hooks
    for (const [hookName, hookFn] of Object.entries(plugin.hooks)) {
      if (hookName.startsWith('on') && typeof hookFn === 'function') {
        if (!this.hooks.has(hookName)) {
          this.hooks.set(hookName, []);
        }
        this.hooks.get(hookName)!.push(plugin.hooks);
      }
    }
    
    console.log(`[DepthIndex SDK] Plugin activated: ${plugin.manifest.name}`);
  }
  
  /**
   * Deactivate a plugin
   */
  async deactivate(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin "${pluginId}" not found`);
    
    plugin.status = 'inactive';
    
    if (plugin.hooks.onDeactivate) {
      await plugin.hooks.onDeactivate(plugin.context);
    }
    
    // Remove hooks
    for (const [hookName, hooks] of this.hooks) {
      this.hooks.set(hookName, hooks.filter(h => h !== plugin.hooks));
    }
    
    console.log(`[DepthIndex SDK] Plugin deactivated: ${plugin.manifest.name}`);
  }
  
  /**
   * Execute hooks for a lifecycle event
   */
  async executeHook(hookName: string, ...args: any[]): Promise<any[]> {
    const hooks = this.hooks.get(hookName) || [];
    const results: any[] = [];
    
    for (const hookSet of hooks) {
      const hookFn = (hookSet as any)[hookName];
      if (typeof hookFn === 'function') {
        try {
          const result = await hookFn(...args);
          results.push(result);
        } catch (error) {
          console.error(`[DepthIndex SDK] Hook "${hookName}" failed:`, error);
        }
      }
    }
    
    return results;
  }

  getActivePlugins(): RegisteredPlugin[] {
    return Array.from(this.plugins.values());
  }
  
  /**
   * Validate plugin manifest
   */
  private validateManifest(manifest: PluginManifest): { valid: boolean; error?: string } {
    if (!manifest.id || !/^[a-z0-9_-]+$/i.test(manifest.id)) {
      return { valid: false, error: 'Invalid plugin ID. Use alphanumeric, hyphens, and underscores.' };
    }
    
    if (!manifest.name || manifest.name.length < 3) {
      return { valid: false, error: 'Plugin name must be at least 3 characters.' };
    }
    
    if (!manifest.version || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
      return { valid: false, error: 'Invalid version. Use semantic versioning (x.y.z).' };
    }
    
    if (!manifest.dataDisclosure) {
      return { valid: false, error: 'Data disclosure is required for all plugins.' };
    }
    
    if (!manifest.compliance) {
      return { valid: false, error: 'Compliance statement is required for all plugins.' };
    }
    
    return { valid: true };
  }
  
  /**
   * Create sandboxed plugin context
   */
  private createPluginContext(manifest: PluginManifest): PluginContext {
    return {
      manifest,
      depthIndexVersion: '1.1.9',
      siteContext: this.siteContextEngine.detectSiteProfile(),
      storage: this.createSandboxedStorage(manifest.id),
      logger: this.createPluginLogger(manifest.id),
      ui: this.createUIExtensions(manifest),
      i18n: this.createI18nAPI(manifest),
    };
  }
  
  private createSandboxedStorage(pluginId: string): SandboxedStorage {
    const prefix = `depthindex_plugin_${pluginId}_`;
    
    return {
      async get<T>(key: string): Promise<T | null> {
        if (typeof window === 'undefined') return null;
        const raw = localStorage.getItem(prefix + key);
        return raw ? JSON.parse(raw) : null;
      },
      async set<T>(key: string, value: T): Promise<void> {
        if (typeof window === 'undefined') return;
        localStorage.setItem(prefix + key, JSON.stringify(value));
      },
      async remove(key: string): Promise<void> {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(prefix + key);
      },
      async clear(): Promise<void> {
        if (typeof window === 'undefined') return;
        const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
        keys.forEach(k => localStorage.removeItem(k));
      },
      async getUsage(): Promise<number> {
        if (typeof window === 'undefined') return 0;
        const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
        return keys.reduce((total, key) => total + (localStorage.getItem(key)?.length || 0) * 2, 0);
      },
    };
  }
  
  private createPluginLogger(pluginId: string): PluginLogger {
    const prefix = `[DepthIndex:${pluginId}]`;
    return {
      debug: (msg, ...args) => console.debug(prefix, msg, ...args),
      info: (msg, ...args) => console.info(prefix, msg, ...args),
      warn: (msg, ...args) => console.warn(prefix, msg, ...args),
      error: (msg, ...args) => console.error(prefix, msg, ...args),
    };
  }
  
  private createUIExtensions(manifest: PluginManifest): UIExtensionPoints {
    return {
      addHeaderButton: (button) => {
        console.log(`[DepthIndex SDK] Button added to header by ${manifest.id}: ${button.label}`);
      },
      addBeforeMessages: (element) => {
        console.log(`[DepthIndex SDK] BeforeMessages UI element added by ${manifest.id}`);
      },
      addAfterMessages: (element) => {
        console.log(`[DepthIndex SDK] AfterMessages UI element added by ${manifest.id}`);
      },
      addFooterContent: (element) => {
        console.log(`[DepthIndex SDK] FooterContent UI element added by ${manifest.id}`);
      },
      registerRenderer: (contentType, renderer) => {
        console.log(`[DepthIndex SDK] Custom content renderer registered by ${manifest.id} for type: ${contentType}`);
      },
    };
  }
  
  private createI18nAPI(manifest: PluginManifest): I18nAPI {
    return new I18nAPI();
  }
}

export { PrivacyFirewall } from '../privacy/firewall.js';
export { TranslationEngine } from '../i18n/engine.js';
