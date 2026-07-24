import { describe, it, expect } from 'vitest';
import { PageChunk, ExtractedPage } from '../src/types/index.js';
import { chunkAllPages } from '../src/build/chunker.js';
import { buildSearchIndex } from '../src/build/embedder.js';
import { DepthIndexEngine } from '../src/client/search-engine.js';
import { compressIndex, decompressIndex } from '../src/utils/compression.js';

// Helper to generate a mock page
function generateMockPage(id: number): ExtractedPage {
  const headings = [
    { level: 1, text: `Mock Page Number ${id}`, id: `mock-page-number-${id}` },
    { level: 2, text: `Getting Started Guide ${id}`, id: `getting-started-guide-${id}` },
    { level: 2, text: `API Options Details ${id}`, id: `api-options-details-${id}` }
  ];

  const content1 = `This is section one of mock page number ${id}. We are writing a detailed guide about automated deployments, configuration options, setup requirements, and CLI commands. Let's make sure it contains search terms like install, build, test, and deploy. This will be matched by BM25 search queries.`;
  const content2 = `This is section two of mock page number ${id}. Let's discuss performance settings, low-end optimizations, privacy filters, and offline capabilities. You can configure your local service worker, cache indices, and use OpenAI, Gemini, or Anthropic models if you provide your API key.`;

  return {
    url: `/docs/mock-page-${id}.html`,
    title: `Mock Page Title ${id}`,
    lastModified: Date.now(),
    headings,
    frontmatter: {
      title: `Mock Page Title ${id}`,
      description: `This is a generated description for mock page number ${id} to test index sizes.`
    },
    sections: [
      {
        heading: `Getting Started Guide ${id}`,
        content: content1,
        codeBlocks: [
          { language: 'bash', code: `npm install vitepress-plugin-depthindex --save-dev\n# Run mock script number ${id}` }
        ],
        mermaidDiagrams: [
          `graph TD\n  A[Start ${id}] --> B[Index Page]\n  B --> C[Compressed output]`
        ],
        links: [
          { text: 'Installation Link', url: `/docs/mock-page-${id - 1}.html`, internal: true }
        ]
      },
      {
        heading: `API Options Details ${id}`,
        content: content2,
        codeBlocks: [
          { language: 'typescript', code: `const options = {\n  indexConfig: {\n    chunkSize: 500,\n    overlapSize: 50\n  }\n};` }
        ],
        mermaidDiagrams: [],
        links: []
      }
    ]
  };
}

describe('VitePress DepthIndex Stress Testing', () => {

  it('Benchmarking 1,000 Pages Indexing & Query Latency', () => {
    const pageCount = 1000;
    
    // 1. Generate 1000 pages
    const startGen = performance.now();
    const mockPages: ExtractedPage[] = [];
    for (let i = 1; i <= pageCount; i++) {
      mockPages.push(generateMockPage(i));
    }
    const endGen = performance.now();
    console.log(`[stress-test] Generated ${pageCount} mock pages in ${(endGen - startGen).toFixed(2)}ms`);

    // 2. Run Chunking
    const startChunk = performance.now();
    const chunks = chunkAllPages(mockPages, 500, 50);
    const endChunk = performance.now();
    console.log(`[stress-test] Generated ${chunks.length} chunks from pages in ${(endChunk - startChunk).toFixed(2)}ms`);
    expect(chunks.length).toBe(pageCount * 2); // 2 sections per page

    // 3. Build Index & TF-IDF
    const startIndexBuild = performance.now();
    const searchIndex = buildSearchIndex(chunks);
    const endIndexBuild = performance.now();
    const buildTime = endIndexBuild - startIndexBuild;
    console.log(`[stress-test] Built index vocabulary and sparse TF-IDF vectors in ${buildTime.toFixed(2)}ms`);
    expect(searchIndex.vocabulary.length).toBeGreaterThan(50); // vocabulary should contain stems

    // 4. Compress Index
    const startCompress = performance.now();
    const serialized = JSON.stringify(searchIndex);
    const compressed = compressIndex(serialized);
    const endCompress = performance.now();
    console.log(`[stress-test] Compressed index JSON from ${(serialized.length / (1024 * 1024)).toFixed(2)}MB to ${(compressed.length / (1024 * 1024)).toFixed(2)}MB in ${(endCompress - startCompress).toFixed(2)}ms`);
    
    // Index size assertion (should be less than 1.5MB for 1000 simple pages when compressed)
    const compressedMb = compressed.length / (1024 * 1024);
    expect(compressedMb).toBeLessThan(1.5);

    // 5. Client-Side Load & Decompress
    const startLoad = performance.now();
    const decompressed = decompressIndex(compressed);
    const indexObj = JSON.parse(decompressed);
    const engine = new DepthIndexEngine(indexObj);
    const endLoad = performance.now();
    console.log(`[stress-test] Client decompressed and loaded index into engine in ${(endLoad - startLoad).toFixed(2)}ms`);
    expect(engine.isLoaded()).toBe(true);

    // 6. Simulate 100 Search Queries and measure latency
    const queries = [
      'how to install',
      'setup API configuration options',
      'performance optimizations and service worker',
      'gemini openai credentials',
      'low-end settings and deploy CLI',
      'mock page number 500',
      'mermaid graph TD',
      'compress index file size',
      'write typescript code example',
      'installation instructions'
    ];

    const searchLatencies: number[] = [];
    const runCount = 10; // 10 runs of 10 queries = 100 queries total

    for (let run = 0; run < runCount; run++) {
      queries.forEach(q => {
        const startSearch = performance.now();
        const results = engine.search(q, 5);
        const endSearch = performance.now();
        searchLatencies.push(endSearch - startSearch);
        
        // Assert we get matching results
        expect(results.length).toBeGreaterThan(0);
      });
    }

    const totalSearchTime = searchLatencies.reduce((a, b) => a + b, 0);
    const avgLatency = totalSearchTime / searchLatencies.length;
    console.log(`[stress-test] Executed 100 search queries on 2000 chunks.`);
    console.log(`[stress-test] Average Search Latency: ${avgLatency.toFixed(4)}ms`);
    console.log(`[stress-test] Maximum Search Latency: ${Math.max(...searchLatencies).toFixed(4)}ms`);

    // Performance assertion: Average search latency must be under 50ms on cloud CI runner (1000 pages)
    expect(avgLatency).toBeLessThan(50);
  }, 20000);

});
