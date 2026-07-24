import { ExtractedPage } from '../types/index.js';

export interface SemanticChunk {
  id: string;
  text: string;
  embedding: Float32Array;
  pageUrl: string;
  pageTitle: string;
  section: string;
  type: 'definition' | 'example' | 'instruction' | 'configuration' | 'explanation' | 'reference';
  relatedChunks: string[];  // IDs of semantically related chunks
  keyTerms: string[];
  summary: string;          // One-sentence summary
}

export class SemanticChunker {
  private chunks: SemanticChunk[] = [];
  private termIndex: Map<string, string[]> = new Map(); // term → chunk IDs
  private typeIndex: Map<string, string[]> = new Map();  // type → chunk IDs

  /**
   * Chunk documentation into semantic units.
   * Unlike TF-IDF which treats everything as text,
   * this understands WHAT each chunk IS.
   */
  chunkify(pages: ExtractedPage[]): SemanticChunk[] {
    this.chunks = [];
    this.termIndex.clear();
    this.typeIndex.clear();

    for (const page of pages) {
      for (const section of page.sections || []) {
        const paragraphs = this.splitParagraphs(section.content || '');

        for (const paragraph of paragraphs) {
          const chunk = this.analyzeChunk(paragraph, page, section);
          this.chunks.push(chunk);
          this.indexChunk(chunk);
        }

        // Also chunk code blocks separately
        for (const codeBlock of section.codeBlocks || []) {
          const chunk = this.analyzeCodeChunk(codeBlock, page, section);
          this.chunks.push(chunk);
          this.indexChunk(chunk);
        }
      }
    }

    // Build relationships between chunks
    this.buildRelationships();

    return this.chunks;
  }

  /**
   * Analyze a text chunk to determine its semantic type.
   */
  private analyzeChunk(
    text: string,
    page: ExtractedPage,
    section: any
  ): SemanticChunk {
    const type = this.detectChunkType(text);
    const keyTerms = this.extractKeyTerms(text);
    const summary = this.generateChunkSummary(text, type);

    return {
      id: this.generateId(),
      text: text.trim(),
      embedding: this.generateEmbedding(text),
      pageUrl: page.url,
      pageTitle: page.title,
      section: section.heading || '',
      type,
      relatedChunks: [],
      keyTerms,
      summary,
    };
  }

  /**
   * Detect what TYPE of content this chunk is.
   */
  private detectChunkType(text: string): SemanticChunk['type'] {
    const lower = text.toLowerCase();

    // Instruction: contains steps, commands, or procedural language
    if (
      /\b(first|then|next|finally|step|run|execute|install|create|open|click|navigate|enter|copy|paste)\b/i.test(lower) &&
      /\b(to |how |in order to)\b/i.test(lower)
    ) {
      return 'instruction';
    }

    // Configuration: contains settings, options, parameters
    if (
      /\b(config|configuration|setting|option|parameter|property|env|environment|\.env|\.json|\.yaml|\.toml)\b/i.test(lower) ||
      /^[\w.]+[:=]\s*.+$/m.test(text)
    ) {
      return 'configuration';
    }

    // Example: contains code blocks or demo content
    if (
      /\b(example|sample|demo|usage|try this|here's how|for instance)\b/i.test(lower) ||
      text.includes('```')
    ) {
      return 'example';
    }

    // Definition: explains what something is
    if (
      /\b(is |are |refers to |means |defined as |stands for |a |an )\b/i.test(lower) &&
      text.length < 500
    ) {
      return 'definition';
    }

    // Explanation: detailed explanation of a concept
    if (
      /\b(because|therefore|however|moreover|additionally|in other words|this means|as a result)\b/i.test(lower)
    ) {
      return 'explanation';
    }

    return 'reference';
  }

  /**
   * Extract key terms from chunk text.
   */
  private extractKeyTerms(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'can', 'could', 'should', 'may', 'might', 'must', 'shall',
      'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them',
      'of', 'in', 'to', 'for', 'with', 'on', 'at', 'from', 'by',
      'and', 'but', 'or', 'not', 'no', 'if', 'then', 'else',
      'when', 'where', 'how', 'what', 'which', 'who', 'whom',
    ]);

    const words = text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));

    // Count frequency
    const freq = new Map<string, number>();
    for (const word of words) {
      freq.set(word, (freq.get(word) || 0) + 1);
    }

    // Return top terms
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Generate a one-sentence summary of the chunk.
   */
  private generateChunkSummary(text: string, type: string): string {
    const firstSentence = text.split(/[.!?]+/)[0]?.trim() || '';
    if (firstSentence.length > 10 && firstSentence.length < 200) {
      return firstSentence;
    }
    return text.substring(0, 150).trim() + '...';
  }

  /**
   * Generate lightweight embedding for semantic comparison.
   * Uses sparse TF-IDF-like vectors for speed.
   */
  private generateEmbedding(text: string): Float32Array {
    const terms = this.extractKeyTerms(text);
    const allTerms = new Set<string>();

    // Collect all unique terms across chunks for consistent vector size
    for (const chunk of this.chunks) {
      for (const term of chunk.keyTerms) {
        allTerms.add(term);
      }
    }
    for (const term of terms) {
      allTerms.add(term);
    }

    const termList = Array.from(allTerms);
    const vector = new Float32Array(termList.length);

    for (const term of terms) {
      const idx = termList.indexOf(term);
      if (idx >= 0) {
        // Simple TF weighting
        const count = (text.toLowerCase().match(new RegExp(term, 'g')) || []).length;
        vector[idx] = count / Math.max(1, text.split(/\s+/).length);
      }
    }

    return vector;
  }

  /**
   * Build relationships between chunks.
   */
  private buildRelationships(): void {
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      const related: Array<{ id: string; score: number }> = [];

      for (let j = 0; j < this.chunks.length; j++) {
        if (i === j) continue;

        const other = this.chunks[j];
        const score = this.cosineSimilarity(chunk.embedding, other.embedding);

        if (score > 0.3) {
          related.push({ id: other.id, score });
        }
      }

      // Keep top 5 related chunks
      chunk.relatedChunks = related
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(r => r.id);
    }
  }

  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    const len = Math.min(a.length, b.length);
    let dot = 0, normA = 0, normB = 0;

    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 0.000001);
  }

  private splitParagraphs(text: string): string[] {
    return text
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 20);
  }

  private indexChunk(chunk: SemanticChunk): void {
    // Index by terms
    for (const term of chunk.keyTerms) {
      if (!this.termIndex.has(term)) {
        this.termIndex.set(term, []);
      }
      this.termIndex.get(term)!.push(chunk.id);
    }

    // Index by type
    if (!this.typeIndex.has(chunk.type)) {
      this.typeIndex.set(chunk.type, []);
    }
    this.typeIndex.get(chunk.type)!.push(chunk.id);
  }

  private analyzeCodeChunk(
    codeBlock: any,
    page: ExtractedPage,
    section: any
  ): SemanticChunk {
    const text = `Code example (${codeBlock.language || 'text'}):\n${codeBlock.code}`;

    return {
      id: this.generateId(),
      text,
      embedding: this.generateEmbedding(text),
      pageUrl: page.url,
      pageTitle: page.title,
      section: section.heading || '',
      type: 'example',
      relatedChunks: [],
      keyTerms: this.extractKeyTerms(text),
      summary: `Code example in ${codeBlock.language || 'text'} from ${page.title}`,
    };
  }

  private generateId(): string {
    return `chunk_${Math.random().toString(36).substr(2, 9)}`;
  }

  getChunks(): SemanticChunk[] {
    return this.chunks;
  }

  getChunk(id: string): SemanticChunk | undefined {
    return this.chunks.find(c => c.id === id);
  }

  getChunksByType(type: string): SemanticChunk[] {
    return this.chunks.filter(c => c.type === type);
  }

  getChunksByTerm(term: string): SemanticChunk[] {
    const ids = this.termIndex.get(term.toLowerCase()) || [];
    return ids.map(id => this.getChunk(id)!).filter(Boolean);
  }
}
