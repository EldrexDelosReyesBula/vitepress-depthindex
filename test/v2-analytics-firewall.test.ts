import { describe, it, expect } from 'vitest';
import { PrivacyFirewall } from '../src/privacy/firewall.js';
import { CloudOnlyStrategy } from '../src/build/cloud-only-strategy.js';
import { ExtractedPage, DepthIndexOptions } from '../src/types/index.js';

describe('DepthIndex v1.1.6 Analytics & Privacy Firewall', () => {

  describe('PrivacyFirewall', () => {
    it('should validate payloads and detect violations', () => {
      // Valid payload
      const validPayload = {
        action: 'search_query',
        query: 'how to configure plugins',
        category: 'search'
      };
      const res1 = PrivacyFirewall.validatePayload(validPayload);
      expect(res1.valid).toBe(true);
      expect(res1.violations.length).toBe(0);

      // Payload containing protected config key
      const badConfigPayload = {
        action: 'save_config',
        key: 'depthindex-api-key',
        value: 'some-sensitive-value'
      };
      const res2 = PrivacyFirewall.validatePayload(badConfigPayload);
      expect(res2.valid).toBe(false);
      expect(res2.violations).toContain('Protected key: depthindex-api-key');

      // Payload containing email address
      const emailPayload = {
        query: 'contact support at test@example.com'
      };
      const res3 = PrivacyFirewall.validatePayload(emailPayload);
      expect(res3.valid).toBe(false);
      expect(res3.violations).toContain('Email detected');

      // Payload containing phone number
      const phonePayload = {
        message: 'my phone number is 123-456-7890'
      };
      const res4 = PrivacyFirewall.validatePayload(phonePayload);
      expect(res4.valid).toBe(false);
      expect(res4.violations).toContain('Phone detected');

      // Payload containing API key pattern
      const keyPayload = {
        secret: 'sk-abcdefghijklmnopqrstu123'
      };
      const res5 = PrivacyFirewall.validatePayload(keyPayload);
      expect(res5.valid).toBe(false);
      expect(res5.violations).toContain('API key detected');
    });

    it('should expose accessible analytics and restricted data arrays', () => {
      const accessible = PrivacyFirewall.getAccessibleAnalytics();
      expect(accessible).toContain('total_queries');
      expect(accessible).toContain('top_queries_anonymized');

      const restricted = PrivacyFirewall.getRestrictedData();
      expect(restricted).toContain('individual_user_queries');
      expect(restricted).toContain('user_api_keys');
    });
  });

  describe('CloudOnlyStrategy', () => {
    it('should skip index generation and generate llms.txt, llms.jsonl, and page-manifest.json', async () => {
      const mockPages: ExtractedPage[] = [
        {
          url: '/guide/getting-started.html',
          title: 'Getting Started',
          lastModified: Date.now(),
          headings: [
            { level: 1, text: 'Getting Started', id: 'getting-started' }
          ],
          frontmatter: { description: 'Getting Started Guide' },
          sections: [
            {
              heading: 'Getting Started',
              content: 'This is the getting started guide of the documentation.',
              codeBlocks: [{ language: 'bash', code: 'npm install' }],
              mermaidDiagrams: [],
              links: []
            }
          ]
        }
      ];

      const config: DepthIndexOptions = {
        searchMode: 'cloud',
        indexConfig: {
          chunkSize: 500,
          overlapSize: 50,
          excludePages: [],
          includeCodeBlocks: true,
          includeMermaid: true
        },
        ui: {
          theme: 'auto',
          position: 'bottom-right',
          showFloatingButton: true,
          enableFullscreen: true,
          enableModal: true
        },
        personalization: {
          enabled: false,
          storage: 'localStorage'
        },
        offline: {
          enabled: true,
          cacheStrategy: 'network-first'
        },
        llmText: {
          enabled: true,
          formats: ['txt', 'jsonl'],
          includeMetadata: true
        },
        seo: {
          siteName: 'My Awesome Docs',
          siteDescription: 'My Awesome Docs Description'
        }
      };

      const strategy = new CloudOnlyStrategy();
      const output = await strategy.buildForCloud(mockPages, config);

      expect(output['llms.txt']).toBeDefined();
      expect(output['llms.jsonl']).toBeDefined();
      expect(output['page-manifest.json']).toBeDefined();

      // Check contents
      expect(output['llms.txt']).toContain('My Awesome Docs');
      expect(output['llms.txt']).toContain('Getting Started');
      expect(output['llms.txt']).toContain('npm install');

      const parsedJSONL = JSON.parse(output['llms.jsonl']);
      expect(parsedJSONL.url).toBe('/guide/getting-started.html');
      expect(parsedJSONL.title).toBe('Getting Started');
      expect(parsedJSONL.hasCode).toBe(true);

      const parsedManifest = JSON.parse(output['page-manifest.json']);
      expect(parsedManifest.length).toBe(1);
      expect(parsedManifest[0].url).toBe('/guide/getting-started.html');
      expect(parsedManifest[0].title).toBe('Getting Started');
    });
  });

});
