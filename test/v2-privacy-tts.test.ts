import { describe, it, expect, vi } from 'vitest';
import { QueryGuard } from '../src/privacy/query-guard.js';
import { PrivacyAnalytics } from '../src/analytics/privacy-analytics.js';
import TTSExtension from '../src/extensions/tts/index.js';

describe('QueryGuard Encryption & Sanitization', () => {
  it('should sanitize PII and credentials', () => {
    const guard = new QueryGuard();
    
    // Credit Card (Luhn valid)
    const card = '4111 1111 1111 1111';
    const resCard = guard.sanitizeQuery(`My card is ${card}`);
    expect(resCard.wasSanitized).toBe(true);
    expect(resCard.sanitized).toContain('[CARD REDACTED]');
    
    // API key
    const resKey = guard.sanitizeQuery('key = sk-123456789012345678901234');
    expect(resKey.wasSanitized).toBe(true);
    expect(resKey.sanitized).toContain('[API KEY REDACTED]');
    
    // Email
    const resEmail = guard.sanitizeQuery('contact me at test@example.com');
    expect(resEmail.wasSanitized).toBe(true);
    expect(resEmail.sanitized).toContain('[EMAIL REDACTED]');
  });
  
  it('should classify queries correctly', () => {
    const guard = new QueryGuard();
    
    // Doc related
    const c1 = guard.classify('How do I install the plugin?');
    expect(c1.isDocRelated).toBe(true);
    expect(c1.isConversational).toBe(false);
    expect(c1.isOffTopic).toBe(false);
    
    // Conversational & Off-topic
    const c2 = guard.classify('Hi, tell me a joke.');
    expect(c2.isConversational).toBe(true);
    expect(c2.isOffTopic).toBe(true);
    expect(c2.requiresConsent).toBe(true);
  });
  
  it('should encrypt and decrypt queries correctly', async () => {
    // Stub localStorage
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] || null,
      setItem: (k: string, v: string) => { store[k] = v; },
    });
    
    const guard = new QueryGuard();
    const query = 'sensitive configuration details';
    
    const encResult = await guard.encryptForStorage(query);
    expect(encResult).not.toBeNull();
    expect(encResult!.encrypted).toBeInstanceOf(ArrayBuffer);
    expect(encResult!.iv).toBeInstanceOf(Uint8Array);
    
    const decResult = await guard.decryptFromStorage(encResult!.encrypted, encResult!.iv);
    expect(decResult).toBe(query);
    
    vi.unstubAllGlobals();
  });
});

describe('PrivacyAnalytics Tracker', () => {
  it('should sanitize, classify, and track standard queries without consent popup', async () => {
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] || null,
      setItem: (k: string, v: string) => { store[k] = v; },
    });

    const mockEngine = {
      trackSearch: vi.fn(),
    };
    
    const privAnalytics = new PrivacyAnalytics(mockEngine as any);
    await privAnalytics.trackSearchQuery('How do I configure npm?', 5);
    
    expect(mockEngine.trackSearch).toHaveBeenCalledWith('How do I configure npm?', 5, expect.any(Number));
    vi.unstubAllGlobals();
  });

  it('should request consent for off-topic query and skip tracking if declined', async () => {
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store[k] || null,
      setItem: (k: string, v: string) => { store[k] = v; },
    });

    const mockWindow = {
      dispatchEvent: vi.fn().mockImplementation((event: CustomEvent) => {
        // Automatically trigger decline
        event.detail.onDecline();
      }),
    };
    vi.stubGlobal('window', mockWindow);

    const mockEngine = {
      trackSearch: vi.fn(),
    };

    const privAnalytics = new PrivacyAnalytics(mockEngine as any);
    await privAnalytics.trackSearchQuery('tell me a story', 0);

    expect(mockWindow.dispatchEvent).toHaveBeenCalled();
    expect(mockEngine.trackSearch).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe('TTSExtension Plugin', () => {
  it('should initialize and define manifest compliant statements', () => {
    const plugin = TTSExtension({ provider: 'browser' });
    expect(plugin.manifest.id).toBe('text-to-speech');
    expect(plugin.manifest.compliance.gdpr).toBe(true);
    expect(plugin.manifest.dataDisclosure.collectsData).toBe(false);
  });

  it('should hook onAfterRender and append di-tts-play button', async () => {
    const plugin = TTSExtension({ provider: 'browser' });
    
    const container = {
      querySelectorAll: vi.fn().mockReturnValue([
        {
          querySelector: vi.fn().mockReturnValue(null),
          appendChild: vi.fn(),
        }
      ]),
    };

    const mockContext = {
      logger: { info: vi.fn() },
      i18n: { getCurrentLanguage: () => 'en' },
    };

    const mockDocument = {
      createElement: (tag: string) => {
        return {
          className: '',
          innerHTML: '',
          title: '',
          addEventListener: vi.fn(),
        };
      }
    };
    vi.stubGlobal('document', mockDocument);

    await plugin.hooks.onAfterRender?.(container as any, mockContext as any);
    
    expect(container.querySelectorAll).toHaveBeenCalledWith('.di-msg--assistant, .message-wrapper.assistant');
    expect(mockContext.logger.info).toHaveBeenCalledWith('TTS play buttons added');
    vi.unstubAllGlobals();
  });
});
