export type SupportedLanguage = 'en' | 'tl' | string;

export interface LanguagePack {
  code: string;
  nativeName: string;
  englishName: string;
  direction: 'ltr' | 'rtl';
  translations: Record<string, string>;
  pluralRules?: (count: number) => string;
  author: {
    name: string;
    email?: string;
  };
}

export class I18nAPI {
  private currentLanguage: string = 'en';
  private packs: Map<string, LanguagePack> = new Map();
  private fallbackLanguage: string = 'en';
  
  constructor() {
    this.registerBuiltInLanguages();
    this.loadPersistedLanguage();
  }
  
  /**
   * Register built-in languages (English and Tagalog)
   */
  private registerBuiltInLanguages(): void {
    // English pack
    this.registerPack({
      code: 'en',
      nativeName: 'English',
      englishName: 'English',
      direction: 'ltr',
      author: { name: 'DepthIndex Core' },
      translations: {
        // Panel
        'panel.title': 'Documentation Assistant',
        'panel.subtitle': 'Ask me anything about these docs',
        'panel.placeholder': 'Ask a question...',
        'panel.send': 'Send',
        'panel.close': 'Close',
        'panel.newChat': 'New chat',
        'panel.expand': 'Expand',
        'panel.settings': 'Settings',
        'panel.history': 'Chat history',
        'panel.recentChats': 'Recent Chats',
        'panel.noHistory': 'No recent chats',
        'panel.poweredBy': 'Powered by DepthIndex',
        
        // Context
        'context.detected': 'I understand this is about',
        'context.type.library': 'Library',
        'context.type.framework': 'Framework',
        'context.type.tool': 'Tool',
        'context.type.api': 'API',
        'context.type.guide': 'Guide',
        'context.type.product': 'Product',
        
        // Suggestions
        'suggestions.howToInstall': 'How do I install this?',
        'suggestions.getStarted': 'How do I get started?',
        'suggestions.features': 'What are the main features?',
        'suggestions.configuration': 'Show me configuration options',
        'suggestions.examples': 'Show me examples',
        'suggestions.summarize': 'Summarize this page',
        
        // Search
        'search.thinking': 'Thinking...',
        'search.searching': 'Searching documentation...',
        'search.analyzing': 'Analyzing results...',
        'search.generating': 'Generating response...',
        'search.found': 'Found {count} relevant sections',
        'search.noResults': 'No results found for "{query}"',
        'search.tryAgain': 'Try rephrasing your question',
        
        // Answers
        'answer.confidence': 'Confidence: {percent}%',
        'answer.references': 'References',
        'answer.relatedTopics': 'Related Topics',
        'answer.source.local': 'On-Device',
        'answer.source.cloud': 'Cloud AI',
        'answer.error': 'An error occurred. Please try again.',
        
        // Citations
        'citation.viewSource': 'View source',
        'citation.backToText': 'Back to text',
        
        // Actions
        'action.copy': 'Copy',
        'action.copied': 'Copied!',
        'action.helpful': 'Helpful',
        'action.notHelpful': 'Not helpful',
        'action.report': 'Report',
        'action.dismiss': 'Dismiss',
        'action.save': 'Save',
        'action.cancel': 'Cancel',
        'action.edit': 'Edit',
        'action.summarize': 'Summarize',
        'action.discuss': 'Discuss',
        'action.resend': 'Resend',
        'action.delete': 'Delete',
        
        // Feedback / Tooltips
        'feedback.helpful': 'Helpful',
        'feedback.notHelpful': 'Not helpful',
        'feedback.copy': 'Copy response',
        'panel.viewing': 'Viewing',
        'error.confirmReport': 'Do you want to report this error and open the issue submission page?',
        
        // Settings
        'settings.title': 'Configure Cloud LLM',
        'settings.subtitle': 'Optional enhancement for smarter answers',
        'settings.info': 'Enable hybrid cloud mode to answer questions using GPT-4, Gemini, or Claude using your own API key. Keys are saved in your local browser storage only.',
        'settings.searchMode': 'Search Mode',
        'settings.mode.local.name': 'On-Device Only',
        'settings.mode.local.desc': '100% local, works offline, instant results',
        'settings.mode.hybrid.name': 'Hybrid',
        'settings.mode.hybrid.desc': 'Local search + Cloud AI reasoning for better answers',
        'settings.mode.cloud.name': 'Cloud-Only',
        'settings.mode.cloud.desc': 'Full cloud AI answers (requires API key)',
        'settings.provider': 'API Provider',
        'settings.apiKey': 'API Key',
        'settings.apiKeyHint': 'Stored locally, never sent to our servers',
        'settings.apiKeyInvalid': 'Invalid {provider} API key format. Please check your key.',
        'settings.apiKeyGet': 'Get an API key',
        'settings.modelName': 'Model Name',
        'settings.modelOptional': 'Optional',
        'settings.presets': 'Presets:',
        'settings.testConnection': 'Test Connection',
        'settings.testing': 'Testing...',
        'settings.testSuccess': 'Connection successful!',
        'settings.testFailed': 'Connection failed.',
        'settings.reset': 'Reset',
        'settings.save': 'Save',
        'settings.storageIndicator': 'Stored encrypted in browser',
        'settings.clearHistory': 'Clear History',
        'settings.cloudConfig': 'Cloud AI Configuration',
        'settings.language': 'Language',
        'settings.theme': 'Theme',
        
        // Compliance
        'compliance.noTracking': 'No tracking',
        'compliance.noPII': 'No PII collected',
        'compliance.localFirst': 'On-device first',
        'compliance.privacyNotice': 'Privacy Notice',
      },
    });
    
    // Tagalog pack
    this.registerPack({
      code: 'tl',
      nativeName: 'Tagalog',
      englishName: 'Tagalog (Filipino)',
      direction: 'ltr',
      author: { name: 'DepthIndex Core' },
      translations: {
        // Panel
        'panel.title': 'Katulong sa Dokumentasyon',
        'panel.subtitle': 'Magtanong tungkol sa mga dokumentong ito',
        'panel.placeholder': 'Magtanong...',
        'panel.send': 'Ipadala',
        'panel.close': 'Isara',
        'panel.newChat': 'Bagong usapan',
        'panel.expand': 'Palakihin',
        'panel.settings': 'Mga Setting',
        'panel.history': 'Kasaysayan ng chat',
        'panel.recentChats': 'Mga Nakaraang Usapan',
        'panel.noHistory': 'Walang nakaraang usapan',
        'panel.poweredBy': 'Pinapagana ng DepthIndex',
        
        // Context
        'context.detected': 'Naiintindihan ko na ito ay tungkol sa',
        'context.type.library': 'Aklatan',
        'context.type.framework': 'Balangkas',
        'context.type.tool': 'Kasangkapan',
        'context.type.api': 'API',
        'context.type.guide': 'Gabay',
        'context.type.product': 'Produkto',
        
        // Suggestions
        'suggestions.howToInstall': 'Paano i-install ito?',
        'suggestions.getStarted': 'Paano magsimula?',
        'suggestions.features': 'Ano ang mga pangunahing tampok?',
        'suggestions.configuration': 'Ipakita ang mga opsyon sa pagsasaayos',
        'suggestions.examples': 'Magpakita ng mga halimbawa',
        'suggestions.summarize': 'Ibuod ang pahinang ito',
        
        // Search
        'search.thinking': 'Nag-iisip...',
        'search.searching': 'Naghahanap sa dokumentasyon...',
        'search.analyzing': 'Sinusuri ang mga resulta...',
        'search.generating': 'Gumagawa ng tugon...',
        'search.found': 'Nakahanap ng {count} kaugnay na seksyon',
        'search.noResults': 'Walang nakitang resulta para sa "{query}"',
        'search.tryAgain': 'Subukang baguhin ang iyong tanong',
        
        // Answers
        'answer.confidence': 'Katiyakan: {percent}%',
        'answer.references': 'Mga Sanggunian',
        'answer.relatedTopics': 'Kaugnay na Mga Paksa',
        'answer.source.local': 'Sa Device',
        'answer.source.cloud': 'Cloud AI',
        'answer.error': 'May naganap na error. Pakisubukang muli.',
        
        // Citations
        'citation.viewSource': 'Tingnan ang pinagmulan',
        'citation.backToText': 'Bumalik sa teksto',
        
        // Actions
        'action.copy': 'Kopyahin',
        'action.copied': 'Na-kopya!',
        'action.helpful': 'Makatulong',
        'action.notHelpful': 'Hindi makatulong',
        'action.report': 'I-ulat',
        'action.dismiss': 'I-dismiss',
        'action.save': 'I-save',
        'action.cancel': 'Kanselahin',
        'action.edit': 'I-edit',
        'action.summarize': 'Ibuod',
        'action.discuss': 'Talakayin',
        'action.resend': 'I-padala muli',
        'action.delete': 'I-delete',
        
        // Feedback / Tooltips
        'feedback.helpful': 'Makatulong',
        'feedback.notHelpful': 'Hindi makatulong',
        'feedback.copy': 'Kopyahin ang sagot',
        'panel.viewing': 'Kasalukuyang binabasa',
        'error.confirmReport': 'Nais mo bang i-ulat ang error na ito at buksan ang pahina para sa pag-submit ng isyu?',
        
        // Settings
        'settings.title': 'Isaayos ang Cloud LLM',
        'settings.subtitle': 'Opsyonal na pagpapahusay para sa mas matalinong sagot',
        'settings.info': 'Paganahin ang hybrid cloud mode upang sagutin ang mga tanong gamit ang GPT-4, Gemini, o Claude gamit ang iyong sariling API key. Ang mga key ay nai-save sa iyong lokal na browser storage lamang.',
        'settings.searchMode': 'Paraan ng Paghahanap',
        'settings.mode.local.name': 'Sa Device Lamang',
        'settings.mode.local.desc': '100% lokal, gumagana offline, agarang mga resulta',
        'settings.mode.hybrid.name': 'Hybrid',
        'settings.mode.hybrid.desc': 'Lokal na paghahanap + Cloud AI para sa mas magandang sagot',
        'settings.mode.cloud.name': 'Cloud-Lamang',
        'settings.mode.cloud.desc': 'Buong sagot ng cloud AI (nangangailangan ng API key)',
        'settings.provider': 'Tagabigay ng API',
        'settings.apiKey': 'API Key',
        'settings.apiKeyHint': 'Naka-store nang lokal, hindi kailanman ipinapadala sa aming mga server',
        'settings.apiKeyInvalid': 'Maling format ng {provider} API key. Pakisuri ang iyong key.',
        'settings.apiKeyGet': 'Kumuha ng API key',
        'settings.modelName': 'Pangalan ng Modelo',
        'settings.modelOptional': 'Opsyonal',
        'settings.presets': 'Mga Preset:',
        'settings.testConnection': 'Subukan ang Koneksyon',
        'settings.testing': 'Sumusubok...',
        'settings.testSuccess': 'Matagumpay ang koneksyon!',
        'settings.testFailed': 'Bigo ang koneksyon.',
        'settings.reset': 'I-reset',
        'settings.save': 'I-save',
        'settings.storageIndicator': 'Naka-store nang encrypted sa browser',
        'settings.clearHistory': 'Burahin ang Kasaysayan',
        'settings.cloudConfig': 'Pagsasaayos ng Cloud AI',
        'settings.language': 'Wika',
        'settings.theme': 'Tema',
        
        // Compliance
        'compliance.noTracking': 'Walang pagsubaybay',
        'compliance.noPII': 'Walang kinokolektang PII',
        'compliance.localFirst': 'Sa device muna',
        'compliance.privacyNotice': 'Paunawa sa Privacy',
      },
    });
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
   * Register a new language pack
   */
  registerPack(pack: LanguagePack): void {
    const required = [
      'panel.title', 'panel.send', 'panel.close',
      'search.thinking', 'search.noResults',
      'answer.references',
    ];
    
    const missing = required.filter(key => !pack.translations[key]);
    if (missing.length > 0) {
      throw new Error(`Language pack "${pack.code}" missing required translations: ${missing.join(', ')}`);
    }
    
    this.packs.set(pack.code, pack);
    console.log(`[DepthIndex i18n] Registered language: ${pack.englishName} (${pack.code})`);
  }
  
  /**
   * Set current language
   */
  setLanguage(code: string): void {
    if (!this.packs.has(code)) {
      console.warn(`[DepthIndex i18n] Language "${code}" not found, falling back to ${this.fallbackLanguage}`);
      code = this.fallbackLanguage;
    }
    
    this.currentLanguage = code;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('depthindex-language', code);
      
      const pack = this.packs.get(code)!;
      if (document.documentElement) {
        document.documentElement.dir = pack.direction;
        document.documentElement.lang = code;
      }
      
      window.dispatchEvent(new CustomEvent('depthindex:language-changed', { detail: { code } }));
    }
  }
  
  /**
   * Get translation
   */
  t(key: string, params?: Record<string, string | number>): string {
    const pack = this.packs.get(this.currentLanguage);
    let text = pack?.translations[key];
    
    // Fallback to English
    if (!text && this.currentLanguage !== this.fallbackLanguage) {
      const fallbackPack = this.packs.get(this.fallbackLanguage);
      text = fallbackPack?.translations[key];
    }
    
    // Fallback to key itself
    if (!text) return key;
    
    // Replace parameters
    if (params) {
      for (const [param, value] of Object.entries(params)) {
        text = text.replace(`{${param}}`, String(value));
      }
    }
    
    return text;
  }
  
  /**
   * Get available languages
   */
  getAvailableLanguages(): Array<{ code: string; nativeName: string; englishName: string }> {
    return Array.from(this.packs.values()).map(pack => ({
      code: pack.code,
      nativeName: pack.nativeName,
      englishName: pack.englishName,
    }));
  }
  
  /**
   * Get current language
   */
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }
}
