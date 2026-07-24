import { ExtractedPage, ExperimentalConfig, SearchResult } from '../types/index.js';
import { SemanticChunker } from './semantic-chunker.js';
import { KnowledgeGraph } from './knowledge-graph.js';
import { ReasoningEngine, ReasoningStep } from './reasoning-engine.js';

export interface ExperimentalResult {
  answer: string;
  citations: Array<{ url: string; title: string; relevance: string }>;
  confidence: number;
  reasoningSteps: ReasoningStep[];
  timeMs: number;
  engine: 'experimental';
}

export class ExperimentalEngine {
  private chunker: SemanticChunker;
  private graph: KnowledgeGraph;
  private reasoner: ReasoningEngine;
  private enabled: boolean;
  private config: ExperimentalConfig;

  constructor(config: ExperimentalConfig = {}) {
    this.config = {
      enabled: false,
      mode: 'auto',
      modelSize: 'small',
      maxResponseTokens: 512,
      temperature: 0.3,
      enableReasoning: true,
      enableKnowledgeGraph: true,
      ...config,
    };

    this.enabled = this.config.enabled!;
    this.chunker = new SemanticChunker();
    this.graph = new KnowledgeGraph();
    this.reasoner = new ReasoningEngine(this.chunker, this.graph);
  }

  /**
   * Initialize the experimental engine.
   * Builds semantic chunks and knowledge graph at startup.
   */
  async init(pages: ExtractedPage[]): Promise<void> {
    if (!this.enabled) return;

    console.log('[DepthIndex Experimental] Initializing local intelligence engine...');
    const startTime = performance.now();

    // Build semantic chunks
    const chunks = this.chunker.chunkify(pages);
    console.log(`[DepthIndex Experimental] Built ${chunks.length} semantic chunks`);

    // Build knowledge graph
    if (this.config.enableKnowledgeGraph) {
      this.graph.build(chunks);
      console.log(`[DepthIndex Experimental] Built knowledge graph with ${(this.graph as any)['nodes'].size} nodes`);
    }

    const duration = Math.round(performance.now() - startTime);
    console.log(`[DepthIndex Experimental] Initialized in ${duration}ms`);
  }

  /**
   * Process a query using the experimental engine.
   * Falls back to standard engine if experimental is disabled.
   */
  async query(
    userQuery: string,
    standardResults: SearchResult[],
  ): Promise<ExperimentalResult | null> {
    if (!this.enabled) return null;

    try {
      const chunks = this.chunker.getChunks();

      if (chunks.length === 0) {
        return null; // Fall back to standard
      }

      const result = this.reasoner.reason(userQuery, chunks);

      return {
        answer: result.finalAnswer,
        citations: result.citations,
        confidence: result.confidence,
        reasoningSteps: result.steps,
        timeMs: result.timeMs,
        engine: 'experimental',
      };
    } catch (error) {
      console.warn('[DepthIndex Experimental] Query failed, falling back to standard:', error);
      return null;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getStats(): { chunks: number; graphNodes: number; graphEdges: number } {
    return {
      chunks: this.chunker.getChunks().length,
      graphNodes: (this.graph as any)['nodes']?.size || 0,
      graphEdges: (this.graph as any)['edges']?.length || 0,
    };
  }
}
