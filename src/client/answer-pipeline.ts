// src/client/answer-pipeline.ts

import { DepthIndexEngine } from './search-engine.js';
import { AnswerSynthesizer, SearchResult, SynthesizedAnswer } from './answer-synthesizer.js';
import { SafetyGuard, SafetyCheckResult } from './safety-guard.js';

export interface FinalResponse {
  content: string;
  citations: any[];
  confidence: number;
  source: 'local' | 'cloud' | 'safety' | 'fallback' | 'low_quality_fallback' | 'no_results';
  relatedTopics: any[];
}

export class AnswerPipeline {
  private searchEngine: DepthIndexEngine;
  private synthesizer: AnswerSynthesizer;
  private safetyGuard: SafetyGuard;
  private lastGoodResults: any[] = [];
  private consecutiveFailures = 0;
  private maxConsecutiveFailures = 3;
  private conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  constructor(searchEngine: DepthIndexEngine, synthesizer: AnswerSynthesizer) {
    this.searchEngine = searchEngine;
    this.synthesizer = synthesizer;
    this.safetyGuard = new SafetyGuard();
  }

  /**
   * Process query with failure recovery.
   * If search fails, tries fallback strategies instead of returning empty.
   */
  async process(query: string, options?: any): Promise<FinalResponse> {
    // Step 0: Safety check FIRST
    const safetyCheck = this.safetyGuard.check(query);
    if (safetyCheck?.blockQuery) {
      return {
        content: safetyCheck.response,
        citations: [],
        confidence: 1.0,
        source: 'safety',
        relatedTopics: [],
      };
    }

    this.conversationHistory.push({ role: 'user', content: query });

    // Step 1: Try primary search
    let searchEngineResults = this.searchEngine.search(query, 10);
    let results: SearchResult[] = searchEngineResults.map(r => ({
      page: {
        url: r.chunk.url,
        title: r.chunk.pageTitle,
        section: r.chunk.heading,
      },
      snippet: r.chunk.content.substring(0, 300),
      score: r.score,
      fullContent: r.chunk.content,
    }));

    // Step 2: If no results, try fallback strategies
    if (results.length === 0) {
      results = await this.fallbackSearch(query);
    }

    // Step 3: If still no results, use last good context
    if (results.length === 0 && this.lastGoodResults.length > 0) {
      console.log('[DepthIndex] No results found, using conversation context');
      results = await this.contextAwareSearch(query);
    }

    // Step 4: Track failures
    if (results.length === 0) {
      this.consecutiveFailures++;
    } else {
      this.consecutiveFailures = 0;
      this.lastGoodResults = results;
    }

    // Step 5: If too many failures, reset and be honest
    if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
      this.consecutiveFailures = 0;
      return {
        content: `I'm having trouble finding relevant information in the documentation. This might be because:\n\n- The topic isn't covered in these docs\n- The search index needs to be rebuilt\n- The question uses terms not in the documentation\n\nTry:\n- Browsing the documentation sidebar\n- Checking different keywords\n- Asking about a different topic`,
        citations: [],
        confidence: 0,
        source: 'fallback',
        relatedTopics: this.getDefaultTopics(),
      };
    }

    // Step 6: Synthesize answer
    const answer = await this.synthesizer.synthesize(query, results, options);

    // Step 7: Validate answer quality
    if (this.isLowQualityAnswer(answer)) {
      return this.handleLowQuality(query, results);
    }

    this.conversationHistory.push({ role: 'assistant', content: answer.content });

    return {
      content: answer.content,
      citations: answer.citations || [],
      confidence: answer.confidence || 0,
      source: answer.source || 'local',
      relatedTopics: answer.relatedTopics || [],
    };
  }

  /**
   * Fallback search strategies when primary search fails.
   */
  private async fallbackSearch(query: string): Promise<SearchResult[]> {
    // Strategy 1: Broader search (fewer keywords)
    const broadQuery = this.broadenQuery(query);
    let searchEngineResults = this.searchEngine.search(broadQuery, 10);
    let results: SearchResult[] = searchEngineResults.map(r => ({
      page: { url: r.chunk.url, title: r.chunk.pageTitle, section: r.chunk.heading },
      snippet: r.chunk.content.substring(0, 300),
      score: r.score,
      fullContent: r.chunk.content,
    }));
    if (results.length > 0) return results;

    // Strategy 2: Search with individual keywords
    const keywords = query.split(/\s+/).filter(w => w.length > 3);
    for (const keyword of keywords.slice(0, 3)) {
      const kwResults = this.searchEngine.search(keyword, 5);
      if (kwResults.length > 0) {
        return kwResults.map(r => ({
          page: { url: r.chunk.url, title: r.chunk.pageTitle, section: r.chunk.heading },
          snippet: r.chunk.content.substring(0, 300),
          score: r.score,
          fullContent: r.chunk.content,
        }));
      }
    }

    return [];
  }

  /**
   * Context-aware search using conversation history.
   */
  private async contextAwareSearch(query: string): Promise<SearchResult[]> {
    const lastQuery = this.conversationHistory
      .filter(m => m.role === 'user')
      .pop();

    if (lastQuery) {
      const combinedQuery = `${lastQuery.content} ${query}`;
      const searchEngineResults = this.searchEngine.search(combinedQuery, 10);
      return searchEngineResults.map(r => ({
        page: { url: r.chunk.url, title: r.chunk.pageTitle, section: r.chunk.heading },
        snippet: r.chunk.content.substring(0, 300),
        score: r.score,
        fullContent: r.chunk.content,
      }));
    }

    return [];
  }

  /**
   * Check if answer is low quality.
   */
  private isLowQualityAnswer(answer: SynthesizedAnswer): boolean {
    if (!answer || !answer.content || answer.content.length < 30) return true;
    if (answer.content.includes("I couldn't find") && answer.confidence < 0.1) return true;
    if (answer.confidence < 0.1 && (!answer.citations || answer.citations.length === 0)) return true;
    return false;
  }

  /**
   * Handle low quality answers gracefully.
   */
  private handleLowQuality(query: string, results: SearchResult[]): FinalResponse {
    if (results.length > 0) {
      return {
        content: `I found some pages that might be related, but I'm not confident enough to give a direct answer. Here are the most relevant pages:\n\n${results.slice(0, 5).map(r => `- [${r.page.title}](${r.page.url})`).join('\n')}\n\nClick through to see if they contain what you're looking for.`,
        citations: results.slice(0, 5).map(r => ({
          index: 0,
          url: r.page.url,
          title: r.page.title,
        })),
        confidence: 0.3,
        source: 'low_quality_fallback',
        relatedTopics: [],
      };
    }

    return {
      content: `I couldn't find information about "${query.substring(0, 100)}" in the documentation.\n\nTry:\n- Browsing the sidebar for related topics\n- Using different search terms\n- Checking if this topic is covered in a different section`,
      citations: [],
      confidence: 0,
      source: 'no_results',
      relatedTopics: [],
    };
  }

  private broadenQuery(query: string): string {
    return query
      .replace(/^(how|what|why|when|where|who|can|could|would|will|do|does|is|are)\s+(do|does|is|are|can|could|would|will|i|you|we|the|a|an)?\s+/i, '')
      .replace(/\?/g, '')
      .trim();
  }

  private getDefaultTopics(): string[] {
    if (typeof document === 'undefined') return [];
    const sidebarLinks = document.querySelectorAll('.VPSidebarItem .VPLink .text');
    return Array.from(sidebarLinks)
      .map(el => el.textContent?.trim() || '')
      .filter(Boolean)
      .slice(0, 5);
  }
}
