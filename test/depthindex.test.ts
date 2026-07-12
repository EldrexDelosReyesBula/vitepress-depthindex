import { describe, it, expect } from 'vitest';
import { tokenizeAndStem } from '../src/utils/tokenizer.js';
import { chunkPage } from '../src/build/chunker.js';
import { buildSearchIndex } from '../src/build/embedder.js';
import { DepthIndexEngine } from '../src/client/search-engine.js';
import { compressIndex, decompressIndex } from '../src/utils/compression.js';
import { ExtractedPage } from '../src/types/index.js';

describe('VitePress DepthIndex Tests', () => {
  
  it('NLP Tokenizer & Stemmer', () => {
    const text = 'The quick brown foxes are jumping over the lazy dogs!';
    const tokens = tokenizeAndStem(text);
    
    // Fox should stem to fox, dogs to dog.
    expect(tokens).toContain('fox');
    expect(tokens).toContain('dog');
    expect(tokens).toContain('quick');
    expect(tokens).toContain('jump');
    
    // Stopwords like 'the', 'are', 'over' should be removed
    expect(tokens).not.toContain('the');
    expect(tokens).not.toContain('are');
  });

  it('Smart Chunker (logical sections & overlaps)', () => {
    const page: ExtractedPage = {
      url: '/guide/introduction.html',
      title: 'Introduction Guide',
      lastModified: Date.now(),
      headings: [
        { level: 1, text: 'Introduction Guide', id: 'introduction-guide' },
        { level: 2, text: 'Section One', id: 'section-one' }
      ],
      frontmatter: {},
      sections: [
        {
          heading: 'Section One',
          content: 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen',
          codeBlocks: [{ language: 'js', code: 'console.log(1);' }],
          mermaidDiagrams: [],
          links: []
        }
      ]
    };

    // Split with chunkSize=5 words and overlapSize=2 words
    const chunks = chunkPage(page, 5, 2);
    
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].content).toBe('one two three four five');
    // Overlap should capture last two words of first chunk: 'four five'
    expect(chunks[1].content.startsWith('four five')).toBe(true);
    expect(chunks[0].codeBlocks?.[0].language).toBe('js');
  });

  it('Index Generator & Search Engine', () => {
    const mockChunks = [
      {
        id: '/index.html#welcome',
        url: '/index.html',
        pageTitle: 'Home Page',
        heading: 'Welcome',
        content: 'This is the welcome screen of the main application. You can setup and install it here.',
        codeBlocks: [],
        mermaidDiagrams: [],
        links: []
      },
      {
        id: '/api.html#config',
        url: '/api.html',
        pageTitle: 'API Reference',
        heading: 'Configuration Options',
        content: 'Here you can configure all options for development and production build. Set error levels.',
        codeBlocks: [],
        mermaidDiagrams: [],
        links: []
      }
    ];

    const index = buildSearchIndex(mockChunks);
    
    expect(index.vocabulary.length).toBeGreaterThan(0);
    expect(index.chunks.length).toBe(2);

    const engine = new DepthIndexEngine(index);
    
    // Keyword match test (BM25)
    const resSetup = engine.search('setup welcome');
    expect(resSetup[0].chunk.pageTitle).toBe('Home Page');

    // Synonym expansion & TF-IDF match test
    const resConfig = engine.search('settings config');
    expect(resConfig[0].chunk.pageTitle).toBe('API Reference');
  });

  it('Index Compression / Decompression', () => {
    const sampleObj = { hello: 'world', data: 'Hello World! '.repeat(100) };
    const jsonStr = JSON.stringify(sampleObj);
    
    const compressed = compressIndex(jsonStr);
    expect(typeof compressed).toBe('string');
    expect(compressed.length).toBeLessThan(jsonStr.length); // usually smaller for larger structures

    const decompressed = decompressIndex(compressed);
    const parsed = JSON.parse(decompressed);
    expect(parsed.hello).toBe('world');
  });

});
