import { describe, it, expect, vi } from 'vitest';
import { SecurityManager } from '../src/client/security.js';
import { I18nAPI } from '../src/extensions/i18n/index.js';

describe('DepthIndex 1.1.0 UX & User Actions', () => {

  it('should validate edit inputs and reject dangerous scripts', () => {
    const security = new SecurityManager();
    
    // Normal edits should pass
    const cleanCheck = security.validateQuery('How do I configure this plugin?');
    expect(cleanCheck.valid).toBe(true);

    // Dangerous edits must be blocked
    const injectionCheck = security.validateQuery('<script>alert("hack")</script>');
    expect(injectionCheck.valid).toBe(false);
  });

  it('should test message editing simulation slice', () => {
    // Simulate chat history
    let messages = [
      { id: '1', role: 'user', content: 'hello' },
      { id: '2', role: 'assistant', content: 'hi' },
      { id: '3', role: 'user', content: 'dangerous query' },
      { id: '4', role: 'assistant', content: 'blocked' }
    ];

    // User edits message '3'
    const targetId = '3';
    const newContent = 'safe query';

    const msgIdx = messages.findIndex(m => m.id === targetId);
    expect(msgIdx).toBe(2);

    // Slice messages up to the user message
    messages = messages.slice(0, msgIdx + 1);
    messages[msgIdx].content = newContent;

    expect(messages.length).toBe(3);
    expect(messages[2].content).toBe('safe query');
    expect(messages[1].id).toBe('2'); // Prior messages preserved
  });

  it('should support multi-lingual prompt confirmation keys', () => {
    const i18n = new I18nAPI();
    
    // English confirm prompt
    expect(i18n.t('error.confirmReport')).toContain('Do you want to report this error');

    // Tagalog confirm prompt
    i18n.setLanguage('tl');
    expect(i18n.t('error.confirmReport')).toContain('Nais mo bang i-ulat ang error');
  });

});
