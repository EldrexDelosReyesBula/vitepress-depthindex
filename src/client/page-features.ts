// src/client/page-features.ts

import { DepthIndexEngine } from './search-engine.js';
import { CloudAdapter } from './cloud-adapter.js';

export class PageFeatures {
  private searchEngine: DepthIndexEngine;
  private cloudAdapter: CloudAdapter;
  private getCloudConfig: () => { provider: string; apiKey: string; model: string; personality?: any };

  constructor(
    searchEngine: DepthIndexEngine,
    cloudAdapter: CloudAdapter,
    getCloudConfig: () => { provider: string; apiKey: string; model: string; personality?: any }
  ) {
    this.searchEngine = searchEngine;
    this.cloudAdapter = cloudAdapter;
    this.getCloudConfig = getCloudConfig;
  }

  /**
   * Summarize current page — NOW FORCED to current page content only.
   * NEVER searches other pages for summary.
   */
  async summarizePage(mode: 'local' | 'hybrid' | 'cloud'): Promise<string> {
    const pageTitle = this.extractPageTitle();
    const pageContent = this.extractCurrentPageContent();
    const headings = this.extractCurrentPageHeadings();

    // Verify we have content from THIS page
    if (!pageContent || pageContent.length < 100) {
      return `I couldn't extract enough content from this page to summarize. The page may be too short or still loading.`;
    }

    // Build summary from current page content ONLY
    const sentences = pageContent
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 30 && s.length < 400);

    if (sentences.length === 0) {
      return `This page doesn't contain enough paragraph text to summarize. It may be mostly code or navigation.`;
    }

    // Score sentences by importance within THIS page
    const scored = sentences.map(sentence => ({
      text: sentence,
      score: this.scoreSentenceImportance(sentence, headings),
    }));

    scored.sort((a, b) => b.score - a.score);

    // Build summary
    let summary = `## 📄 Summary: ${pageTitle}\n\n`;

    // Add headings for structure
    if (headings.length > 0) {
      summary += `This page covers ${headings.length} topic(s):\n`;
      headings.slice(0, 8).forEach(h => {
        summary += `- ${h}\n`;
      });
      summary += '\n';
    }

    // Add key points from THIS page only
    summary += `**Key Points:**\n`;
    const topSentences = scored.slice(0, 5);
    topSentences.forEach(s => {
      summary += `- ${s.text}.\n`;
    });

    // Cloud/Hybrid can enhance but ONLY with current page content
    if (mode === 'cloud' || mode === 'hybrid') {
      try {
        const enhanced = await this.enhanceSummaryWithAI(pageTitle, pageContent, headings);
        if (enhanced && enhanced.length > summary.length * 0.5) {
          summary = enhanced;
        }
      } catch {
        // Keep local summary on failure
      }
    }

    return summary;
  }

  /**
   * Discuss current page — Hybrid/Cloud only.
   */
  async discussPage(query: string, mode: 'local' | 'hybrid' | 'cloud'): Promise<string> {
    if (mode === 'local') {
      return "Page discussion requires Hybrid or Cloud mode. Switch modes in Settings to enable this feature.";
    }

    const pageContent = this.extractCurrentPageContent();
    const pageTitle = this.extractPageTitle();

    const relatedPages = await this.searchEngine.search(query, 5);
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const crossPageContext = relatedPages
      .filter(p => p.chunk.url !== currentPath)
      .slice(0, 3);

    let context = `CURRENT PAGE: ${pageTitle}\n${pageContent.substring(0, 2000)}\n\n`;

    if (crossPageContext.length > 0) {
      context += `RELATED PAGES:\n`;
      crossPageContext.forEach(p => {
        context += `- ${p.chunk.pageTitle}: ${p.chunk.content.substring(0, 300)}\n`;
      });
    }

    const prompt = `The user is discussing "${query}" in the context of the page "${pageTitle}". ` +
      `Use the current page content and related pages to provide a comprehensive answer. ` +
      `Cite sources when referencing other pages.\n\n${context}`;

    try {
      const cfg = this.getCloudConfig();
      const response = await this.cloudAdapter.query(prompt, {
        provider: cfg.provider as any,
        apiKey: cfg.apiKey,
        model: cfg.model,
        messages: [],
        personality: cfg.personality
      });
      return response.content;
    } catch {
      return "Unable to process this discussion. Please try again.";
    }
  }

  /**
   * Extract content from CURRENT PAGE DOM only.
   * Uses specific selectors to avoid pulling sidebar/nav content.
   */
  private extractCurrentPageContent(): string {
    if (typeof document === 'undefined') return '';

    const selectors = [
      '.VPContent .vp-doc',
      '.VPContent main',
      '.content-container',
      'article',
      'main',
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent && el.textContent.trim().length > 100) {
        const clone = el.cloneNode(true) as HTMLElement;

        // Remove code blocks
        clone.querySelectorAll('pre, code, .code-block, [class*="code"]').forEach(e => e.remove());

        // Remove tables
        clone.querySelectorAll('table').forEach(e => e.remove());

        // Remove navigation elements
        clone.querySelectorAll('nav, .nav, .sidebar, .toc, .table-of-contents').forEach(e => e.remove());

        return clone.textContent?.trim() || '';
      }
    }

    return '';
  }

  /**
   * Extract headings from CURRENT PAGE only.
   */
  private extractCurrentPageHeadings(): string[] {
    if (typeof document === 'undefined') return [];

    const selectors = [
      '.VPContent .vp-doc h2',
      '.VPContent .vp-doc h3',
      'article h2',
      'article h3',
      'main h2',
      'main h3',
    ];

    for (const selector of selectors) {
      const headings = document.querySelectorAll(selector);
      if (headings.length > 0) {
        return Array.from(headings)
          .map(h => h.textContent?.trim() || '')
          .filter(Boolean);
      }
    }

    return [];
  }

  /**
   * Extract page title from CURRENT PAGE only.
   */
  private extractPageTitle(): string {
    if (typeof document === 'undefined') return 'Current Page';

    const h1 = document.querySelector('.VPContent h1, article h1, main h1');
    if (h1?.textContent) return h1.textContent.trim();

    return document.title?.split(/[|–—]/)[0]?.trim() || 'Current Page';
  }

  /**
   * Score sentence importance based on position in page and heading relevance.
   */
  private scoreSentenceImportance(sentence: string, headings: string[]): number {
    let score = 1;

    for (const heading of headings) {
      const headingWords = heading.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      for (const word of headingWords) {
        if (sentence.toLowerCase().includes(word)) {
          score += 2;
        }
      }
    }

    const technicalTerms = [
      'configure', 'install', 'setup', 'deploy', 'build',
      'function', 'method', 'class', 'interface', 'api',
      'config', 'option', 'parameter', 'return', 'default',
    ];

    for (const term of technicalTerms) {
      if (sentence.toLowerCase().includes(term)) {
        score += 1;
      }
    }

    const words = sentence.split(/\s+/).length;
    if (words < 5) score -= 2;
    if (words > 60) score -= 1;

    return score;
  }

  /**
   * Enhance summary with AI using ONLY current page content.
   */
  private async enhanceSummaryWithAI(
    title: string,
    content: string,
    headings: string[]
  ): Promise<string | null> {
    const prompt = `Summarize the following documentation page. Use ONLY the content provided. Do NOT add information from other sources.

PAGE TITLE: ${title}
HEADINGS: ${headings.join(', ')}
CONTENT: ${content.substring(0, 4000)}

INSTRUCTIONS:
1. Summarize ONLY this page
2. Include the main headings
3. List 3-5 key points
4. Keep it under 500 words
5. Do NOT reference other pages
6. Format in clean Markdown`;

    try {
      const cfg = this.getCloudConfig();
      const response = await this.cloudAdapter.query(prompt, {
        provider: cfg.provider as any,
        apiKey: cfg.apiKey,
        model: cfg.model,
        messages: [],
        personality: cfg.personality
      });

      return response.content;
    } catch {
      return null;
    }
  }
}
