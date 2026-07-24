import { ExtractedPage, PageChunk } from '../types/index.js';
import { DepthIndexEngine } from '../client/search-engine.js';
import { AnswerSynthesizer, SynthesizedAnswer, Citation } from '../client/answer-synthesizer.js';
import { KnowledgeGraph } from '../experimental/knowledge-graph.js';
import { SemanticChunker } from '../experimental/semantic-chunker.js';
import { buildSearchIndex } from '../build/embedder.js';

export interface DepthIndexCoreConfig {
  /** Documentation pages to index */
  pages: ExtractedPage[];
  /** Search mode */
  mode?: 'local' | 'hybrid' | 'cloud';
  /** UI container selector (optional, for auto-mount) */
  container?: string;
  /** Cloud AI configuration */
  cloud?: any;
  /** Language */
  language?: string;
}

export class DepthIndexCore {
  private config: DepthIndexCoreConfig;
  private searchEngine: DepthIndexEngine;
  private synthesizer: AnswerSynthesizer;
  private knowledgeGraph: KnowledgeGraph;
  private chunker: SemanticChunker;

  constructor(config: DepthIndexCoreConfig) {
    this.config = {
      mode: 'local',
      language: 'en',
      ...config,
    };
    this.searchEngine = new DepthIndexEngine();
    this.synthesizer = new AnswerSynthesizer();
    this.knowledgeGraph = new KnowledgeGraph();
    this.chunker = new SemanticChunker();
  }

  /**
   * Initialize the core engine.
   * This is what each framework adapter calls.
   */
  async init(): Promise<void> {
    const chunks = this.chunker.chunkify(this.config.pages || []);
    this.knowledgeGraph.build(chunks);

    const pageChunks: PageChunk[] = chunks.map(c => ({
      id: c.id,
      url: c.pageUrl,
      pageTitle: c.pageTitle,
      heading: c.section,
      content: c.text,
      codeBlocks: [],
      mermaidDiagrams: [],
      links: [],
    }));

    const searchIndex = buildSearchIndex(pageChunks);
    this.searchEngine.setIndex(searchIndex);


    console.log(`[DepthIndex Core] Initialized with ${chunks.length} chunks`);
  }

  /**
   * Search and synthesize — main API.
   * Framework adapters call this when users ask questions.
   */
  async ask(query: string): Promise<{
    answer: string;
    citations: Citation[];
    confidence: number;
    relatedTopics: string[];
  }> {
    const results = typeof this.searchEngine.search === 'function'
      ? this.searchEngine.search(query, 10)
      : [];

    const synthesized: SynthesizedAnswer = await this.synthesizer.synthesize(query, results as any);

    const related = Array.isArray(synthesized.relatedTopics)
      ? synthesized.relatedTopics.map(t => (typeof t === 'string' ? t : t.title))
      : [];

    return {
      answer: synthesized.content,
      citations: synthesized.citations,
      confidence: synthesized.confidence,
      relatedTopics: related,
    };
  }

  /**
   * Get the knowledge graph instance.
   */
  getKnowledgeGraph(): KnowledgeGraph {
    return this.knowledgeGraph;
  }

  /**
   * Mount UI to a container element.
   * Framework adapters can use this or build their own UI.
   */
  mountUI(container: HTMLElement | string): void {
    if (typeof document === 'undefined') return;
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (target) {
      target.setAttribute('data-depthindex-mounted', 'true');
    }
  }
}
