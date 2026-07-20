import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SearchBarIntegration } from '../src/client/search-bar-integration.js';
import { DepthIndexEngine } from '../src/client/search-engine.js';

describe('SearchBarOverview Mode & Button Mode', () => {
  let mockInput: any;
  let mockParent: any;
  let mockObserver: any;
  let mockVitePressSearch: any;
  let engine: DepthIndexEngine;

  beforeEach(() => {
    mockInput = {
      value: '',
      placeholder: '',
      parentElement: {
        insertBefore: vi.fn(),
        appendChild: vi.fn(),
        style: {},
        querySelector: vi.fn().mockImplementation((sel) => {
          if (sel === '.di-ask-ai-btn') return mockParent._btn;
          return null;
        }),
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      blur: vi.fn(),
    };

    mockParent = mockInput.parentElement;
    mockParent._btn = null;

    mockVitePressSearch = {
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
        const el = {
          className: '',
          innerHTML: '',
          remove: vi.fn(),
          setAttribute: vi.fn(),
          appendChild: vi.fn(),
          insertBefore: vi.fn(),
          querySelector: vi.fn().mockImplementation((sel) => {
            if (sel === '.di-overview-expand') return { addEventListener: vi.fn() };
            return null;
          }),
          addEventListener: vi.fn(),
          style: {},
        };
        if (tag === 'button') {
          mockParent._btn = el;
        }
        return el;
      },
      body: {
        appendChild: vi.fn(),
      }
    });

    mockObserver = {
      observe: vi.fn(),
      disconnect: vi.fn(),
    };
    vi.stubGlobal('MutationObserver', vi.fn().mockImplementation(() => mockObserver));

    engine = new DepthIndexEngine();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('fullToOverview conversion rules', () => {
    it('should strip complex markdown/HTML elements and summarize correctly', () => {
      const integration = new SearchBarIntegration({
        enabled: true,
        mode: 'overview',
        overviewMaxLength: 400,
      }, engine);

      const contentWithEverything = `Here is some text.
\`\`\`javascript
const x = 10;
\`\`\`
Followed by a table:
| Name | Type |
|------|------|
| user | string |
And an image: ![Alt Text](http://example.com/img.png)
And a youtube video: https://www.youtube.com/watch?v=12345
And a mermaid diagram:
\`\`\`mermaid
graph TD;
  A-->B;
\`\`\`
And confidence badges 💻 On-Device Fast.
### References
- Ref 1
### Related Topics
- Topic 2`;

      // Access private method to test parsing logic
      const overview = (integration as any).fullToOverview(contentWithEverything);

      // 1. Code block should become [code example]
      expect(overview).toContain('[code example]');
      // 2. Table should become [table]
      expect(overview).toContain('[table]');
      // 3. Image should become [image]
      expect(overview).toContain('[image]');
      // 4. Video URL should become [video]
      expect(overview).toContain('[video]');
      // 5. Mermaid block should become [diagram]
      expect(overview).toContain('[diagram]');
      // 6. References and Related Topics sections should be removed
      expect(overview).not.toContain('Ref 1');
      expect(overview).not.toContain('Topic 2');
      // 7. Badges should be removed
      expect(overview).not.toContain('On-Device Fast');
      // 8. Normalizes whitespace and merges duplicate placeholders
      expect(overview).not.toContain('\n\n\n');
    });

    it('should truncate at sentence boundaries if within range', () => {
      const integration = new SearchBarIntegration({
        enabled: true,
        mode: 'overview',
        overviewMaxLength: 100,
      }, engine);

      const longSentences = 'This is a long sentence. This is the second sentence. This is the third sentence that is very long indeed.';
      const overview = (integration as any).fullToOverview(longSentences);

      // Total characters should be truncated, ending with sentence boundary if possible
      expect(overview.length).toBeLessThanOrEqual(102); // 100 max + ".." or similar
      expect(overview).toContain('This is the second sentence.');
    });
  });

  describe('Ask AI Button Mode', () => {
    it('should inject "Ask AI" button and bind click events', async () => {
      const integration = new SearchBarIntegration({
        enabled: true,
        mode: 'button',
        askAIButtonText: 'Help me AI',
      }, engine);

      await integration.init();

      // Assert Ask AI button was created
      expect(mockParent.appendChild).toHaveBeenCalled();
      expect(mockParent._btn).toBeDefined();

      // Keydown listener for input should be bound
      expect(mockInput.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));

      integration.destroy();
    });
  });

  describe('None Mode', () => {
    it('should not attach listeners or inject buttons in none mode', async () => {
      const integration = new SearchBarIntegration({
        enabled: true,
        mode: 'none',
      }, engine);

      await integration.init();

      expect(mockInput.addEventListener).not.toHaveBeenCalled();
      expect(mockParent.appendChild).not.toHaveBeenCalled();

      integration.destroy();
    });
  });
});
