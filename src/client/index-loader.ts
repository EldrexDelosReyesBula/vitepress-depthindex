import { SerializedIndex } from '../types/index.js';
import { decompressIndex } from '../utils/compression.js';

let cachedIndex: SerializedIndex | null = null;
let isLoading = false;
let loadPromise: Promise<SerializedIndex | null> | null = null;

/** A valid empty index used as a graceful fallback when the real index isn't available yet. */
function emptyIndex(): SerializedIndex {
  return {
    vocabulary: [],
    idf: [],
    chunks: [],
    invertedIndex: {},
    pages: [],
    buildTime: 0,
    version: '0',
  } as unknown as SerializedIndex;
}

export async function fetchAndDecompressIndex(indexUrl: string = '/assets/depth-index.json'): Promise<SerializedIndex> {
  if (cachedIndex) {
    return cachedIndex;
  }

  if (isLoading && loadPromise) {
    return (await loadPromise) ?? emptyIndex();
  }

  isLoading = true;
  loadPromise = (async () => {
    try {
      const response = await fetch(indexUrl);

      // In dev mode the index isn't built yet — degrade gracefully
      if (!response.ok) {
        if (response.status === 404) {
          console.info('[depthindex] Search index not found (404). Run a production build to generate it. Operating in no-index mode.');
        } else {
          console.warn(`[depthindex] Failed to fetch search index: ${response.status} ${response.statusText}`);
        }
        return null;
      }

      // Reject HTML error pages served as 200 (some dev servers do this)
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        console.info('[depthindex] Search index URL returned HTML — index not yet built. Operating in no-index mode.');
        return null;
      }

      const compressedText = await response.text();

      // Guard: if decompression returns falsy, treat as missing
      const decompressedText = decompressIndex(compressedText);
      if (!decompressedText) {
        console.warn('[depthindex] Failed to decompress search index.');
        return null;
      }

      const indexObj = JSON.parse(decompressedText) as SerializedIndex;

      // Validate the parsed index has the required shape
      if (!indexObj || !Array.isArray(indexObj.vocabulary) || !Array.isArray(indexObj.chunks)) {
        console.warn('[depthindex] Parsed index has unexpected shape — ignoring.');
        return null;
      }

      cachedIndex = indexObj;
      return indexObj;
    } catch (err) {
      console.warn('[depthindex] Error loading search index (operating in no-index mode):', err);
      return null;
    } finally {
      isLoading = false;
      loadPromise = null;
    }
  })();

  return (await loadPromise) ?? emptyIndex();
}

export function clearIndexCache(): void {
  cachedIndex = null;
}
