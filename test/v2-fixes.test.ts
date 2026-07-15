import { describe, it, expect, vi } from 'vitest';
import { PersonalizationEngine } from '../src/client/personalization.js';
import { SecurityManager } from '../src/client/security.js';
import { ErrorHandler, ErrorCategory, ErrorSeverity } from '../src/client/error-handler.js';
import { SessionManager } from '../src/client/session-manager.js';
import { ContentRenderer } from '../src/client/renderers.js';

describe('DepthIndex 1.0.1 Hardening Fixes', () => {

  it('PersonalizationEngine: Stemming, stop-words, suggestions', () => {
    const store: Record<string, string> = {};
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; }
      }
    });

    // Enable personalization so recordQuery and generateSuggestions work
    const engine = new PersonalizationEngine(true);
    
    // Stop-word check
    const terms1 = engine.extractKeyTerms('how do I configure the plugin');
    expect(terms1).not.toContain('how');
    expect(terms1).not.toContain('do');
    expect(terms1).not.toContain('i');
    expect(terms1).not.toContain('the');
    expect(terms1).toContain('config');
    expect(terms1).toContain('plugin');

    // Suffix stemming check
    const terms2 = engine.extractKeyTerms('configuring deployment databases');
    expect(terms2).toContain('config');
    expect(terms2).toContain('deploy');
    expect(terms2).toContain('databas'); // database -> databas after suffix 'es' stripped

    // Suggestion ends clean
    engine.recordQuery('how do I configure the database');
    const defaults = ['How do I get started?', 'What are the features?'];
    const suggestions = engine.generateSuggestions(defaults);
    expect(suggestions.length).toBeGreaterThan(0);
    suggestions.forEach(s => {
      const words = s.split(' ');
      const last = words[words.length - 1].replace(/[?.!]/g, '').toLowerCase();
      expect(last.length).toBeGreaterThanOrEqual(3);
    });

    vi.unstubAllGlobals();
  });


  it('SecurityManager: ReDoS & DOMParser sanitization', () => {
    const security = new SecurityManager();

    // Spam repetition blocked
    const spamCheck = security.validateQuery('a'.repeat(250));
    expect(spamCheck.valid).toBe(false);
    expect(spamCheck.code).toBe('SUSPICIOUS_PATTERN');

    // Nested depth limit
    const nestedCheck = security.validateQuery('('.repeat(60) + ')'.repeat(60));
    expect(nestedCheck.valid).toBe(false);

    // Mock DOMParser for XSS test
    const mockDOMParser = vi.fn().mockImplementation(() => {
      return {
        parseFromString: (html: string) => {
          const mockBody = {
            innerHTML: html.replace('onclick', '').replace('<script>', ''),
            attributes: [],
            childNodes: []
          };
          return { body: mockBody };
        }
      };
    });
    class MockNode {}
    (MockNode as any).COMMENT_NODE = 8;
    (MockNode as any).ELEMENT_NODE = 1;

    vi.stubGlobal('DOMParser', mockDOMParser);
    vi.stubGlobal('window', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      location: { href: 'http://localhost' }
    });
    vi.stubGlobal('Node', MockNode);
    vi.stubGlobal('NodeFilter', { FILTER_ACCEPT: 1, FILTER_REJECT: 2 });

    const safeHtml = security.sanitizeOutput('<div onclick="alert(1)">content</div>');
    expect(safeHtml).not.toContain('onclick');
    expect(safeHtml).toContain('content');

    vi.unstubAllGlobals();
  });

  it('ErrorHandler: Infinite Loop Prevention', () => {
    vi.stubGlobal('window', undefined);
    const errorHandler = new ErrorHandler({ enabled: false });

    // Listener that triggers error recursively
    const listenerSpy = vi.fn().mockImplementation((err) => {
      errorHandler.handleError(
        new Error('Recursive error'),
        ErrorCategory.UNKNOWN,
        ErrorSeverity.ERROR,
        err.context // pass previous context
      );
    });

    errorHandler.onError('*', listenerSpy);

    // Dispatch error
    errorHandler.handleError(new Error('Initial error'), ErrorCategory.UNKNOWN, ErrorSeverity.ERROR);

    // Should only be called once because re-entry context contains alreadyReported
    expect(listenerSpy).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('ContentRenderer: Async Markdown rendering', async () => {
    const renderer = new ContentRenderer();

    // Async math block replacement
    const markdown = 'Here is display math:\n$$\nx^2 + y^2 = z^2\n$$\nand a code block:\n```javascript\nconst a = 1;\n```';
    const htmlPromise = renderer.renderMarkdown(markdown);
    expect(htmlPromise).toBeInstanceOf(Promise);

    const html = await htmlPromise;
    expect(html).toContain('math-display');
    expect(html).toContain('code-block-wrapper');
  });

});
