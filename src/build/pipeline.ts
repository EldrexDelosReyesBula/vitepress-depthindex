import { DepthIndexOptions, SerializedIndex } from '../types/index.js';
import { extractAllPages } from './extractor.js';
import { chunkAllPages } from './chunker.js';
import { buildSearchIndex } from './embedder.js';

export async function buildIndex(
  pages: string[],
  config: DepthIndexOptions,
  srcDir: string
): Promise<SerializedIndex> {
  // 1. Filter excluded pages
  const excluded = config.indexConfig.excludePages || [];
  const filteredPages = pages.filter(page => {
    // Standardize path separators to forward slash
    const normalizedPage = '/' + page.replace(/\\/g, '/');
    return !excluded.some(ex => {
      // Handle prefix/exact matching
      const normalizedEx = ex.startsWith('/') ? ex : '/' + ex;
      return normalizedPage.startsWith(normalizedEx) || normalizedPage.includes(ex);
    });
  });

  // 2. Extract pages
  const extractedPages = await extractAllPages(filteredPages, srcDir);

  // 3. Chunk sections
  const chunks = chunkAllPages(
    extractedPages,
    config.indexConfig.chunkSize,
    config.indexConfig.overlapSize
  );

  // 4. Build inverted index + TF-IDF vectors
  const searchIndex = buildSearchIndex(chunks);

  return searchIndex;
}
