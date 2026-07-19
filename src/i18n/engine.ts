import enPack from './translations/en.json' with { type: 'json' };
import tlPack from './translations/tl.json' with { type: 'json' };

export interface TranslationPack {
  meta: {
    code: string;
    nativeName: string;
    englishName: string;
    direction: 'ltr' | 'rtl';
    contributors: string[];
    lastUpdated: string;
    completion: number; // 0-100 percentage
  };
  translations?: Record<string, any>;
  [key: string]: any; // Allow root-level translation blocks
}

export interface LanguageOption {
  code: string;
  nativeName: string;
  englishName: string;
  direction: 'ltr' | 'rtl';
  completion: number;
  isBuiltIn: boolean;
}

export class TranslationEngine {
  private packs: Map<string, TranslationPack> = new Map();
  private currentLanguage: string = 'en';
  private fallbackLanguage: string = 'en';
  
  // Built-in languages (shipped with package)
  private readonly BUILT_IN = ['en', 'tl'];
  
  constructor() {
    // Register built-in languages
    this.registerPack('en', enPack as any);
    this.registerPack('tl', tlPack as any);
    
    this.loadPersistedLanguage();
  }
  
  private loadPersistedLanguage(): void {
    if (typeof window !== 'undefined') {
      const persisted = localStorage.getItem('depthindex-language');
      if (persisted && this.packs.has(persisted)) {
        this.currentLanguage = persisted;
      }
    }
  }
  
  /**
   * Register a translation pack (for community contributions)
   */
  registerPack(code: string, pack: TranslationPack): void {
    // Validate required keys
    const required = ['panel.title', 'panel.send', 'panel.close', 'search.noResults'];
    const translationsSource = pack.translations || pack;
    const missing = required.filter(key => !this.getNestedValue(translationsSource, this.normalizeKey(key)));
    
    if (missing.length > 0) {
      console.warn(`[DepthIndex i18n] Translation "${code}" missing keys:`, missing);
    }
    
    this.packs.set(code, pack);
    console.log(`[DepthIndex i18n] Registered: ${pack.meta.englishName} (${code}) — ${pack.meta.completion}% complete`);
  }
  
  /**
   * Register a community translation from a URL
   */
  async registerFromURL(code: string, url: string): Promise<void> {
    try {
      const response = await fetch(url);
      const pack = await response.json();
      this.registerPack(code, pack);
    } catch (error) {
      console.error(`[DepthIndex i18n] Failed to load translation from ${url}:`, error);
    }
  }
  
  /**
   * Set current language
   */
  setLanguage(code: string): void {
    if (this.packs.has(code)) {
      this.currentLanguage = code;
      if (typeof window !== 'undefined') {
        localStorage.setItem('depthindex-language', code);
        
        const pack = this.packs.get(code)!;
        if (document.documentElement) {
          document.documentElement.dir = pack.meta.direction;
          document.documentElement.lang = code;
        }
        
        window.dispatchEvent(new CustomEvent('depthindex:language-changed', {
          detail: { code, pack },
        }));
      }
    }
  }
  
  /**
   * Get translation string
   */
  t(key: string, params?: Record<string, string | number>): string {
    const normalizedKey = this.normalizeKey(key);
    const pack = this.packs.get(this.currentLanguage);
    let text = this.getNestedValue(pack?.translations || pack, normalizedKey);
    
    // Fallback to English
    if (!text && this.currentLanguage !== this.fallbackLanguage) {
      const fallbackPack = this.packs.get(this.fallbackLanguage);
      text = this.getNestedValue(fallbackPack?.translations || fallbackPack, normalizedKey);
    }
    
    // Return key if no translation found
    if (!text) {
      return key.split('.').pop() || key;
    }
    
    // Replace parameters
    if (params) {
      for (const [param, value] of Object.entries(params)) {
        text = text.replace(`{${param}}`, String(value));
      }
    }
    
    return text;
  }
  
  /**
   * Get available languages for settings panel
   */
  getAvailableLanguages(): LanguageOption[] {
    return Array.from(this.packs.entries()).map(([code, pack]) => ({
      code,
      nativeName: pack.meta.nativeName,
      englishName: pack.meta.englishName,
      direction: pack.meta.direction,
      completion: pack.meta.completion,
      isBuiltIn: this.BUILT_IN.includes(code),
    }));
  }
  
  /**
   * Get current language
   */
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }
  
  /**
   * Get current pack
   */
  getCurrentPack(): TranslationPack | undefined {
    return this.packs.get(this.currentLanguage);
  }
  
  private normalizeKey(key: string): string {
    const directMaps: Record<string, string> = {
      'panel.recentChats': 'panel.history',
      'panel.noHistory': 'panel.history',
      'action.summarize': 'context.summarize',
      'action.discuss': 'context.discuss',
      'action.save': 'settings.saveConfiguration',
      'action.cancel': 'panel.close',
      'feedback.copy': 'actions.copy',
      'settings.mode.local.name': 'settings.modes.local',
      'settings.mode.local.desc': 'settings.modes.localDescription',
      'settings.mode.hybrid.name': 'settings.modes.hybrid',
      'settings.mode.hybrid.desc': 'settings.modes.hybridDescription',
      'settings.mode.cloud.name': 'settings.modes.cloud',
      'settings.mode.cloud.desc': 'settings.modes.cloudDescription',
      'settings.apiKeyHint': 'settings.apiKeyPlaceholder',
      'settings.apiKeyInvalid': 'errors.invalidKey',
      'settings.apiKeyGet': 'settings.apiKeyPlaceholder',
      'settings.modelName': 'settings.model',
      'settings.modelOptional': 'settings.model',
      'settings.presets': 'settings.model',
      'settings.save': 'settings.saveConfiguration',
      'settings.reset': 'settings.resetDefaults',
      'settings.clearHistory': 'settings.clearHistory',
      'settings.cloudConfig': 'settings.cloudConfig',
      'settings.language': 'settings.language',
      'settings.theme': 'settings.languageDescription'
    };

    if (directMaps[key]) return directMaps[key];

    let normalized = key;
    if (normalized.startsWith('action.')) {
      normalized = normalized.replace('action.', 'actions.');
    } else if (normalized.startsWith('citation.')) {
      normalized = normalized.replace('citation.', 'citations.');
    } else if (normalized.startsWith('feedback.')) {
      normalized = normalized.replace('feedback.', 'actions.');
    } else if (normalized.startsWith('error.')) {
      normalized = normalized.replace('error.', 'errors.');
    } else if (normalized.startsWith('answer.source.local')) {
      normalized = 'answer.sourceLocal';
    } else if (normalized.startsWith('answer.source.cloud')) {
      normalized = 'answer.sourceCloud';
    } else if (normalized.startsWith('answer.source.hybrid')) {
      normalized = 'answer.sourceHybrid';
    }
    return normalized;
  }
  
  private getNestedValue(obj: any, path: string): string | undefined {
    if (obj && typeof obj[path] === 'string') {
      return obj[path];
    }
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
      if (current === undefined || current === null) return undefined;
      current = current[key];
    }
    return typeof current === 'string' ? current : undefined;
  }
}
