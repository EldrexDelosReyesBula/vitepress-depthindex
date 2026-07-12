import { SerializedIndex } from '../types/index.js';
import { decompressIndex } from '../utils/compression.js';

let cachedIndex: SerializedIndex | null = null;
let isLoading = false;
let loadPromise: Promise<SerializedIndex> | null = null;

export async function fetchAndDecompressIndex(indexUrl: string = '/assets/depth-index.json.gz'): Promise<SerializedIndex> {
  if (cachedIndex) {
    return cachedIndex;
  }

  if (isLoading && loadPromise) {
    return loadPromise;
  }

  isLoading = true;
  loadPromise = (async () => {
    try {
      const response = await fetch(indexUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch search index: ${response.status} ${response.statusText}`);
      }

      const compressedText = await response.text();
      const decompressedText = decompressIndex(compressedText);
      const indexObj = JSON.parse(decompressedText) as SerializedIndex;

      cachedIndex = indexObj;
      return indexObj;
    } catch (err) {
      console.error('[depthindex] Error loading compressed index:', err);
      throw err;
    } finally {
      isLoading = false;
      loadPromise = null;
    }
  })();

  return loadPromise;
}

export function clearIndexCache(): void {
  cachedIndex = null;
}
