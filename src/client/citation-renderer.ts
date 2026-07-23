// src/client/citation-renderer.ts

import { CitationConfig, ReferenceConfig } from '../types/index.js';

export interface Citation {
  index: number;
  url: string;
  title: string;
  section?: string;
  snippet?: string;
}

export class CitationRenderer {
  private citationConfig: CitationConfig;
  private referenceConfig: ReferenceConfig;

  constructor(config: { citations?: CitationConfig; references?: ReferenceConfig } = {}) {
    this.citationConfig = {
      showInlineCitations: true,
      showReferencesSection: false,
      style: 'superscript',
      maxInlineCitations: 10,
      ...config.citations,
    };

    this.referenceConfig = {
      enabled: false,
      style: 'list',
      showTitle: true,
      maxReferences: 10,
      ...config.references,
    };
  }

  /**
   * Render citations in answer text.
   */
  renderCitations(text: string, citations: Citation[]): string {
    if (!this.citationConfig.showInlineCitations) return text;
    if (!citations || citations.length === 0) return text;

    const max = this.citationConfig.maxInlineCitations || 10;
    const limited = citations.slice(0, max);

    switch (this.citationConfig.style) {
      case 'superscript':
        return this.renderSuperscript(text, limited);
      case 'inline':
        return this.renderInline(text, limited);
      case 'underline':
        return this.renderUnderline(text, limited);
      default:
        return this.renderSuperscript(text, limited);
    }
  }

  /**
   * Superscript style: text¹²³
   */
  private renderSuperscript(text: string, citations: Citation[]): string {
    return text.replace(
      /\[\^(\d+(?:,\d+)*)\]/g,
      (_, nums: string) => {
        const indices = nums.split(',').map(Number);
        return indices.map(i => {
          const cite = citations.find(c => c.index === i);
          if (!cite) return '';
          return `<sup><a href="${this.escapeAttr(cite.url)}" class="di-cite di-cite-sup" title="${this.escapeAttr(cite.title)}">${i}</a></sup>`;
        }).join('');
      }
    );
  }

  /**
   * Inline style: text [1] [2] [3]
   */
  renderInline(text: string, citations: Citation[]): string {
    return text.replace(
      /\[\^(\d+(?:,\d+)*)\]/g,
      (_, nums: string) => {
        const indices = nums.split(',').map(Number);
        return indices.map(i => {
          const cite = citations.find(c => c.index === i);
          if (!cite) return '';
          return `<a href="${this.escapeAttr(cite.url)}" class="di-cite di-cite-inline" title="${this.escapeAttr(cite.title)}">[${i}]</a>`;
        }).join('');
      }
    );
  }

  /**
   * Underline style: text with underlined links to sources
   */
  private renderUnderline(text: string, citations: Citation[]): string {
    let result = text.replace(
      /\[\^(\d+)\]/g,
      (_, num: string) => {
        const cite = citations.find(c => c.index === parseInt(num));
        if (!cite) return '';
        return `<a href="${this.escapeAttr(cite.url)}" class="di-cite di-cite-underline" title="${this.escapeAttr(cite.title)}" target="_blank">${this.escapeHtml(cite.title)}</a>`;
      }
    );
    return result;
  }

  /**
   * Render references section (if enabled).
   */
  renderReferences(citations: Citation[]): string {
    if (!this.referenceConfig.enabled && !this.citationConfig.showReferencesSection) return '';
    if (!citations || citations.length === 0) return '';

    const max = this.referenceConfig.maxReferences || 10;
    const unique = this.deduplicate(citations).slice(0, max);

    switch (this.referenceConfig.style) {
      case 'list':
        return this.renderReferenceList(unique);
      case 'pills':
        return this.renderReferencePills(unique);
      case 'inline':
        return '';
      default:
        return this.renderReferenceList(unique);
    }
  }

  /**
   * List style references.
   */
  private renderReferenceList(citations: Citation[]): string {
    const title = this.referenceConfig.showTitle !== false
      ? `<div class="di-ref-title">${this.referenceConfig.title || 'References'}</div>`
      : '';

    let html = `<div class="di-references di-ref-list">${title}<ol class="di-ref-ol">`;

    for (const cite of citations) {
      html += `<li id="cite-${cite.index}" class="di-ref-li">`;
      html += `<a href="${this.escapeAttr(cite.url)}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(cite.title)}</a>`;
      if (cite.section) {
        html += ` <span class="di-ref-section">→ ${this.escapeHtml(cite.section)}</span>`;
      }
      if (this.referenceConfig.showSnippet && cite.snippet) {
        html += `<span class="di-ref-snippet">${this.escapeHtml(cite.snippet.substring(0, 150))}</span>`;
      }
      html += '</li>';
    }

    html += '</ol></div>';
    return html;
  }

  /**
   * Pill style references.
   */
  private renderReferencePills(citations: Citation[]): string {
    const title = this.referenceConfig.showTitle !== false
      ? `<div class="di-ref-title">${this.referenceConfig.title || 'References'}</div>`
      : '';

    let html = `<div class="di-references di-ref-pills">${title}<div class="di-ref-pills-container">`;

    for (const cite of citations) {
      html += `<a href="${this.escapeAttr(cite.url)}" class="di-ref-pill" target="_blank" rel="noopener noreferrer" title="${this.escapeAttr(cite.title)}">`;
      html += `<span class="di-ref-pill-num">${cite.index}</span>`;
      html += `<span class="di-ref-pill-title">${this.escapeHtml(cite.title)}</span>`;
      html += '</a>';
    }

    html += '</div></div>';
    return html;
  }

  private deduplicate(citations: Citation[]): Citation[] {
    const seen = new Map<string, Citation>();
    for (const c of citations) {
      const key = c.url + (c.section || '');
      if (!seen.has(key)) seen.set(key, c);
    }
    return Array.from(seen.values());
  }

  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private escapeAttr(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
}
