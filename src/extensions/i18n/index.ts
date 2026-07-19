import { TranslationEngine, TranslationPack } from '../../i18n/engine.js';

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
  private engine: TranslationEngine;
  
  constructor() {
    this.engine = new TranslationEngine();
  }
  
  registerPack(pack: LanguagePack): void {
    // Map legacy LanguagePack to TranslationPack
    const translationPack: TranslationPack = {
      meta: {
        code: pack.code,
        nativeName: pack.nativeName,
        englishName: pack.englishName,
        direction: pack.direction,
        contributors: pack.author ? [pack.author.name] : [],
        lastUpdated: new Date().toISOString().split('T')[0],
        completion: 100
      },
      translations: pack.translations
    };
    this.engine.registerPack(pack.code, translationPack);
  }
  
  setLanguage(code: string): void {
    this.engine.setLanguage(code);
  }
  
  t(key: string, params?: Record<string, string | number>): string {
    return this.engine.t(key, params);
  }
  
  getAvailableLanguages(): Array<{ code: string; nativeName: string; englishName: string }> {
    return this.engine.getAvailableLanguages().map(lang => ({
      code: lang.code,
      nativeName: lang.nativeName,
      englishName: lang.englishName
    }));
  }
  
  getCurrentLanguage(): string {
    return this.engine.getCurrentLanguage();
  }
}
