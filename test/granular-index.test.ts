import { describe, it, expect } from 'vitest';
import { GranularIndexLoader } from '../src/client/granular-index-loader.js';

describe('Granular Index Download System', () => {
  it('should initialize loader with default options and report cache stats', async () => {
    const loader = new GranularIndexLoader({
      strategy: 'lazy',
      maxCacheSizeMB: 20,
    });

    await loader.init();

    const stats = loader.getStats();
    expect(stats.totalPages).toBe(0);
    expect(stats.totalSize).toBe(0);
    expect(stats.maxSize).toBe(20 * 1024 * 1024);
  });

  it('should handle page visits and track cached state', async () => {
    const loader = new GranularIndexLoader({
      strategy: 'lazy',
    });

    await loader.onPageVisit('/guide/installation');
    expect(loader.isCached('/guide/installation')).toBe(false); // Not in manifest in mock unit test environment
  });
});
