import { DepthIndexEngine } from './search-engine.js';

export class PageContextProvider {
  private currentPageContent: string | null = null;
  private currentPageUrl: string | null = null;
  private pageSections: Map<string, string> = new Map();
  private searchEngine: DepthIndexEngine;

  constructor(searchEngine: DepthIndexEngine) {
    this.searchEngine = searchEngine;
    if (typeof window !== 'undefined') {
      this.detectCurrentPage();
      this.watchPageChanges();
    }
  }

  private detectCurrentPage(): void {
    if (typeof window === 'undefined') return;

    this.currentPageUrl = window.location.pathname;

    const mainContent = document.querySelector('.vp-doc') || 
                        document.querySelector('main') ||
                        document.querySelector('article');

    if (mainContent) {
      this.currentPageContent = mainContent.textContent || '';

      this.pageSections.clear();
      const headings = mainContent.querySelectorAll('h1, h2, h3');
      headings.forEach((heading, index) => {
        const sectionId = heading.id || `section-${index}`;
        let sectionContent = '';
        let nextElement = heading.nextElementSibling;

        while (nextElement && !nextElement.matches('h1, h2, h3')) {
          sectionContent += (nextElement.textContent || '') + '\n';
          nextElement = nextElement.nextElementSibling;
        }

        this.pageSections.set(sectionId, sectionContent);
      });
    }
  }

  private watchPageChanges(): void {
    if (typeof window === 'undefined') return;

    const observer = new MutationObserver(() => {
      const newUrl = window.location.pathname;
      if (newUrl !== this.currentPageUrl) {
        this.currentPageUrl = newUrl;
        this.detectCurrentPage();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    window.addEventListener('popstate', () => {
      this.detectCurrentPage();
    });
  }

  getPageContext(): {
    url: string;
    title: string;
    content: string;
    sections: Map<string, string>;
  } | null {
    if (typeof window === 'undefined' || !this.currentPageContent) return null;

    const title = document.querySelector('h1')?.textContent || 
                  document.title || 
                  'Current Page';

    return {
      url: this.currentPageUrl || '',
      title,
      content: this.currentPageContent,
      sections: this.pageSections,
    };
  }

  async summarizePage(): Promise<string> {
    const context = this.getPageContext();
    if (!context) return "I couldn't detect the current page content.";

    const sentences = context.content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);

    const scoredSentences = sentences.map(sentence => ({
      text: sentence,
      score: this.scoreSentence(sentence),
    }));

    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.text);

    const headings = Array.from(document.querySelectorAll('.vp-doc h2, .vp-doc h3, main h2, main h3'))
      .map(h => h.textContent?.trim())
      .filter(Boolean);

    let summary = `## 📄 Summary: ${context.title}\n\n`;
    if (headings.length > 0) {
      summary += `This page covers ${headings.length} main topics:\n\n` +
        headings.slice(0, 8).map((h, i) => `${i + 1}. **${h}**`).join('\n') + '\n\n';
    }

    summary += `### Key Points:\n`;
    if (topSentences.length > 0) {
      summary += topSentences.map(s => `• ${s}.`).join('\n') + '\n';
    } else {
      summary += `• No detailed key points could be extracted.\n`;
    }

    summary += `\n---\n*Want to discuss any section in detail? Ask a follow-up question!*`;
    return summary;
  }

  async discussPage(topic: string): Promise<string> {
    const context = this.getPageContext();
    if (!context) return "I couldn't detect the current page content.";

    const relevantSections: string[] = [];
    for (const [sectionId, content] of this.pageSections) {
      if (content.toLowerCase().includes(topic.toLowerCase())) {
        const headingEl = document.getElementById(sectionId);
        const headingText = headingEl?.textContent?.trim() || 'Section';
        relevantSections.push(`**${headingText}**:\n${content.substring(0, 300)}...`);
      }
    }

    const searchResults = this.searchEngine.search(`${topic} ${context.title}`, 3);

    let response = `## 💬 Discussing "${topic}" on **${context.title}**\n\n`;

    if (relevantSections.length > 0) {
      response += `### Relevant content on this page:\n\n` + relevantSections.join('\n\n') + `\n\n`;
    } else {
      response += `I didn't find direct references to "${topic}" on this page, but here are related topics in the documentation:\n\n`;
    }

    if (searchResults.length > 0) {
      response += `### Related reference matches:\n`;
      searchResults.forEach(r => {
        response += `• [${r.chunk.pageTitle} > ${r.chunk.heading}](${r.chunk.url}) — ${r.chunk.content.substring(0, 120)}...\n`;
      });
    }

    return response;
  }

  private scoreSentence(sentence: string): number {
    let score = 0;

    const headings = Array.from(document.querySelectorAll('h2, h3'))
      .map(h => h.textContent?.toLowerCase());

    for (const heading of headings) {
      if (heading && sentence.toLowerCase().includes(heading)) {
        score += 3;
      }
    }

    if (/\b(function|class|import|export|const|let|var|return|async|await|install|config)\b/.test(sentence)) {
      score += 2;
    }

    const words = sentence.split(/\s+/).length;
    if (words > 10 && words < 50) score += 1;

    return score;
  }
}
