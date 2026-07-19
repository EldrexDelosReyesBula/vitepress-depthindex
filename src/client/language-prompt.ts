import { TranslationEngine } from '../i18n/engine.js';

export class LanguagePromptInjector {
  private translationEngine: TranslationEngine;
  
  constructor(translationEngine: TranslationEngine) {
    this.translationEngine = translationEngine;
  }
  
  /**
   * Inject language instruction into cloud AI prompt.
   * ONLY for hybrid and cloud modes.
   * Local mode = panel text only, answers stay in doc language.
   */
  injectLanguageInstruction(basePrompt: string, mode: 'local' | 'hybrid' | 'cloud'): string {
    // Local mode: No language injection for answers
    if (mode === 'local') return basePrompt;
    
    const currentLang = this.translationEngine.getCurrentLanguage();
    
    // If user language matches doc language, no injection needed
    if (currentLang === 'en') return basePrompt;
    
    const pack = this.translationEngine.getCurrentPack();
    const languageName = pack?.meta?.nativeName || currentLang;
    
    // Inject language instruction
    const languageInstruction = `
IMPORTANT LANGUAGE INSTRUCTION:
- The user's preferred language is: ${languageName} (${currentLang})
- You MUST respond entirely in ${languageName}
- Translate all technical terms appropriately
- Keep code blocks in their original language
- Keep URLs and file paths unchanged
- If you cannot translate accurately, respond in English and explain why
`;

    return languageInstruction + '\n' + basePrompt;
  }
  
  /**
   * Generate the "respond in X language" part for the system prompt
   */
  getSystemPromptLanguageInstruction(): string {
    const currentLang = this.translationEngine.getCurrentLanguage();
    if (currentLang === 'en') return '';
    
    const pack = this.translationEngine.getCurrentPack();
    const languageName = pack?.meta?.nativeName || currentLang;
    
    return `You are responding to a user who prefers ${languageName}. Always respond in ${languageName} unless the user asks for English specifically.`;
  }
}
