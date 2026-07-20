import { describe, it, expect, vi } from 'vitest';
import { DepthIndexEngine } from '../src/client/search-engine.js';
import { SessionManager } from '../src/client/session-manager.js';
import { AnswerSynthesizer } from '../src/client/answer-synthesizer.js';
import { DepthIndexRuntime } from '../src/client/runtime.js';

describe('DepthIndex Ground-Up Stabilization', () => {
  
  describe('Search Engine Null-Safety', () => {
    it('should return empty array when index is not loaded', () => {
      const engine = new DepthIndexEngine();
      const results = engine.search('test');
      expect(results).toEqual([]);
    });

    it('should handle empty or whitespace queries safely', () => {
      const engine = new DepthIndexEngine();
      engine.setIndex({
        vocabulary: ['test'],
        idf: [1],
        chunks: [{ content: 'test content', pageTitle: 'Title', heading: 'H1', vector: [0, 1] } as any],
        invertedIndex: { test: [[0, 1]] }
      });

      expect(engine.search('')).toEqual([]);
      expect(engine.search('   ')).toEqual([]);
    });

    it('should handle null/undefined queries gracefully', () => {
      const engine = new DepthIndexEngine();
      expect(engine.search(null as any)).toEqual([]);
      expect(engine.search(undefined as any)).toEqual([]);
    });

    it('should truncate excessively long queries to 500 chars and execute safely', () => {
      const engine = new DepthIndexEngine();
      engine.setIndex({
        vocabulary: ['test'],
        idf: [1],
        chunks: [{ content: 'test content', pageTitle: 'Title', heading: 'H1', vector: [0, 1] } as any],
        invertedIndex: { test: [[0, 1]] }
      });

      const longQuery = 'test '.repeat(500); // 2500 chars
      const results = engine.search(longQuery);
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle special and regex characters safely without crashing regex engine', () => {
      const engine = new DepthIndexEngine();
      engine.setIndex({
        vocabulary: ['test'],
        idf: [1],
        chunks: [{ content: 'test content', pageTitle: 'Title', heading: 'H1', vector: [0, 1] } as any],
        invertedIndex: { test: [[0, 1]] }
      });

      const results = engine.search('!@#$%^&*()_+{}|:"<>?~`[]\\;');
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Session Manager Quota Safety', () => {
    it('should catch QuotaExceededError and trigger handleQuotaExceeded gracefully', async () => {
      const mockStore = {
        put: vi.fn().mockImplementation(() => {
          const err = new Error('Disk quota exceeded');
          err.name = 'QuotaExceededError';
          throw err;
        }),
      };
      
      const mockTx = {
        objectStore: vi.fn().mockReturnValue(mockStore),
        done: Promise.resolve(),
      };

      const manager = new SessionManager();
      // Stub the db instance
      (manager as any).db = {
        transaction: vi.fn().mockReturnValue(mockTx),
      };

      // Mock handleQuotaExceeded spy
      const quotaSpy = vi.spyOn(manager as any, 'handleQuotaExceeded').mockImplementation(async () => {});

      await manager.saveMessage({
        id: '123',
        sessionId: 'sess_1',
        role: 'user',
        content: 'hello',
        timestamp: Date.now()
      });

      expect(quotaSpy).toHaveBeenCalled();
      quotaSpy.mockRestore();
    });
  });

  describe('Answer Synthesizer Null-Safety', () => {
    it('should never return null even on synthesis failures', async () => {
      const synthesizer = new AnswerSynthesizer();
      const answer = await synthesizer.synthesize('test', []);
      expect(answer).toBeDefined();
      expect(answer.content).toBeTruthy();
      expect(answer.citations).toBeDefined();
    });

    it('should handle null search results gracefully', async () => {
      const synthesizer = new AnswerSynthesizer();
      const answer = await synthesizer.synthesize('test', null as any);
      expect(answer).toBeDefined();
      expect(answer.content).toContain("I couldn't find");
    });

    it('should handle search results containing missing fields without throwing', async () => {
      const synthesizer = new AnswerSynthesizer();
      const answer = await synthesizer.synthesize('test', [
        { page: null, snippet: null } as any,
        { page: { url: '/test' }, snippet: undefined } as any,
      ]);
      expect(answer).toBeDefined();
      expect(answer.content).toBeDefined();
    });
  });

  describe('Runtime Error Isolation', () => {
    it('should isolate optional component setup failures and record them', async () => {
      const runtime = new DepthIndexRuntime();
      
      // Stub document globally
      const mockDocument = {
        createElement: vi.fn(),
      };
      vi.stubGlobal('document', mockDocument);

      // Force search engine init to fail
      vi.spyOn(runtime as any, 'initSearchEngine').mockRejectedValue(new Error('Engine failed'));
      // Force panel to fail
      vi.spyOn(runtime as any, 'initPanel').mockRejectedValue(new Error('Panel failed'));

      await runtime.init({
        searchMode: 'on-device',
      } as any);

      expect(runtime.isHealthy()).toBe(false);
      const errors = runtime.getErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toBe('Engine failed');
      
      vi.unstubAllGlobals();
    });
  });
});
