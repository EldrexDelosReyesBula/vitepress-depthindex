import { describe, it, expect, vi } from 'vitest';
import { DeltaIndexer } from '../src/build/delta-indexer.js';
import { SecureUpdateEngine } from '../src/client/secure-updater.js';
import { DeviceAdapter } from '../src/client/device-adapter.js';
import { CloudKnowledgeEngine } from '../src/client/cloud-knowledge.js';

describe('DepthIndex 1.1.11 Optimization & Secure Pipeline', () => {
  describe('DeltaIndexer', () => {
    it('should generate a full index manifest if previousManifest is null', async () => {
      const indexer = new DeltaIndexer();
      const mockPages = [
        {
          url: '/intro',
          title: 'Introduction',
          sections: [{ heading: 'Welcome', content: 'This is an intro.' }],
          headings: [],
          frontmatter: {},
          lastModified: Date.now()
        }
      ];

      const { fullIndex, deltaIndex, manifest } = await indexer.generateDelta(mockPages as any, null);
      
      expect(fullIndex).toBeInstanceOf(Uint8Array);
      expect(deltaIndex).toBeNull();
      expect(manifest.version).toBe('1.2.0');
      expect(manifest.buildId).toBeDefined();
    });

    it('should correctly diff pages and generate added/removed page lists', async () => {
      const indexer = new DeltaIndexer();
      const currentPages = [
        {
          url: '/intro',
          title: 'Introduction Updated',
          sections: [{ heading: 'Welcome', content: 'This is an updated intro.' }],
          headings: [],
          frontmatter: {},
          lastModified: Date.now()
        },
        {
          url: '/new-page',
          title: 'New Page',
          sections: [{ heading: 'Features', content: 'This is a new page.' }],
          headings: [],
          frontmatter: {},
          lastModified: Date.now()
        }
      ];

      // Simulate diffing
      const diffResult = (indexer as any).diffPages(currentPages, [
        {
          url: '/intro',
          title: 'Introduction',
          sections: [{ heading: 'Welcome', content: 'This is an intro.' }],
          headings: [],
          frontmatter: {}
        },
        {
          url: '/old-page',
          title: 'Old Page',
          sections: [{ heading: 'Outdated', content: 'This is old.' }],
          headings: [],
          frontmatter: {}
        }
      ]);

      expect(diffResult.added.map((p: any) => p.url)).toContain('/new-page');
      expect(diffResult.modified.map((p: any) => p.url)).toContain('/intro');
      expect(diffResult.removed.map((p: any) => p.url)).toContain('/old-page');
    });
  });

  describe('DeviceAdapter', () => {
    it('should auto-detect profile configurations and assign proper tier defaults', () => {
      const adapter = new DeviceAdapter();
      const profile = adapter.getProfile();
      const config = adapter.getConfig();

      expect(['low', 'medium', 'high']).toContain(profile.tier);
      expect(config.vectorPrecision).toBeDefined();
      expect(config.chunkSize).toBeGreaterThan(0);
    });
  });

  describe('CloudKnowledgeEngine', () => {
    it('should support querying and caching responses from cloud hosted bases', async () => {
      const mockFetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ answer: 'Mocked Cloud Answer' }),
        })
      );
      global.fetch = mockFetch;

      const engine = new CloudKnowledgeEngine({
        knowledgeBaseUrl: 'https://kb.example.com',
        apiKey: 'test-key'
      });

      const response = await engine.pullKnowledge('What is DepthIndex?');
      expect(response.answer).toBe('Mocked Cloud Answer');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second pull should hit the cache and not hit fetch again
      const cachedResponse = await engine.pullKnowledge('What is DepthIndex?');
      expect(cachedResponse.answer).toBe('Mocked Cloud Answer');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
