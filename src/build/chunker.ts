import { ExtractedPage, PageChunk } from '../types/index.js';
import { slugify } from './extractor.js';

export function chunkPage(
  page: ExtractedPage,
  chunkSize: number = 500, // words
  overlapSize: number = 50 // words
): PageChunk[] {
  const chunks: PageChunk[] = [];

  for (const section of page.sections) {
    const headingSlug = slugify(section.heading);
    const words = section.content.split(/\s+/).filter(w => w.length > 0);

    if (words.length <= chunkSize) {
      // Small section, fits in one chunk
      chunks.push({
        id: `${page.url}#${headingSlug}`,
        url: page.url,
        pageTitle: page.title,
        heading: section.heading,
        content: section.content,
        codeBlocks: section.codeBlocks,
        mermaidDiagrams: section.mermaidDiagrams,
        links: section.links
      });
      continue;
    }

    // Large section, needs splitting with overlap
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < words.length) {
      const endIndex = Math.min(startIndex + chunkSize, words.length);
      const chunkWords = words.slice(startIndex, endIndex);
      const chunkText = chunkWords.join(' ');

      chunks.push({
        id: `${page.url}#${headingSlug}-${chunkIndex}`,
        url: page.url,
        pageTitle: page.title,
        heading: section.heading,
        content: chunkText,
        // Share code blocks and diagrams across the section's chunks
        codeBlocks: section.codeBlocks,
        mermaidDiagrams: section.mermaidDiagrams,
        links: section.links
      });

      // Move forward by (chunkSize - overlapSize)
      startIndex += (chunkSize - overlapSize);
      chunkIndex++;

      // Prevent infinite loops if overlapSize >= chunkSize
      if (overlapSize >= chunkSize || chunkSize <= 0) {
        break;
      }
    }
  }

  return chunks;
}

export function chunkAllPages(
  pages: ExtractedPage[],
  chunkSize: number = 500,
  overlapSize: number = 50
): PageChunk[] {
  const allChunks: PageChunk[] = [];
  for (const page of pages) {
    allChunks.push(...chunkPage(page, chunkSize, overlapSize));
  }
  return allChunks;
}
