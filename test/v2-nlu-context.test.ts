import { describe, it, expect, vi } from 'vitest';
import { SiteContextEngine } from '../src/client/site-context.js';
import { IntentEngine } from '../src/client/intent-engine.js';

describe('DepthIndex 1.1.0 Site Context & NLU Intent Classification', () => {

  it('SiteContextEngine: auto-detection fallbacks and greetings', () => {
    // Stub document to simulate DOM
    const mockH1 = { textContent: 'VitePress Plugin DepthIndex' };
    const mockMeta = { getAttribute: (attr: string) => attr === 'content' ? 'Amazing offline AI search' : null };
    
    vi.stubGlobal('document', {
      querySelector: (selector: string) => {
        if (selector.includes('h1')) return mockH1;
        if (selector.includes('meta')) return mockMeta;
        return null;
      },
      querySelectorAll: () => []
    });

    const engine = new SiteContextEngine();
    const profile = engine.detectSiteProfile();
    
    expect(profile.name).toBe('Vite Press Plugin Depth Index');
    expect(profile.description).toBe('Amazing offline AI search');
    expect(profile.type).toBe('library'); // should match install patterns

    const greeting = engine.generateGreeting();
    expect(
      greeting.includes('Vite Press Plugin Depth Index')
    ).toBe(true);

    vi.unstubAllGlobals();
  });

  it('IntentEngine: intent classification, entity extraction, and follow-ups', () => {
    const engine = new IntentEngine();

    // How-to intent
    const intentHowTo = engine.detectIntent('How do I configure this plugin in vitepress?');
    expect(intentHowTo.primary).toBe('configure');
    expect(intentHowTo.context.requiresConfig).toBe(true);
    expect(intentHowTo.entities.technology).toBe('vitepress');

    // Code intent
    const intentCode = engine.detectIntent('Show me a Javascript code example for installing it');
    expect(intentCode.primary).toBe('example');
    expect(intentCode.context.requiresCode).toBe(true);
    expect(intentCode.entities.technology).toBe('javascript');

    // Follow-up check
    const followUp = engine.detectIntent('and show me how to test it', [
      { role: 'user', content: 'What is this plugin?' },
      { role: 'assistant', content: 'It is an AI search plugin.' }
    ]);
    expect(followUp.context.isFollowUp).toBe(true);
  });

});
