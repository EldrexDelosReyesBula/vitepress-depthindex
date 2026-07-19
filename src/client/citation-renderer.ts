// src/client/citation-renderer.ts

export interface Citation {
  index: number;
  url: string;
  title: string;
  section?: string;
  snippet?: string;
}

export class CitationRenderer {
  
  /**
   * Render inline citations as hyperlinked superscript badges.
   * Only called when citations exist.
   */
  renderInline(text: string, citations: Citation[]): string {
    if (citations.length === 0) return text;
    
    // Supports both [^1] and [^1,2,3] style citations
    return text.replace(
      /\[\^(\d+(?:,\d+)*)\]/g,
      (_, nums: string) => {
        const indices = nums.split(',').map(Number);
        return indices.map(i => {
          const cite = citations.find(c => c.index === i);
          if (!cite) return '';
          return `<sup><a href="#cite-${i}" class="di-cite" title="${this.escapeAttr(cite.title)}">${i}</a></sup>`;
        }).join('');
      }
    );
  }
  
  /**
   * Render references section.
   * Only called when citations exist.
   */
  renderReferences(citations: Citation[]): string {
    if (citations.length === 0) return '';
    
    // Deduplicate by URL
    const unique = new Map<string, Citation>();
    for (const c of citations) {
      if (!unique.has(c.url)) unique.set(c.url, c);
    }
    
    let html = '<div class="di-references"><div class="di-references-title">References</div><ol class="di-references-list">';
    
    for (const cite of unique.values()) {
      html += `<li id="cite-${cite.index}" class="di-ref-item">`;
      html += `<a href="${this.escapeAttr(cite.url)}" target="_blank" rel="noopener noreferrer" class="di-ref-link">${this.escapeHtml(cite.title)}</a>`;
      if (cite.section) {
        html += ` <span class="di-ref-section">→ ${this.escapeHtml(cite.section)}</span>`;
      }
      html += `</li>`;
    }
    
    html += '</ol></div>';
    return html;
  }
  
  private escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  
  private escapeAttr(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
}
