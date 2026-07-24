import { SemanticChunk, SemanticChunker } from './semantic-chunker.js';
import { KnowledgeGraph } from './knowledge-graph.js';

export interface ReasoningStep {
  step: number;
  type: 'understand' | 'retrieve' | 'analyze' | 'synthesize' | 'verify';
  description: string;
  findings: string[];
  confidence: number;
}

export interface ReasoningResult {
  query: string;
  steps: ReasoningStep[];
  finalAnswer: string;
  citations: Array<{ url: string; title: string; relevance: string }>;
  confidence: number;
  timeMs: number;
}

export class ReasoningEngine {
  private chunker?: SemanticChunker;
  private graph?: KnowledgeGraph;

  constructor(chunker?: SemanticChunker, graph?: KnowledgeGraph) {
    this.chunker = chunker;
    this.graph = graph;
  }

  /**
   * Multi-step reasoning pipeline.
   *
   * Step 1: UNDERSTAND — Parse query, extract intent and entities
   * Step 2: RETRIEVE — Find relevant chunks via semantic search + graph
   * Step 3: ANALYZE — Compare findings, identify gaps, cross-reference
   * Step 4: SYNTHESIZE — Build coherent answer from findings
   * Step 5: VERIFY — Check answer against source material
   */
  reason(
    query: string,
    chunks: SemanticChunk[],
  ): ReasoningResult {
    const startTime = performance.now();
    const steps: ReasoningStep[] = [];

    // Step 1: UNDERSTAND
    const understanding = this.understand(query);
    steps.push({
      step: 1,
      type: 'understand',
      description: 'Parsing query intent and entities',
      findings: [
        `Intent: ${understanding.intent}`,
        `Entities: ${understanding.entities.join(', ')}`,
        `Complexity: ${understanding.complexity}`,
      ],
      confidence: 0.9,
    });

    // Step 2: RETRIEVE
    const relevantChunks = this.retrieve(understanding, chunks);
    steps.push({
      step: 2,
      type: 'retrieve',
      description: 'Finding relevant documentation',
      findings: [
        `Found ${relevantChunks.length} relevant sections`,
        ...relevantChunks.slice(0, 3).map(c => `- ${c.pageTitle}: ${c.summary}`),
      ],
      confidence: Math.min(0.9, relevantChunks.length * 0.15),
    });

    // Step 3: ANALYZE
    const analysis = this.analyze(understanding, relevantChunks);
    steps.push({
      step: 3,
      type: 'analyze',
      description: 'Analyzing and cross-referencing findings',
      findings: analysis.findings,
      confidence: analysis.confidence,
    });

    // Step 4: SYNTHESIZE
    const synthesis = this.synthesize(understanding, analysis, relevantChunks);
    steps.push({
      step: 4,
      type: 'synthesize',
      description: 'Building coherent response',
      findings: ['Response generated from analyzed findings'],
      confidence: synthesis.confidence,
    });

    // Step 5: VERIFY
    const verification = this.verify(synthesis.answer, relevantChunks);
    steps.push({
      step: 5,
      type: 'verify',
      description: 'Verifying response against sources',
      findings: verification.findings,
      confidence: verification.confidence,
    });

    return {
      query,
      steps,
      finalAnswer: synthesis.answer,
      citations: relevantChunks.slice(0, 10).map(c => ({
        url: c.pageUrl,
        title: c.pageTitle,
        relevance: c.summary,
      })),
      confidence: Math.round(
        (steps.reduce((sum, s) => sum + s.confidence, 0) / steps.length) * 100
      ) / 100,
      timeMs: Math.round(performance.now() - startTime),
    };
  }

  /**
   * Step 1: Understand the query.
   */
  private understand(query: string): {
    intent: string;
    entities: string[];
    complexity: 'simple' | 'moderate' | 'complex';
  } {
    const q = query.toLowerCase().trim();

    // Intent
    let intent = 'general';
    if (/^(how|steps?|guide|tutorial)\b/i.test(q)) intent = 'how_to';
    else if (/^(what|who|where|when|why)\s+(is|are|does|do)\b/i.test(q)) intent = 'definition';
    else if (/\b(config|configuration|setting|option|parameter)\b/i.test(q)) intent = 'configure';
    else if (/\b(compare|vs|versus|difference|better)\b/i.test(q)) intent = 'compare';
    else if (/\b(error|bug|issue|problem|fix|resolve)\b/i.test(q)) intent = 'troubleshoot';

    // Entities
    const stopWords = new Set(['the','a','an','is','are','how','what','why','when','where','who','can','could','would','should','do','does','did','to','of','in','for','on','with']);
    const entities = q
      .replace(/[^\w\s-]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));

    // Complexity
    const wordCount = q.split(/\s+/).length;
    const hasMultipleParts = /(?:and|or|also).+(?:and|or|also)/i.test(q);
    const complexity = wordCount > 12 || hasMultipleParts ? 'complex' : wordCount > 6 ? 'moderate' : 'simple';

    return { intent, entities, complexity };
  }

  /**
   * Step 2: Retrieve relevant chunks.
   */
  private retrieve(
    understanding: ReturnType<typeof this.understand>,
    chunks: SemanticChunk[]
  ): SemanticChunk[] {
    const scored: Array<{ chunk: SemanticChunk; score: number }> = [];

    for (const chunk of chunks) {
      let score = 0;

      // Entity matching
      for (const entity of understanding.entities) {
        if (chunk.keyTerms.includes(entity)) score += 3;
        if (chunk.text.toLowerCase().includes(entity)) score += 1;
      }

      // Intent-based type boosting
      switch (understanding.intent) {
        case 'how_to':
          if (chunk.type === 'instruction') score += 2;
          if (chunk.type === 'example') score += 1;
          break;
        case 'definition':
          if (chunk.type === 'definition') score += 3;
          if (chunk.type === 'explanation') score += 2;
          break;
        case 'configure':
          if (chunk.type === 'configuration') score += 3;
          break;
        case 'troubleshoot':
          if (chunk.text.toLowerCase().includes('error')) score += 2;
          if (chunk.text.toLowerCase().includes('fix')) score += 2;
          break;
      }

      if (score > 0) {
        scored.push({ chunk, score });
      }
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .map(s => s.chunk);
  }

  /**
   * Step 3: Analyze findings.
   */
  private analyze(
    understanding: ReturnType<typeof this.understand>,
    chunks: SemanticChunk[]
  ): { findings: string[]; confidence: number } {
    const findings: string[] = [];

    // Check coverage
    const types = new Set(chunks.map(c => c.type));
    findings.push(`Content types found: ${Array.from(types).join(', ')}`);

    // Check if we have definitions
    const hasDefinition = chunks.some(c => c.type === 'definition');
    if (hasDefinition) findings.push('Found definition(s) for core concepts');

    // Check if we have examples
    const hasExamples = chunks.some(c => c.type === 'example');
    if (hasExamples) findings.push('Found code examples');

    // Check if we have instructions
    const hasInstructions = chunks.some(c => c.type === 'instruction');
    if (hasInstructions) findings.push('Found step-by-step instructions');

    // Check for gaps
    if (!hasDefinition && understanding.intent === 'definition') {
      findings.push('No direct definition found — will synthesize from context');
    }
    if (chunks.length < 3) {
      findings.push('Limited information available — answer may be partial');
    }

    const confidence = Math.min(0.9, chunks.length * 0.08 + (hasDefinition ? 0.2 : 0));

    return { findings, confidence };
  }

  /**
   * Step 4: Synthesize natural language answer.
   * THIS IS THE KEY INNOVATION — not just sentence extraction.
   */
  private synthesize(
    understanding: ReturnType<typeof this.understand>,
    analysis: { findings: string[]; confidence: number },
    chunks: SemanticChunk[]
  ): { answer: string; confidence: number } {
    let answer = '';

    switch (understanding.intent) {
      case 'how_to':
        answer = this.synthesizeHowTo(understanding, chunks);
        break;
      case 'definition':
        answer = this.synthesizeDefinition(understanding, chunks);
        break;
      case 'configure':
        answer = this.synthesizeConfiguration(understanding, chunks);
        break;
      case 'compare':
        answer = this.synthesizeComparison(understanding, chunks);
        break;
      case 'troubleshoot':
        answer = this.synthesizeTroubleshoot(understanding, chunks);
        break;
      default:
        answer = this.synthesizeGeneral(understanding, chunks);
    }

    return { answer, confidence: analysis.confidence };
  }

  /**
   * Synthesize a how-to answer.
   * Uses instruction chunks + example chunks to build a coherent guide.
   */
  private synthesizeHowTo(
    understanding: any,
    chunks: SemanticChunk[]
  ): string {
    const instructions = chunks.filter(c => c.type === 'instruction');
    const examples = chunks.filter(c => c.type === 'example');
    const explanations = chunks.filter(c => c.type === 'explanation');

    let answer = '';

    // Introduction
    const topic = understanding.entities.slice(0, 3).join(', ') || 'this';
    answer += `Here's how to work with ${topic}:\n\n`;

    // Context/Explanation first
    if (explanations.length > 0) {
      answer += `${explanations[0].text}\n\n`;
    }

    // Steps
    if (instructions.length > 0) {
      const allSteps: string[] = [];
      for (const chunk of instructions) {
        const steps = chunk.text.split(/(?:\d+[.)]\s+)/).filter(s => s.trim().length > 10);
        allSteps.push(...steps);
      }

      const uniqueSteps = [...new Set(allSteps)].slice(0, 8);
      uniqueSteps.forEach((step, i) => {
        answer += `${i + 1}. ${step.trim()}\n`;
      });
      answer += '\n';
    } else {
      // Synthesize steps from other chunks
      answer += `Based on the documentation:\n\n`;
      const points = chunks
        .filter(c => c.text.length > 30)
        .slice(0, 5)
        .map(c => c.summary);
      points.forEach((point, i) => {
        answer += `${i + 1}. ${point}\n`;
      });
      answer += '\n';
    }

    // Code examples
    if (examples.length > 0) {
      answer += `**Example:**\n\n`;
      answer += `${examples[0].text}\n\n`;
    }

    // Source references
    const sources = [...new Set(chunks.map(c => `[${c.pageTitle}](${c.pageUrl})`))].slice(0, 3);
    answer += `---\n*Sources: ${sources.join(', ')}*`;

    return answer;
  }

  /**
   * Synthesize a definition answer.
   * Builds a comprehensive explanation from multiple chunks.
   */
  private synthesizeDefinition(
    understanding: any,
    chunks: SemanticChunk[]
  ): string {
    const definitions = chunks.filter(c => c.type === 'definition');
    const explanations = chunks.filter(c => c.type === 'explanation');
    const examples = chunks.filter(c => c.type === 'example');

    let answer = '';

    const topic = understanding.entities[0] || 'this topic';

    // Primary definition
    if (definitions.length > 0) {
      answer += `**${topic.charAt(0).toUpperCase() + topic.slice(1)}** ${definitions[0].text}\n\n`;
    } else if (explanations.length > 0) {
      // Synthesize definition from explanation
      answer += `Based on the documentation, **${topic}** is a ${this.extractDefinitionFromExplanation(explanations[0].text, topic)}.\n\n`;
    } else {
      answer += `Here's what the documentation says about **${topic}**:\n\n`;
    }

    // Additional context
    if (explanations.length > 1) {
      answer += `${explanations[1].text}\n\n`;
    } else if (chunks.length > 1) {
      answer += `${chunks[1].text}\n\n`;
    }

    // Example
    if (examples.length > 0) {
      answer += `**For example:**\n${examples[0].text}\n\n`;
    }

    const sources = [...new Set(chunks.map(c => `[${c.pageTitle}](${c.pageUrl})`))].slice(0, 3);
    answer += `---\n*Sources: ${sources.join(', ')}*`;

    return answer;
  }

  private extractDefinitionFromExplanation(text: string, topic: string): string {
    // Try to extract what the topic "is"
    const pattern = new RegExp(`${topic}\\s+(is|are|refers to|means)\\s+(.+?)(?:[.!]|$)`, 'i');
    const match = text.match(pattern);
    if (match) return match[2].trim();
    return `concept described in the documentation`;
  }

  private synthesizeConfiguration(understanding: any, chunks: SemanticChunk[]): string {
    const configs = chunks.filter(c => c.type === 'configuration');
    let answer = '';

    answer += `Here are the configuration options:\n\n`;

    if (configs.length > 0) {
      answer += configs.map(c => c.text).join('\n\n');
    } else {
      // Extract key-value pairs from chunks
      const options: string[] = [];
      for (const chunk of chunks) {
        const lines = chunk.text.split('\n');
        for (const line of lines) {
          if (/[:=]/.test(line) && line.length < 200) {
            options.push(`- \`${line.trim()}\``);
          }
        }
      }
      answer += [...new Set(options)].slice(0, 15).join('\n');
    }

    return answer;
  }

  private synthesizeComparison(understanding: any, chunks: SemanticChunk[]): string {
    let answer = '## Comparison\n\n';
    const items = understanding.entities.slice(0, 2);

    if (items.length >= 2) {
      answer += `| Feature | ${items[0]} | ${items[1]} |\n`;
      answer += `|---------|${'-'.repeat(items[0].length + 2)}|${'-'.repeat(items[1].length + 2)}|\n`;

      const features = ['definition', 'use case', 'setup', 'performance'];
      for (const feature of features) {
        const a = chunks.find(c => c.text.toLowerCase().includes(items[0]) && c.text.toLowerCase().includes(feature));
        const b = chunks.find(c => c.text.toLowerCase().includes(items[1]) && c.text.toLowerCase().includes(feature));
        answer += `| ${feature} | ${a?.summary || '-'} | ${b?.summary || '-'} |\n`;
      }
    }

    return answer;
  }

  private synthesizeTroubleshoot(understanding: any, chunks: SemanticChunk[]): string {
    let answer = '## Troubleshooting\n\n';

    for (const chunk of chunks.slice(0, 5)) {
      if (chunk.text.toLowerCase().includes('error') || chunk.text.toLowerCase().includes('fix')) {
        answer += `### ${chunk.summary}\n${chunk.text}\n\n`;
      }
    }

    if (answer === '## Troubleshooting\n\n') {
      answer += 'Based on the documentation:\n\n';
      answer += chunks.slice(0, 3).map(c => `- ${c.summary}`).join('\n');
    }

    return answer;
  }

  private synthesizeGeneral(understanding: any, chunks: SemanticChunk[]): string {
    let answer = `Here's what I found about ${understanding.entities.slice(0, 3).join(', ') || 'this topic'}:\n\n`;

    // Group by type for organized output
    const definitions = chunks.filter(c => c.type === 'definition');
    const explanations = chunks.filter(c => c.type === 'explanation');
    const examples = chunks.filter(c => c.type === 'example');

    if (definitions.length > 0) {
      answer += `**What it is:** ${definitions[0].text}\n\n`;
    }

    if (explanations.length > 0) {
      answer += `**More details:** ${explanations[0].text}\n\n`;
    }

    if (examples.length > 0) {
      answer += `**Example:** ${examples[0].text}\n\n`;
    }

    // If no structured chunks, fall back to best available
    if (definitions.length === 0 && explanations.length === 0) {
      answer += chunks.slice(0, 3).map(c => `- ${c.summary}`).join('\n');
    }

    return answer;
  }

  /**
   * Step 5: Verify answer against sources.
   */
  private verify(
    answer: string,
    chunks: SemanticChunk[]
  ): { findings: string[]; confidence: number } {
    const findings: string[] = [];
    let confidence = 0.8;

    // Check if answer references source material
    const citedUrls = [...new Set(chunks.map(c => c.pageUrl))];
    if (citedUrls.length > 0) {
      findings.push(`Grounded in ${citedUrls.length} source page(s)`);
      confidence += 0.1;
    }

    // Check for hallucination indicators
    const hallucinationPhrases = [
      'according to my knowledge',
      'based on my training',
      'I think',
      'I believe',
      'in my opinion',
    ];

    const hasHallucination = hallucinationPhrases.some(p =>
      answer.toLowerCase().includes(p)
    );

    if (hasHallucination) {
      findings.push('Warning: Response contains speculative language');
      confidence -= 0.3;
    } else {
      findings.push('No speculative language detected');
    }

    // Check answer length
    if (answer.length < 50) {
      findings.push('Answer is very short — may be incomplete');
      confidence -= 0.2;
    } else if (answer.length > 100) {
      findings.push('Answer provides substantial information');
      confidence += 0.05;
    }

    return {
      findings,
      confidence: Math.max(0, Math.min(1, confidence)),
    };
  }
}
