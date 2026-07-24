import { SemanticChunk } from './semantic-chunker.js';

export interface GraphNode {
  id: string;
  label: string;
  type: 'concept' | 'page' | 'section' | 'term' | 'example';
  chunkIds: string[];
  properties: Record<string, string>;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: 'explains' | 'references' | 'depends_on' | 'example_of' | 'configures' | 'related_to';
  weight: number;
}

export class KnowledgeGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: GraphEdge[] = [];

  /**
   * Build knowledge graph from semantic chunks.
   */
  build(chunks: SemanticChunk[]): void {
    this.nodes.clear();
    this.edges = [];

    // Create nodes from chunks
    for (const chunk of chunks) {
      // Concept node from key terms
      for (const term of chunk.keyTerms) {
        const nodeId = `term:${term}`;
        if (!this.nodes.has(nodeId)) {
          this.nodes.set(nodeId, {
            id: nodeId,
            label: term,
            type: 'term',
            chunkIds: [chunk.id],
            properties: {},
          });
        } else {
          this.nodes.get(nodeId)!.chunkIds.push(chunk.id);
        }
      }

      // Page node
      const pageId = `page:${chunk.pageUrl}`;
      if (!this.nodes.has(pageId)) {
        this.nodes.set(pageId, {
          id: pageId,
          label: chunk.pageTitle,
          type: 'page',
          chunkIds: [chunk.id],
          properties: { url: chunk.pageUrl },
        });
      } else {
        this.nodes.get(pageId)!.chunkIds.push(chunk.id);
      }

      // Section node
      if (chunk.section) {
        const sectionId = `section:${chunk.pageUrl}#${chunk.section}`;
        if (!this.nodes.has(sectionId)) {
          this.nodes.set(sectionId, {
            id: sectionId,
            label: chunk.section,
            type: 'section',
            chunkIds: [chunk.id],
            properties: { url: chunk.pageUrl },
          });
        } else {
          this.nodes.get(sectionId)!.chunkIds.push(chunk.id);
        }
      }
    }

    // Create edges from relationships
    for (const chunk of chunks) {
      // Connect chunks to their terms
      for (const term of chunk.keyTerms) {
        this.edges.push({
          source: chunk.id,
          target: `term:${term}`,
          relation: 'references',
          weight: 1.0,
        });
      }

      // Connect to page
      this.edges.push({
        source: chunk.id,
        target: `page:${chunk.pageUrl}`,
        relation: 'references',
        weight: 0.5,
      });

      // Connect related chunks
      for (const relatedId of chunk.relatedChunks) {
        this.edges.push({
          source: chunk.id,
          target: relatedId,
          relation: 'related_to',
          weight: 0.7,
        });
      }
    }
  }

  /**
   * Traverse graph from a set of starting nodes.
   * Returns relevant nodes and their relationships.
   */
  traverse(
    startTerms: string[],
    maxDepth: number = 3,
    maxNodes: number = 50
  ): { nodes: GraphNode[]; paths: string[][] } {
    const visited = new Set<string>();
    const queue: Array<{ id: string; depth: number; path: string[] }> = [];
    const resultNodes: GraphNode[] = [];

    // Start from matching terms
    for (const term of startTerms) {
      const nodeId = `term:${term}`;
      if (this.nodes.has(nodeId)) {
        queue.push({ id: nodeId, depth: 0, path: [nodeId] });
      }
    }

    while (queue.length > 0 && resultNodes.length < maxNodes) {
      const { id, depth, path } = queue.shift()!;

      if (visited.has(id)) continue;
      if (depth > maxDepth) continue;

      visited.add(id);

      const node = this.nodes.get(id);
      if (node) {
        resultNodes.push(node);
      }

      // Follow edges
      const outgoingEdges = this.edges.filter(e => e.source === id);
      for (const edge of outgoingEdges) {
        if (!visited.has(edge.target)) {
          queue.push({
            id: edge.target,
            depth: depth + 1,
            path: [...path, edge.target],
          });
        }
      }

      // Also follow incoming edges (reverse)
      const incomingEdges = this.edges.filter(e => e.target === id);
      for (const edge of incomingEdges) {
        if (!visited.has(edge.source)) {
          queue.push({
            id: edge.source,
            depth: depth + 1,
            path: [...path, edge.source],
          });
        }
      }
    }

    return {
      nodes: resultNodes,
      paths: [],
    };
  }

  /**
   * Find the best explanation path between concepts.
   */
  findExplanationPath(from: string, to: string): string[] | null {
    // BFS to find shortest path
    const visited = new Set<string>();
    const queue: Array<{ id: string; path: string[] }> = [];

    const startId = `term:${from}`;
    const endId = `term:${to}`;

    if (!this.nodes.has(startId) || !this.nodes.has(endId)) {
      return null;
    }

    queue.push({ id: startId, path: [startId] });

    while (queue.length > 0) {
      const { id, path } = queue.shift()!;

      if (id === endId) return path;

      if (visited.has(id)) continue;
      visited.add(id);

      const edges = [
        ...this.edges.filter(e => e.source === id),
        ...this.edges.filter(e => e.target === id),
      ];

      for (const edge of edges) {
        const nextId = edge.source === id ? edge.target : edge.source;
        if (!visited.has(nextId)) {
          queue.push({ id: nextId, path: [...path, nextId] });
        }
      }
    }

    return null;
  }

  /**
   * Build cross-page connections by analyzing content relationships.
   */
  buildCrossPageConnections(chunks: SemanticChunk[]): CrossPageConnection[] {
    const connections: CrossPageConnection[] = [];
    const pages = new Map<string, SemanticChunk[]>();

    // Group chunks by page
    for (const chunk of chunks) {
      if (!pages.has(chunk.pageUrl)) pages.set(chunk.pageUrl, []);
      pages.get(chunk.pageUrl)!.push(chunk);
    }

    const pageUrls = Array.from(pages.keys());

    // Find connections between pages
    for (let i = 0; i < pageUrls.length; i++) {
      for (let j = i + 1; j < pageUrls.length; j++) {
        const pageA = pageUrls[i];
        const pageB = pageUrls[j];
        const chunksA = pages.get(pageA)!;
        const chunksB = pages.get(pageB)!;

        // Check if Page A is a prerequisite for Page B
        if (this.isPrerequisite(chunksA, chunksB)) {
          connections.push({
            source: pageA,
            target: pageB,
            relation: 'prerequisite',
            confidence: 0.8,
            evidence: this.findPrerequisiteEvidence(chunksA, chunksB),
          });
        }

        // Check if Page B configures what Page A installs
        if (this.isConfiguration(chunksA, chunksB)) {
          connections.push({
            source: pageA,
            target: pageB,
            relation: 'configures',
            confidence: 0.75,
            evidence: this.findConfigEvidence(chunksA, chunksB),
          });
        }

        // Check if Page B extends Page A's concept
        if (this.isExtension(chunksA, chunksB)) {
          connections.push({
            source: pageA,
            target: pageB,
            relation: 'extends',
            confidence: 0.7,
            evidence: this.findExtensionEvidence(chunksA, chunksB),
          });
        }
      }
    }

    return connections;
  }

  private isPrerequisite(chunksA: SemanticChunk[], chunksB: SemanticChunk[]): boolean {
    const prereqPhrases = [
      'after installing', 'once you have', 'prerequisite',
      'before you begin', 'make sure you', 'ensure you have',
      'requires', 'depends on',
    ];

    const textB = chunksB.map(c => c.text).join(' ').toLowerCase();
    const titleA = chunksA[0]?.pageTitle?.toLowerCase() || '';

    for (const phrase of prereqPhrases) {
      if (titleA) {
        const pattern = new RegExp(`${phrase}.*${this.escapeRegex(titleA)}`, 'i');
        if (pattern.test(textB)) return true;
      }
    }

    const linksToA = chunksB.some(c =>
      c.text.includes(chunksA[0]?.pageUrl || '')
    );

    return linksToA;
  }

  private isConfiguration(chunksA: SemanticChunk[], chunksB: SemanticChunk[]): boolean {
    const textB = chunksB.map(c => c.text).join(' ').toLowerCase();
    const configPhrases = ['configure', 'config', 'setting', 'option', 'parameter', '.env'];

    return configPhrases.some(p => textB.includes(p)) &&
           chunksA.some(c => c.type === 'instruction');
  }

  private isExtension(chunksA: SemanticChunk[], chunksB: SemanticChunk[]): boolean {
    const termsA = new Set(chunksA.flatMap(c => c.keyTerms));
    const termsB = new Set(chunksB.flatMap(c => c.keyTerms));

    const sharedTerms = [...termsA].filter(t => termsB.has(t));
    const extensionPhrases = ['additional', 'also', 'further', 'more', 'advanced', 'next'];

    const textB = chunksB.map(c => c.text).join(' ').toLowerCase();

    return sharedTerms.length >= 3 && extensionPhrases.some(p => textB.includes(p));
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private findPrerequisiteEvidence(chunksA: SemanticChunk[], chunksB: SemanticChunk[]): string {
    return `"${chunksB[0]?.pageTitle}" requires "${chunksA[0]?.pageTitle}" to be completed first`;
  }

  private findConfigEvidence(chunksA: SemanticChunk[], chunksB: SemanticChunk[]): string {
    return `"${chunksB[0]?.pageTitle}" configures what is set up in "${chunksA[0]?.pageTitle}"`;
  }

  private findExtensionEvidence(chunksA: SemanticChunk[], chunksB: SemanticChunk[]): string {
    return `"${chunksB[0]?.pageTitle}" extends concepts from "${chunksA[0]?.pageTitle}"`;
  }
}

export interface CrossPageConnection {
  source: string;
  target: string;
  relation: 'prerequisite' | 'extends' | 'configures' | 'troubleshoots' | 'references';
  confidence: number;
  evidence: string;
}

