import { DepthIndexEngine } from './search-engine.js';
import { fetchAndDecompressIndex } from './index-loader.js';

const engine = new DepthIndexEngine();

self.onmessage = async (event: MessageEvent) => {
  const { type, query, topK, indexUrl } = event.data;

  try {
    if (type === 'ping') {
      self.postMessage({ type: 'pong' });
      return;
    }

    if (type === 'load-index') {
      const indexData = await fetchAndDecompressIndex(indexUrl);
      engine.setIndex(indexData);
      self.postMessage({ type: 'index-loaded' });
    }

    if (type === 'search') {
      const results = engine.search(query, topK || 5);
      self.postMessage({
        type: 'search-results',
        query,
        results,
      });
    }
  } catch (err: any) {
    console.error('[DepthIndex Worker] Error in worker processing:', err);
    self.postMessage({
      type: 'error',
      message: err.message || String(err),
    });
  }
};
