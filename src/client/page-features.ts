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
   * Summarize current page — works in all modes.
   * Extracts headings + key sentences locally.
   */
  async summarizePage(mode: 'local' | 'hybrid' | 'cloud'): Promise<string> {
    const pageContent = this.extractPageContent();
    const headings = this.extractHeadings();
    const keySentences = this.extractKeySentences(pageContent);
    
    let summary = `## Summary: ${document.title.split('|')[0].trim()}\n\n`;
    summary += `This page covers:\n`;
    headings.slice(0, 8).forEach(h => { summary += `- ${h}\n`; });
    summary += `\n**Key Points:**\n`;
    keySentences.slice(0, 5).forEach(s => { summary += `- ${s}\n`; });
    
    // Cloud/Hybrid can enhance
    if (mode === 'cloud' || mode === 'hybrid') {
      try {
        const enhanced = await this.enhanceWithAI(`Summarize this page concisely:\n\n${pageContent}`);
        if (enhanced) summary = enhanced;
      } catch {}
    }
    
    return summary;
  }
  
  /**
   * Discuss current page — Hybrid/Cloud only.
   * Allows cross-page context pulling.
   */
  async discussPage(query: string, mode: 'local' | 'hybrid' | 'cloud'): Promise<string> {
    // Local mode: cannot discuss
    if (mode === 'local') {
      return "Page discussion requires Hybrid or Cloud mode. Switch modes in Settings to enable this feature.";
    }
    
    const pageContent = this.extractPageContent();
    const pageTitle = document.title.split('|')[0].trim();
    
    // Search across all pages for related context
    const relatedPages = await this.searchEngine.search(query, 5);
    const crossPageContext = relatedPages
      .filter(p => p.chunk.url !== window.location.pathname)
      .slice(0, 3);
    
    // Build context-aware prompt
    let context = `CURRENT PAGE: ${pageTitle}\n${pageContent.substring(0, 2000)}\n\n`;
    
    if (crossPageContext.length > 0) {
      context += `RELATED PAGES:\n`;
      crossPageContext.forEach(p => {
        context += `- ${p.chunk.pageTitle}: ${p.chunk.content.substring(0, 300)}\n`;
      });
    }
    
    return await this.enhanceWithAI(
      `The user is discussing "${query}" in the context of the page "${pageTitle}". ` +
      `Use the current page content and related pages to provide a comprehensive answer. ` +
      `Cite sources when referencing other pages.\n\n${context}`
    ) || "Unable to process this discussion. Please try again.";
  }
  
  private extractPageContent(): string {
    const main = document.querySelector('.VPContent, main, article')?.cloneNode(true) as HTMLElement | null;
    if (!main) return '';
    
    // Strip code blocks, tables, diagrams, and formatting elements to keep summaries clean
    main.querySelectorAll('pre, code, table, .mermaid-container, .di-inline-answer, script, style, noscript, svg').forEach(el => el.remove());
    
    return main.textContent?.trim() || '';
  }
  
  private extractHeadings(): string[] {
    return Array.from(document.querySelectorAll('.VPContent h2, .VPContent h3, main h2, main h3'))
      .map(h => h.textContent?.trim() || '')
      .filter(Boolean);
  }
  
  private extractKeySentences(content: string): string[] {
    return content.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 40 && s.length < 300)
      .slice(0, 10);
  }
  
  private async enhanceWithAI(prompt: string): Promise<string | null> {
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
