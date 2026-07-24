import { describe, it, expect } from 'vitest';
import {
  AnswerSynthesizer,
  KnowledgeGraph,
  SemanticChunker,
  DepthIndexCore,
  HealthAuditor,
  InteractiveSearch,
} from '../src/index.js';
import type { ExtractedPage } from '../src/types/index.js';


const mockPages: ExtractedPage[] = [
  {
    url: '/guide/setup.html',
    title: 'Setup Guide',
    lastModified: Date.now(),
    headings: [{ level: 1, text: 'Setup Guide', id: 'setup' }],
    frontmatter: {},
    sections: [
      {
        heading: 'Setup',
        content: 'First step is to install dependencies. Make sure you install the CLI tools in order to proceed.',
        codeBlocks: [{ language: 'bash', code: 'npm install -g my-cli' }],
        mermaidDiagrams: [],
        links: [],
      },
    ],
  },
  {
    url: '/guide/config.html',
    title: 'Configuration',
    lastModified: Date.now(),
    headings: [{ level: 1, text: 'Configuration', id: 'config' }],
    frontmatter: {},
    sections: [
      {
        heading: 'Configuration Options',
        content: 'After installing Setup Guide, configure setting options in .env file. Also configure advanced options.',
        codeBlocks: [],
        mermaidDiagrams: [],
        links: [],
      },
    ],
  },
];

describe('DepthIndex v1.2.2 — Phase 1: Heuristic NLU Enhancements', () => {
  it('registers and selects heuristic templates based on intent and chunk composition', () => {
    const synthesizer = new AnswerSynthesizer();

    const mockChunks = [
      { type: 'prerequisite', summary: 'Prereq 1', pageUrl: '/page1.html', pageTitle: 'Page 1' },
      { type: 'instruction', summary: 'Step 1', pageUrl: '/page2.html', pageTitle: 'Page 2' },
    ];

    const template = synthesizer.selectHeuristicTemplate('how_to', mockChunks);
    expect(template).not.toBeNull();
    expect(template?.intent).toBe('how_to');
  });
});

describe('DepthIndex v1.2.2 — Phase 2: Cross-Page Knowledge Traversal', () => {
  it('builds cross-page connections between pages', () => {
    const chunker = new SemanticChunker();
    const chunks = chunker.chunkify(mockPages);

    const graph = new KnowledgeGraph();
    graph.build(chunks);

    const connections = graph.buildCrossPageConnections(chunks);
    expect(Array.isArray(connections)).toBe(true);
  });
});

describe('DepthIndex v1.2.2 — Phase 3: Framework-Agnostic Core Engine', () => {
  it('initializes DepthIndexCore and executes ask query', async () => {
    const core = new DepthIndexCore({
      pages: mockPages,
      mode: 'local',
    });

    await core.init();

    const kg = core.getKnowledgeGraph();
    expect(kg).toBeDefined();

    const result = await core.ask('How to setup configuration');
    expect(result).toBeDefined();
    expect(typeof result.answer).toBe('string');
  });
});

describe('DepthIndex v1.2.2 — Phase 4: Documentation Health Audits', () => {
  it('audits documentation and generates a health report', () => {
    const chunker = new SemanticChunker();
    const chunks = chunker.chunkify(mockPages);

    const graph = new KnowledgeGraph();
    graph.build(chunks);

    const auditor = new HealthAuditor();
    const report = auditor.audit(chunks, graph);

    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
    expect(report.totalPages).toBe(2);
    expect(report.totalChunks).toBeGreaterThan(0);
    expect(Array.isArray(report.issues)).toBe(true);
  });
});

describe('DepthIndex v1.2.2 — Phase 5: Interactive Search UI', () => {
  it('executes JavaScript code in interactive search playground safely', () => {
    const search = new InteractiveSearch();
    const output = search.executeCode('console.log("Hello DepthIndex"); return 42;');

    expect(output).toContain('Hello DepthIndex');
  });
});
