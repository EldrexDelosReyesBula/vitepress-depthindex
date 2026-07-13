import { describe, it, expect, vi } from 'vitest';
import { AnswerSynthesizer, SearchResult } from '../src/client/answer-synthesizer.js';

describe('DepthIndex Answer Synthesis Engine', () => {

  const mockResults: SearchResult[] = [
    {
      page: {
        url: '/guide/installation',
        title: 'Installation Guide',
        section: 'Installation'
      },
      snippet: 'To install the plugin, follow these instructions. 1. Run npm install command to download the packages. 2. Configure the plugin options in your config file.',
      score: 0.95,
      fullContent: 'To install the plugin, follow these instructions. 1. Run npm install command to download the packages. 2. Configure the plugin options in your config file.',
      headings: ['Installation'],
      codeBlocks: [
        { language: 'bash', code: 'npm install vitepress-depthindex', context: 'Download package' }
      ]
    },
    {
      page: {
        url: '/guide/config',
        title: 'Configuration Reference',
        section: 'Configuration'
      },
      snippet: 'You can configure the plugin by editing config.ts. apiKey: "YOUR_KEY" # Your cloud provider API key. theme: "auto" # Theme preference.',
      score: 0.85,
      fullContent: 'You can configure the plugin by editing config.ts. apiKey: "YOUR_KEY" # Your cloud provider API key. theme: "auto" # Theme preference.',
      headings: ['Configuration'],
      codeBlocks: []
    }
  ];

  it('should synthesize a How-To answer with steps and code blocks', async () => {
    const synthesizer = new AnswerSynthesizer();
    const result = await synthesizer.synthesize('How do I install the plugin?', mockResults, { mode: 'local' });

    expect(result.source).toBe('local');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.content).toContain('To install the plugin, follow these steps');
    expect(result.content).toContain('Run npm install command to download the packages');
    expect(result.content).toContain('npm install vitepress-depthindex');
    expect(result.citations.length).toBeGreaterThan(0);
    expect(result.relatedTopics.length).toBeGreaterThan(0);
  });

  it('should synthesize a Configuration answer with tables and YAML block', async () => {
    const synthesizer = new AnswerSynthesizer();
    const result = await synthesizer.synthesize('What configuration options are available?', mockResults, { mode: 'local' });

    expect(result.content).toContain('| Option | Value | Description |');
    expect(result.content).toContain('apiKey');
    expect(result.content).toContain('theme: auto');
  });

  it('should guarantee thread safety in concurrent calls', async () => {
    const synthesizer = new AnswerSynthesizer();

    // Call concurrently with different mock results and queries
    const p1 = synthesizer.synthesize('How do I install the plugin?', [mockResults[0]], { mode: 'local' });
    const p2 = synthesizer.synthesize('What configuration options are available?', [mockResults[1]], { mode: 'local' });

    const [r1, r2] = await Promise.all([p1, p2]);

    // Verify that their citations are completely isolated
    expect(r1.citations.length).toBe(1);
    expect(r1.citations[0].url).toBe('/guide/installation');

    expect(r2.citations.length).toBe(1);
    expect(r2.citations[0].url).toBe('/guide/config');
  });

  it('should handle no results gracefully', async () => {
    const synthesizer = new AnswerSynthesizer();
    const result = await synthesizer.synthesize('How to make pizza?', [], { mode: 'local' });

    expect(result.confidence).toBe(0);
    expect(result.content).toContain("I couldn't find specific information");
  });

});
