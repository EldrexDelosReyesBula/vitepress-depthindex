import { describe, it, expect, vi } from 'vitest';
import { SearchBarIntegration } from '../src/client/search-bar-integration.js';
import { DepthIndexEngine } from '../src/client/search-engine.js';

describe('DepthIndex 1.1.11 Search Bar Integration', () => {

  it('should initialize and watch queries when DOM elements exist', async () => {
    // 1. Setup mock DOM structure
    const mockInput = {
      value: '',
      placeholder: '',
      parentElement: {
        insertBefore: vi.fn(),
        appendChild: vi.fn(),
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    const mockVitePressSearch = {
      querySelector: (sel: string) => {
        if (sel === 'input') return mockInput;
        return null;
      },
      appendChild: vi.fn(),
    };

    vi.stubGlobal('document', {
      querySelector: (sel: string) => {
        if (sel === '#local-search') return mockVitePressSearch;
        return null;
      },
      createElement: (tag: string) => {
        return {
          className: '',
          innerHTML: '',
          remove: vi.fn(),
          setAttribute: vi.fn(),
          appendChild: vi.fn(),
          insertBefore: vi.fn(),
          querySelector: vi.fn().mockReturnValue(null),
        };
      },
      body: {
        appendChild: vi.fn(),
      }
    });

    // Mock MutationObserver
    const mockObserver = {
      observe: vi.fn(),
      disconnect: vi.fn(),
    };
    vi.stubGlobal('MutationObserver', vi.fn().mockImplementation(() => mockObserver));

    const engine = new DepthIndexEngine();
    const integration = new SearchBarIntegration({
      enabled: true,
      placeholder: 'Custom Ask AI placeholder',
      logo: { icon: 'fa-solid fa-brain' }
    }, engine);

    await integration.init();

    // Assert placeholder got set
    expect(mockInput.placeholder).toBe('Custom Ask AI placeholder');

    // Assert input listener got registered
    expect(mockInput.addEventListener).toHaveBeenCalledWith('input', expect.any(Function));

    // Assert DOM mutation observer is running
    expect(mockObserver.observe).toHaveBeenCalled();

    // Clean up
    integration.destroy();
    expect(mockObserver.disconnect).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('should handle answerStyle overview and transfer to panel on Enter keydown', async () => {
    const mockInput = {
      value: 'test query',
      placeholder: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      blur: vi.fn(),
    };

    const mockVitePressSearch = {
      querySelector: (sel: string) => {
        if (sel === 'input') return mockInput;
        return null;
      },
      appendChild: vi.fn(),
    };

    const mockWindow = {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      location: { pathname: '/mock-path' },
    };
    vi.stubGlobal('window', mockWindow);

    vi.stubGlobal('document', {
      querySelector: (sel: string) => {
        if (sel === '#local-search') return mockVitePressSearch;
        return null;
      },
      createElement: (tag: string) => {
        return {
          className: '',
          innerHTML: '',
          remove: vi.fn(),
          setAttribute: vi.fn(),
          appendChild: vi.fn(),
          insertBefore: vi.fn(),
          querySelector: vi.fn().mockReturnValue(null),
          addEventListener: vi.fn(),
        };
      },
      body: {
        appendChild: vi.fn(),
      }
    });

    const mockObserver = {
      observe: vi.fn(),
      disconnect: vi.fn(),
    };
    vi.stubGlobal('MutationObserver', vi.fn().mockImplementation(() => mockObserver));

    const engine = new DepthIndexEngine();
    const integration = new SearchBarIntegration({
      enabled: true,
      answerStyle: 'overview',
      maxAnswerLength: 300,
      showTransferHint: true,
    }, engine);

    await integration.init();

    // Trigger keydown Enter on input
    const keydownListener = mockInput.addEventListener.mock.calls.find(call => call[0] === 'keydown')?.[1];
    expect(keydownListener).toBeDefined();

    const mockEvent = {
      key: 'Enter',
      preventDefault: vi.fn(),
    };

    const dispatchEventSpy = vi.spyOn(mockWindow, 'dispatchEvent');

    keydownListener(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    const sentEvent = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
    expect(sentEvent.type).toBe('depthindex:open-panel');
    expect(sentEvent.detail).toEqual({ query: 'test query', source: 'search-bar' });

    integration.destroy();
    vi.unstubAllGlobals();
  });

});
