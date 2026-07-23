// src/client/confidence-scorer.ts

import { SearchResult } from './answer-synthesizer.js';

export class ConfidenceScorer {
  
  /**
   * Calculate accurate confidence score.
   * No more 80% confidence on wrong answers.
   */
  calculate(results: SearchResult[], query: string, content: string): number {
    if (!results || results.length === 0) return 0;
    if (!content) return 0;

    let score = 0;
    const maxScore = 100;

    // 1. Result relevance (0-40 points)
    const avgRelevance = results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length;
    score += Math.min(avgRelevance * 40, 40);

    // 2. Query term matches in content (0-25 points)
    const queryTerms = this.extractTerms(query);
    const contentLower = content.toLowerCase();
    let termMatches = 0;

    for (const term of queryTerms) {
      if (contentLower.includes(term)) {
        termMatches++;
      }
    }

    const termMatchRatio = queryTerms.length > 0 
      ? termMatches / queryTerms.length 
      : 0;
    score += termMatchRatio * 25;

    // 3. Result diversity (0-15 points)
    const uniqueUrls = new Set(results.map(r => r.page?.url || '')).size;
    const diversityRatio = Math.min(uniqueUrls / 3, 1);
    score += diversityRatio * 15;

    // 4. Content quality (0-20 points)
    if (content.length > 100) score += 10;
    if (content.length > 300) score += 5;
    if (!content.includes("I couldn't find")) score += 5;

    // 5. Penalty for vague responses
    if (content.includes("I couldn't find")) score -= 30;
    if (content.includes("limited information")) score -= 15;
    if (content.includes("not covered")) score -= 20;
    if (content.includes("try rephrasing")) score -= 10;

    // 6. Penalty for hallucination indicators
    if (content.includes("according to my knowledge")) score -= 40;
    if (content.includes("based on my training")) score -= 40;
    if (content.includes("I think")) score -= 20;
    if (content.includes("I believe")) score -= 20;

    // Clamp
    score = Math.max(0, Math.min(score, maxScore));

    return Math.round(score) / 100;
  }

  private extractTerms(query: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'how', 'what', 'why', 'when', 'where', 'who', 'can', 'could',
      'do', 'does', 'did', 'will', 'would', 'i', 'you', 'we', 'they',
      'to', 'of', 'in', 'for', 'on', 'with', 'at', 'from', 'by',
    ]);

    return (query || '').toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
  }
}
