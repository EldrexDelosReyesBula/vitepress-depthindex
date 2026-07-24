import { SemanticChunk } from '../experimental/semantic-chunker.js';
import { KnowledgeGraph } from '../experimental/knowledge-graph.js';

export interface HealthIssue {
  severity: 'error' | 'warning' | 'info';
  page: string;
  message: string;
  suggestion: string;
}

export type HealthWarning = HealthIssue;

export interface HealthReport {
  score: number;           // 0-100
  totalPages: number;
  totalChunks: number;
  issues: HealthIssue[];
  warnings: HealthWarning[];
  suggestions: string[];
  crossPageConnections: number;
  orphanedPages: string[];
  missingCodeExamples: string[];
  contradictorySections: Array<{ pageA: string; pageB: string; topic: string }>;
}

export class HealthAuditor {
  private graph?: KnowledgeGraph;
  private chunks: SemanticChunk[] = [];

  /**
   * Run a full health audit on the documentation.
   * Returns actionable report for developers.
   */
  audit(chunks: SemanticChunk[], graph?: KnowledgeGraph): HealthReport {
    this.chunks = chunks;
    this.graph = graph;

    const issues: HealthIssue[] = [];

    // Check 1: Orphaned pages
    const orphaned = this.findOrphanedPages();
    if (orphaned.length > 0) {
      issues.push({
        severity: 'warning',
        page: orphaned[0],
        message: `${orphaned.length} page(s) have no incoming connections`,
        suggestion: 'Add links from other pages or remove if unnecessary',
      });
    }

    // Check 2: Missing code examples
    const missingCode = this.findMissingCodeExamples();
    if (missingCode.length > 0) {
      issues.push({
        severity: 'info',
        page: missingCode[0],
        message: `${missingCode.length} page(s) mention code concepts without examples`,
        suggestion: 'Add code blocks to improve developer experience',
      });
    }

    // Check 3: Contradictory information
    const contradictions = this.findContradictions();
    if (contradictions.length > 0) {
      issues.push({
        severity: 'warning',
        page: contradictions[0].pageA,
        message: `${contradictions.length} potential contradiction(s) found`,
        suggestion: 'Review and align documentation',
      });
    }

    // Check 4: Empty headings
    const emptyHeadings = this.findEmptyHeadings();
    if (emptyHeadings.length > 0) {
      issues.push({
        severity: 'error',
        page: emptyHeadings[0],
        message: `${emptyHeadings.length} empty heading(s) found`,
        suggestion: 'Add content under headings or remove them',
      });
    }

    // Calculate score
    const score = this.calculateScore(issues, chunks.length);
    const crossConnections = graph ? graph.buildCrossPageConnections(chunks).length : 0;

    return {
      score,
      totalPages: new Set(chunks.map(c => c.pageUrl)).size,
      totalChunks: chunks.length,
      issues,
      warnings: issues.filter(i => i.severity === 'warning'),
      suggestions: issues.map(i => i.suggestion),
      crossPageConnections: crossConnections,
      orphanedPages: orphaned,
      missingCodeExamples: missingCode,
      contradictorySections: contradictions,
    };
  }

  private findOrphanedPages(): string[] {
    const pages = new Map<string, number>();

    for (const chunk of this.chunks) {
      if (!pages.has(chunk.pageUrl)) pages.set(chunk.pageUrl, 0);

      const links = chunk.text.match(/\[([^\]]+)\]\((\/[^)]+)\)/g) || [];
      for (const link of links) {
        const url = link.match(/\(([^)]+)\)/)?.[1];
        if (url && pages.has(url)) {
          pages.set(url, (pages.get(url) || 0) + 1);
        }
      }
    }

    return Array.from(pages.entries())
      .filter(([_, count]) => count === 0)
      .map(([page]) => page);
  }

  private findMissingCodeExamples(): string[] {
    const codePhrases = ['function', 'method', 'api', 'endpoint', 'class', 'interface'];

    return this.chunks
      .filter(c => {
        const hasCodeMention = codePhrases.some(p => c.text.toLowerCase().includes(p));
        const hasCodeBlock = c.text.includes('```');
        return hasCodeMention && !hasCodeBlock;
      })
      .map(c => c.pageUrl)
      .filter((url, i, arr) => arr.indexOf(url) === i);
  }

  private findContradictions(): Array<{ pageA: string; pageB: string; topic: string }> {
    const contradictions: Array<{ pageA: string; pageB: string; topic: string }> = [];

    const byTerm = new Map<string, SemanticChunk[]>();
    for (const chunk of this.chunks) {
      for (const term of chunk.keyTerms) {
        if (!byTerm.has(term)) byTerm.set(term, []);
        byTerm.get(term)!.push(chunk);
      }
    }

    for (const [term, termChunks] of byTerm) {
      if (termChunks.length < 2) continue;

      for (let i = 0; i < termChunks.length; i++) {
        for (let j = i + 1; j < termChunks.length; j++) {
          const a = termChunks[i];
          const b = termChunks[j];

          if (a.pageUrl === b.pageUrl) continue;

          const isContradictory =
            (a.text.includes('must') && b.text.includes('should not')) ||
            (a.text.includes('always') && b.text.includes('never')) ||
            (a.text.includes('required') && b.text.includes('optional'));

          if (isContradictory) {
            contradictions.push({
              pageA: a.pageUrl,
              pageB: b.pageUrl,
              topic: term,
            });
          }
        }
      }
    }

    return contradictions;
  }

  private findEmptyHeadings(): string[] {
    const emptyHeadings: string[] = [];
    const headingPattern = /^#{1,6}\s+(.+)$/gm;

    for (const chunk of this.chunks) {
      const headings = chunk.text.match(headingPattern);
      if (headings) {
        const lines = chunk.text.split('\n');
        for (let i = 0; i < lines.length - 1; i++) {
          if (/^#{1,6}\s+/.test(lines[i]) && /^#{1,6}\s+/.test(lines[i + 1])) {
            emptyHeadings.push(`${chunk.pageUrl}#${lines[i].replace(/^#+\s+/, '')}`);
          }
        }
      }
    }

    return emptyHeadings;
  }

  private calculateScore(issues: HealthIssue[], totalChunks: number): number {
    let score = 100;

    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const infoCount = issues.filter(i => i.severity === 'info').length;

    score -= errorCount * 10;
    score -= warningCount * 5;
    score -= infoCount * 2;

    if (totalChunks > 100) score += 5;
    if (totalChunks > 500) score += 5;

    return Math.max(0, Math.min(100, score));
  }
}
