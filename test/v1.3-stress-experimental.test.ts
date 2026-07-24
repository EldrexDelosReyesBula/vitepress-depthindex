import { describe, it, expect } from 'vitest';
import {
  SemanticChunker,
  KnowledgeGraph,
  ReasoningEngine,
  HealthAuditor,
  ExtractedPage,
} from '../src/index.js';

function generateMockPage(id: number): ExtractedPage {
  return {
    url: `/docs/guide-${id}.html`,
    title: `Guide Page ${id}`,
    lastModified: Date.now(),
    headings: [
      { level: 1, text: `Guide Page ${id}`, id: `guide-page-${id}` },
      { level: 2, text: `Section Setup ${id}`, id: `section-setup-${id}` },
    ],
    frontmatter: {},
    sections: [
      {
        heading: `Section Setup ${id}`,
        content: `First run step ${id} to install dependencies in order to configure settings. Defined as a local search index engine.`,
        codeBlocks: [
          { language: 'typescript', code: `const config = { pageId: ${id} };` },
        ],
        mermaidDiagrams: [],
        links: [
          { text: `Link ${id - 1}`, url: `/docs/guide-${Math.max(1, id - 1)}.html`, internal: true },
        ],
      },
    ],
  };
}

describe('VitePress DepthIndex v1.3.0 — Experimental Engine Stress Testing', () => {
  it('Benchmarking 500 Pages Semantic Chunking, Knowledge Graph & Reasoning Latency', () => {
    const pageCount = 500;
    const pages: ExtractedPage[] = [];

    // 1. Generate pages
    const startGen = performance.now();
    for (let i = 1; i <= pageCount; i++) {
      pages.push(generateMockPage(i));
    }
    const endGen = performance.now();
    console.log(`[stress-experimental] Generated ${pageCount} pages in ${(endGen - startGen).toFixed(2)}ms`);

    // 2. Semantic Chunker Stress
    const startChunk = performance.now();
    const chunker = new SemanticChunker();
    const chunks = chunker.chunkify(pages);
    const endChunk = performance.now();
    console.log(`[stress-experimental] Generated ${chunks.length} semantic chunks in ${(endChunk - startChunk).toFixed(2)}ms`);
    expect(chunks.length).toBeGreaterThanOrEqual(pageCount);

    // 3. Knowledge Graph Stress
    const startGraph = performance.now();
    const graph = new KnowledgeGraph();
    graph.build(chunks);
    const connections = graph.buildCrossPageConnections(chunks);
    const endGraph = performance.now();
    console.log(`[stress-experimental] Built graph with ${connections.length} cross-page connections in ${(endGraph - startGraph).toFixed(2)}ms`);

    // 4. Reasoning Engine Stress (50 queries)
    const reasoner = new ReasoningEngine(chunker, graph);
    const queryTimes: number[] = [];

    for (let i = 0; i < 50; i++) {
      const qStart = performance.now();
      const res = reasoner.reason(`How to install and setup guide ${i % 20 + 1}`, chunks);
      queryTimes.push(performance.now() - qStart);
      expect(res.steps.length).toBe(5);
    }

    const avgQueryTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;
    const maxQueryTime = Math.max(...queryTimes);
    console.log(`[stress-experimental] Executed 50 Reasoning NLU Queries: Avg=${avgQueryTime.toFixed(2)}ms, Max=${maxQueryTime.toFixed(2)}ms`);
    expect(avgQueryTime).toBeLessThan(100);

    // 5. Health Auditor Stress
    const startAudit = performance.now();
    const auditor = new HealthAuditor();
    const report = auditor.audit(chunks, graph);
    const endAudit = performance.now();
    console.log(`[stress-experimental] Health audit score: ${report.score}/100 in ${(endAudit - startAudit).toFixed(2)}ms`);
    expect(report.score).toBeGreaterThan(0);
  });
});
