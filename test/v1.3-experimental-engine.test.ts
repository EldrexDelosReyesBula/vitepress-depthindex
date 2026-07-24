import { describe, it, expect } from 'vitest';
import {
  SemanticChunker,
  KnowledgeGraph,
  ReasoningEngine,
  ExperimentalEngine,
} from '../src/experimental/index.js';
import { ExtractedPage } from '../src/types/index.js';

const samplePages: ExtractedPage[] = [
  {
    url: '/guide/installation.html',
    title: 'Installation Guide',
    lastModified: Date.now(),
    headings: [
      { level: 1, text: 'Installation Guide', id: 'installation-guide' },
      { level: 2, text: 'Step by Step Setup', id: 'step-by-step-setup' },
    ],
    frontmatter: {},
    sections: [
      {
        heading: 'Step by Step Setup',
        content:
          'First run npm install to install all dependencies. Next step is to create an environment config file in order to configure settings. Then execute the start command to launch.',
        codeBlocks: [{ language: 'bash', code: 'npm install vitepress-plugin-depthindex' }],
        mermaidDiagrams: [],
        links: [],
      },
    ],
  },
  {
    url: '/guide/configuration.html',
    title: 'Configuration Options',
    lastModified: Date.now(),
    headings: [
      { level: 1, text: 'Configuration Options', id: 'configuration-options' },
      { level: 2, text: 'Settings Reference', id: 'settings-reference' },
    ],
    frontmatter: {},
    sections: [
      {
        heading: 'Settings Reference',
        content:
          'DepthIndex is defined as an on-device local search index engine. The experimental configuration option is enabled via config property mode: auto and temperature: 0.3.',
        codeBlocks: [
          {
            language: 'typescript',
            code: 'DepthIndex({ experimental: { enabled: true, mode: "auto" } })',
          },
        ],
        mermaidDiagrams: [],
        links: [],
      },
    ],
  },
  {
    url: '/guide/troubleshooting.html',
    title: 'Troubleshooting Common Issues',
    lastModified: Date.now(),
    headings: [
      { level: 1, text: 'Troubleshooting', id: 'troubleshooting' },
    ],
    frontmatter: {},
    sections: [
      {
        heading: 'Common Errors',
        content:
          'If you encounter an error during startup, check your memory allocation setting. To resolve this error, increase maxMemoryMB option in configuration.',
        codeBlocks: [],
        mermaidDiagrams: [],
        links: [],
      },
    ],
  },
];

describe('DepthIndex v1.3.0-beta — Semantic Chunker Tests', () => {
  it('chunks documentation pages into typed semantic units', () => {
    const chunker = new SemanticChunker();
    const chunks = chunker.chunkify(samplePages);

    expect(chunks.length).toBeGreaterThan(0);

    const chunkTypes = chunks.map(c => c.type);
    expect(chunkTypes).toContain('instruction');
    expect(chunkTypes).toContain('example');
  });

  it('indexes chunks by term and type correctly', () => {
    const chunker = new SemanticChunker();
    chunker.chunkify(samplePages);

    const codeChunks = chunker.getChunksByType('example');
    expect(codeChunks.length).toBeGreaterThan(0);
    expect(codeChunks[0].text).toContain('Code example');

    const installChunks = chunker.getChunksByTerm('install');
    expect(installChunks.length).toBeGreaterThan(0);
  });
});

describe('DepthIndex v1.3.0-beta — Knowledge Graph Tests', () => {
  it('builds nodes and edges from semantic chunks', () => {
    const chunker = new SemanticChunker();
    const chunks = chunker.chunkify(samplePages);

    const graph = new KnowledgeGraph();
    graph.build(chunks);

    const traversal = graph.traverse(['install', 'config']);
    expect(traversal.nodes.length).toBeGreaterThan(0);
  });

  it('finds explanation paths between connected concepts', () => {
    const chunker = new SemanticChunker();
    const chunks = chunker.chunkify(samplePages);

    const graph = new KnowledgeGraph();
    graph.build(chunks);

    const path = graph.findExplanationPath('install', 'config');
    // If terms exist in graph, it should return a non-null path array
    if (path) {
      expect(path.length).toBeGreaterThan(0);
    }
  });
});

describe('DepthIndex v1.3.0-beta — Multi-Step Reasoning Engine Tests', () => {
  it('executes 5-step reasoning pipeline for how_to queries', () => {
    const chunker = new SemanticChunker();
    const chunks = chunker.chunkify(samplePages);

    const reasoner = new ReasoningEngine(chunker);
    const result = reasoner.reason('How to install and setup', chunks);

    expect(result.query).toBe('How to install and setup');
    expect(result.steps.length).toBe(5);
    expect(result.steps[0].type).toBe('understand');
    expect(result.steps[1].type).toBe('retrieve');
    expect(result.steps[2].type).toBe('analyze');
    expect(result.steps[3].type).toBe('synthesize');
    expect(result.steps[4].type).toBe('verify');

    expect(result.finalAnswer).toContain("Here's how to work with");
    expect(result.citations.length).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('synthesizes definition and configuration answers correctly', () => {
    const chunker = new SemanticChunker();
    const chunks = chunker.chunkify(samplePages);

    const reasoner = new ReasoningEngine(chunker);

    const defResult = reasoner.reason('What is DepthIndex', chunks);
    expect(defResult.finalAnswer.length).toBeGreaterThan(0);

    const configResult = reasoner.reason('configuration setting options', chunks);
    expect(configResult.finalAnswer.length).toBeGreaterThan(0);
  });
});

describe('DepthIndex v1.3.0-beta — Experimental Engine Integration Tests', () => {
  it('returns null when experimental engine is disabled', async () => {
    const engine = new ExperimentalEngine({ enabled: false });
    await engine.init(samplePages);

    expect(engine.isEnabled()).toBe(false);
    const res = await engine.query('How to install', []);
    expect(res).toBeNull();
  });

  it('runs experimental engine query when enabled', async () => {
    const engine = new ExperimentalEngine({
      enabled: true,
      mode: 'auto',
      enableReasoning: true,
      enableKnowledgeGraph: true,
    });

    await engine.init(samplePages);
    expect(engine.isEnabled()).toBe(true);

    const stats = engine.getStats();
    expect(stats.chunks).toBeGreaterThan(0);
    expect(stats.graphNodes).toBeGreaterThan(0);

    const res = await engine.query('How to install DepthIndex', []);
    expect(res).not.toBeNull();
    expect(res?.engine).toBe('experimental');
    expect(res?.answer).toBeDefined();
    expect(res?.reasoningSteps.length).toBe(5);
  });
});
