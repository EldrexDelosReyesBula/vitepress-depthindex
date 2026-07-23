import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  GPUCapabilityDetector,
  GPUAcceleratedSearch,
  GPUEmbeddingGenerator,
  GPUMemoryManager,
} from '../src/gpu/index.js';
import { DepthIndexEngine } from '../src/client/search-engine.js';

describe('GPU Acceleration Module', () => {
  describe('GPUCapabilityDetector', () => {
    it('should detect available tier and return GPUDeviceInfo', async () => {
      const detector = new GPUCapabilityDetector();
      const info = await detector.detect();

      expect(info).toHaveProperty('tier');
      expect(['webgpu', 'webgl', 'wasm', 'cpu']).toContain(info.tier);
      expect(info).toHaveProperty('limits');
      expect(info).toHaveProperty('features');
      expect(typeof info.isIntegrated).toBe('boolean');
      expect(typeof info.vendor).toBe('string');
      expect(typeof info.renderer).toBe('string');
    });

    it('should report tier via getTier() and availability via isGPUAvailable()', async () => {
      const detector = new GPUCapabilityDetector();
      await detector.detect();
      const tier = detector.getTier();
      expect(typeof tier).toBe('string');
      const isAvailable = detector.isGPUAvailable();
      expect(typeof isAvailable).toBe('boolean');
    });
  });

  describe('GPUAcceleratedSearch', () => {
    let search: GPUAcceleratedSearch;

    beforeEach(() => {
      search = new GPUAcceleratedSearch();
    });

    afterEach(() => {
      search.destroy();
    });

    it('should initialize gracefully and handle fallback to CPU cosine similarity', async () => {
      await search.init();

      const numDocs = 3;
      const vecLength = 4;
      const queryVec = new Float32Array([1.0, 0.0, 0.5, 0.0]);
      const docVecs = new Float32Array([
        1.0, 0.0, 0.5, 0.0, // Match doc 0
        0.0, 1.0, 0.0, 0.0, // No match doc 1
        0.5, 0.0, 0.25, 0.0, // Partial match doc 2
      ]);

      const results = await search.cosineSimilarity(queryVec, docVecs, numDocs, vecLength);

      expect(results).toBeInstanceOf(Float32Array);
      expect(results.length).toBe(numDocs);
      expect(results[0]).toBeGreaterThan(0.9);
      expect(results[1]).toBeLessThan(0.1);
      expect(results[2]).toBeGreaterThan(0.5);
    });
  });

  describe('GPUEmbeddingGenerator', () => {
    it('should initialize and compute TF-IDF embeddings using CPU fallback when WebGPU is absent', async () => {
      const generator = new GPUEmbeddingGenerator();
      await generator.init();

      const numDocs = 2;
      const numTerms = 3;
      const termCounts = new Uint32Array([2, 1, 1]);
      const docTermCounts = new Uint32Array([
        1, 1, 0, // Doc 0
        1, 0, 1, // Doc 1
      ]);
      const totalTermsPerDoc = new Uint32Array([2, 2]);

      const embeddings = await generator.generateTFIDFEmbeddings(
        numDocs,
        numTerms,
        termCounts,
        docTermCounts,
        totalTermsPerDoc
      );

      expect(embeddings).toBeInstanceOf(Float32Array);
      expect(embeddings.length).toBe(numDocs * numTerms);
    });
  });

  describe('GPUMemoryManager', () => {
    it('should manage buffer allocations and report memory usage accurately', () => {
      const manager = new GPUMemoryManager(128); // 128MB
      const usageInit = manager.getMemoryUsage();
      expect(usageInit.allocated).toBe(0);
      expect(usageInit.max).toBe(128 * 1024 * 1024);
      expect(usageInit.percent).toBe(0);

      // Mock GPUDevice
      const mockBuffer = { destroy: vi.fn() };
      const mockDevice = {
        createBuffer: vi.fn().mockReturnValue(mockBuffer),
      };

      manager.setDevice(mockDevice);

      const buffer = manager.createBuffer(1024 * 1024, 1); // 1MB
      expect(buffer).toBe(mockBuffer);

      const usageAfter = manager.getMemoryUsage();
      expect(usageAfter.allocated).toBe(1024 * 1024);
      expect(usageAfter.percent).toBeGreaterThan(0);

      manager.cleanup();
      expect(mockBuffer.destroy).toHaveBeenCalled();
      expect(manager.getMemoryUsage().allocated).toBe(0);

      manager.destroy();
    });
  });

  describe('DepthIndexEngine Integration', () => {
    it('should initialize GPU configuration gracefully in DepthIndexEngine', async () => {
      const engine = new DepthIndexEngine();
      await engine.init({
        gpu: {
          enabled: true,
          maxMemoryMB: 256,
          fallback: 'silent',
        },
        indexConfig: {
          chunkSize: 500,
          overlapSize: 50,
          excludePages: [],
          includeCodeBlocks: true,
          includeMermaid: true,
        },
        ui: {
          theme: 'auto',
          position: 'bottom-right',
          showFloatingButton: true,
          enableFullscreen: true,
          enableModal: true,
        },
        personalization: { enabled: false, storage: 'localStorage' },
        offline: { enabled: true, cacheStrategy: 'network-first' },
        llmText: { enabled: true, formats: ['txt'], includeMetadata: true },
      });

      expect(typeof engine.isGPUEnabled()).toBe('boolean');
    });
  });
});
