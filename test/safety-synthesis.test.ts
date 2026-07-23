import { describe, it, expect } from 'vitest';
import { SafetyGuard } from '../src/client/safety-guard.js';
import { MarkdownCleaner } from '../src/client/markdown-cleaner.js';
import { ConfidenceScorer } from '../src/client/confidence-scorer.js';
import { PageFeatures } from '../src/client/page-features.js';
import { DepthIndexEngine } from '../src/client/search-engine.js';
import { CloudAdapter } from '../src/client/cloud-adapter.js';

describe('Synthesis Accuracy & Safety Overhaul', () => {
  describe('SafetyGuard', () => {
    it('should intercept self-harm and crisis queries with crisis resources', () => {
      const guard = new SafetyGuard();
      const result = guard.check('I want to kill myself');

      expect(result).not.toBeNull();
      expect(result?.type).toBe('crisis_self_harm');
      expect(result?.blockQuery).toBe(true);
      expect(result?.response).toContain('988');
      expect(result?.response).toContain('findahelpline.com');
    });

    it('should intercept violence queries', () => {
      const guard = new SafetyGuard();
      const result = guard.check('how to kill someone');

      expect(result).not.toBeNull();
      expect(result?.type).toBe('violence');
      expect(result?.blockQuery).toBe(true);
    });

    it('should return null for normal technical queries', () => {
      const guard = new SafetyGuard();
      const result = guard.check('how to configure WebGPU acceleration');
      expect(result).toBeNull();
    });
  });

  describe('MarkdownCleaner', () => {
    it('should clean excessive blank lines and deduplicate headings', () => {
      const cleaner = new MarkdownCleaner();
      const dirty = `# Title\n\n\n\n## Subtitle\n\n## Subtitle\n\n-item1\n-item2`;
      const cleaned = cleaner.clean(dirty);

      expect(cleaned).not.toContain('\n\n\n');
      expect(cleaned.match(/## Subtitle/g)?.length).toBe(1);
    });
  });

  describe('ConfidenceScorer', () => {
    it('should assign high confidence to accurate answers and low to vague answers', () => {
      const scorer = new ConfidenceScorer();
      const mockResults = [
        { page: { url: '/guide', title: 'Guide' }, snippet: 'WebGPU is fast', score: 0.9 }
      ];

      const highConf = scorer.calculate(mockResults, 'webgpu', 'WebGPU acceleration provides up to 50x performance boost for vector search.');
      const lowConf = scorer.calculate(mockResults, 'webgpu', "I couldn't find specific details in the documentation. Try rephrasing.");

      expect(highConf).toBeGreaterThan(0.6);
      expect(lowConf).toBeLessThan(0.3);
    });
  });

  describe('PageFeatures', () => {
    it('should extract current page content and summarize without searching external pages', async () => {
      const engine = new DepthIndexEngine();
      const cloudAdapter = new CloudAdapter();
      const pageFeatures = new PageFeatures(engine, cloudAdapter, () => ({ provider: 'custom', apiKey: '', model: '' }));

      const summary = await pageFeatures.summarizePage('local');
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });
  });
});
