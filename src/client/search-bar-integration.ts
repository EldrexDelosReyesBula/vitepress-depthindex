import { SearchBarConfig, SearchResult } from '../types/index.js';
import { DepthIndexEngine } from './search-engine.js';
import { AnswerSynthesizer, Citation } from './answer-synthesizer.js';
import { ContentRenderer } from './renderers.js';

/**
 * SearchBarIntegration — enhances the VitePress search modal with inline AI answers.
 *
 * IMPORTANT: This class ONLY injects into the search MODAL (VPLocalSearchBox / DocSearch-Modal),
 * never into the persistent navbar search button. No badge is injected into the nav.
 *
 * Mandatory branding: a "Powered by DepthIndex" attribution is appended to the modal footer.
 */
export class SearchBarIntegration {
  private config: SearchBarConfig;
  private searchEngine: DepthIndexEngine;
  private synthesizer: AnswerSynthesizer;
  private renderer: ContentRenderer;
  private modalEl: HTMLElement | null = null;
  private aiAnswerContainer: HTMLElement | null = null;
  private domObserver: MutationObserver | null = null;
  private queryObserver: MutationObserver | null = null;
  private inputListener: (() => void) | null = null;
  private debounceTimer: any = null;

  // Only target actual search MODALS, never the persistent navbar search button
  private readonly MODAL_SELECTORS = [
    '.VPLocalSearchBox',     // VitePress built-in local search modal
    '.DocSearch-Modal',       // Algolia DocSearch modal
    '.local-search-box',      // legacy/custom class
    '#local-search',          // fallback ID selector
  ];

  constructor(config: SearchBarConfig, engine: DepthIndexEngine) {
    this.config = {
      enabled: true,
      position: 'top',
      maxAnswerLength: 500,
      showExpandButton: true,
      placeholder: 'Ask AI or search docs...',
      shortcut: '⌘K',
      ...config,
    };
    this.searchEngine = engine;
    this.synthesizer = new AnswerSynthesizer();
    this.renderer = new ContentRenderer();
  }

  /**
   * Initialize — watch for the search modal opening via MutationObserver.
   * No DOM manipulation happens until the user actually opens search.
   */
  async init(): Promise<void> {
    if (!this.config.enabled) return;

    // Watch document.body for modal mount/unmount
    this.domObserver = new MutationObserver(() => {
      this.checkForModal();
    });
    this.domObserver.observe(document.body, { childList: true, subtree: false });

    // Check immediately in case modal is already open
    this.checkForModal();

    console.log('[DepthIndex] Search bar integration initialized');
  }

  /**
   * Check if a search modal has appeared or disappeared
   */
  private checkForModal(): void {
    for (const selector of this.MODAL_SELECTORS) {
      const modal = document.querySelector(selector) as HTMLElement | null;
      if (modal && modal !== this.modalEl) {
        this.modalEl = modal;
        this.onModalOpen(modal);
        return;
      }
    }

    // Modal was removed from DOM — clean up
    if (this.modalEl && !document.body.contains(this.modalEl)) {
      this.onModalClose();
    }
  }

  /**
   * Called when search modal opens — enhance input, inject branding, watch queries
   */
  private onModalOpen(modal: HTMLElement): void {
    // Enhance the input placeholder
    const input = modal.querySelector('input') as HTMLInputElement | null;
    if (input) {
      input.placeholder = this.config.placeholder || 'Ask AI or search docs...';
    }

    // Inject mandatory "Powered by DepthIndex" branding into modal footer
    this.injectBranding(modal);

    // Set up query watching for inline AI answers
    this.setupQueryWatcher(modal, input);
  }

  /**
   * Called when search modal closes — clean everything up
   */
  private onModalClose(): void {
    this.cleanupQueryWatcher();
    this.removeAIAnswer();
    this.modalEl = null;
  }

  /**
   * Inject mandatory "Powered by DepthIndex" attribution into the modal.
   * This is required branding — devs cannot disable it.
   */
  private injectBranding(modal: HTMLElement): void {
    const existing = modal.querySelector('.di-powered-by');
    if (existing) existing.remove();

    const footer = document.createElement('div');
    footer.className = 'di-powered-by';
    footer.setAttribute('aria-label', 'Powered by DepthIndex AI search');
    footer.innerHTML = `
      <svg class="di-powered-by-icon" viewBox="0 0 24 24" fill="currentColor" width="11" height="11" aria-hidden="true">
        <path d="M12 2L14.85 9.15L22 12L14.85 14.85L12 22L9.15 14.85L2 12L9.15 9.15L12 2Z"/>
      </svg>
      Powered by
      <a href="https://depthindex.vercel.app/" target="_blank" rel="noopener noreferrer" class="di-powered-by-link">
        DepthIndex
      </a>
    `;
    modal.appendChild(footer);
  }

  /**
   * Watch search input for queries and generate inline AI answers
   */
  private setupQueryWatcher(modal: HTMLElement, input: HTMLInputElement | null): void {
    if (!input) return;

    this.inputListener = () => {
      clearTimeout(this.debounceTimer);
      const query = input.value.trim();
      if (query.length < 3) {
        this.removeAIAnswer();
        return;
      }
      this.debounceTimer = setTimeout(() => {
        this.generateInlineAnswer(query, modal);
      }, 500);
    };

    input.addEventListener('input', this.inputListener);

    // Watch for the results container to appear inside the modal
    this.queryObserver = new MutationObserver(() => {
      const resultsContainer = modal.querySelector(
        '.results, .DocSearch-Hits, [class*="results"]'
      );
      if (resultsContainer && !this.aiAnswerContainer) {
        const query = input.value.trim();
        if (query.length >= 3) {
          this.injectAIAnswerContainer(resultsContainer);
          this.generateInlineAnswer(query, modal);
        }
      } else if (!resultsContainer && this.aiAnswerContainer) {
        // Results went away — remove AI card too
        this.removeAIAnswer();
      }
    });

    this.queryObserver.observe(modal, { childList: true, subtree: true });
  }

  /**
   * Remove query watcher listeners
   */
  private cleanupQueryWatcher(): void {
    if (this.modalEl && this.inputListener) {
      const input = this.modalEl.querySelector('input');
      if (input) input.removeEventListener('input', this.inputListener);
    }
    this.inputListener = null;
    this.queryObserver?.disconnect();
    this.queryObserver = null;
    clearTimeout(this.debounceTimer);
  }

  /**
   * Run a quick local search and synthesize an inline AI answer
   */
  private async generateInlineAnswer(query: string, modal: HTMLElement): Promise<void> {
    try {
      if (!this.searchEngine.isLoaded()) return;

      const rawResults = this.searchEngine.search(query, 3);
      if (rawResults.length === 0) return;

      const mappedResults = rawResults.map(r => ({
        page: {
          url: r.chunk.url,
          title: r.chunk.pageTitle,
          section: r.chunk.heading,
        },
        snippet: r.chunk.content || '',
        score: r.score,
        fullContent: r.chunk.content || '',
        headings: r.chunk.heading ? [r.chunk.heading] : [],
        codeBlocks: (r.chunk.codeBlocks || []).map(cb => ({
          language: cb.language,
          code: cb.code,
          context: r.chunk.heading || '',
        })),
      }));

      const answer = await this.synthesizer.synthesize(query, mappedResults, { mode: 'local' });

      // Ensure AI container is injected
      const resultsContainer = modal.querySelector('.results, .DocSearch-Hits, [class*="results"]');
      if (resultsContainer && !this.aiAnswerContainer) {
        this.injectAIAnswerContainer(resultsContainer);
      }

      await this.showAIAnswer(answer.content, answer.citations);
    } catch (error) {
      console.warn('[DepthIndex] Inline answer generation failed:', error);
    }
  }

  /**
   * Create and insert the AI answer card into the results container
   */
  private injectAIAnswerContainer(resultsContainer: Element): void {
    this.removeAIAnswer();

    this.aiAnswerContainer = document.createElement('div');
    this.aiAnswerContainer.className = 'di-inline-answer';
    this.aiAnswerContainer.innerHTML = `
      <div class="di-inline-answer-header">
        <span class="di-inline-answer-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M12 2L14.85 9.15L22 12L14.85 14.85L12 22L9.15 14.85L2 12L9.15 9.15L12 2Z"/>
          </svg>
        </span>
        <span class="di-inline-answer-label">AI Answer</span>
        <span class="di-inline-answer-badge">On-Device</span>
        ${this.config.showExpandButton ? `
          <button class="di-inline-answer-expand" title="Open in full AI panel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12" aria-hidden="true">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
            Chat
          </button>
        ` : ''}
      </div>
      <div class="di-inline-answer-content di-inline-answer-loading">
        <div class="di-shimmer-line"></div>
        <div class="di-shimmer-line di-shimmer-short"></div>
        <div class="di-shimmer-line di-shimmer-short"></div>
      </div>
      <div class="di-inline-answer-citations"></div>
    `;

    if (this.config.position === 'top') {
      resultsContainer.insertBefore(this.aiAnswerContainer, resultsContainer.firstChild);
    } else {
      resultsContainer.appendChild(this.aiAnswerContainer);
    }

    const expandBtn = this.aiAnswerContainer.querySelector('.di-inline-answer-expand');
    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        const input = this.modalEl?.querySelector('input') as HTMLInputElement | null;
        this.openPanel(input?.value || '');
      });
    }
  }

  /**
   * Populate the AI answer card with the generated content
   */
  private async showAIAnswer(content: string, citations: Citation[]): Promise<void> {
    if (!this.aiAnswerContainer) return;

    const contentEl = this.aiAnswerContainer.querySelector('.di-inline-answer-content');
    const citesEl = this.aiAnswerContainer.querySelector('.di-inline-answer-citations');

    if (contentEl) {
      contentEl.classList.remove('di-inline-answer-loading');
      const maxLength = this.config.maxAnswerLength || 500;
      const truncated = content.length > maxLength
        ? content.substring(0, maxLength) + '...'
        : content;
      contentEl.innerHTML = await this.renderer.renderMarkdown(truncated);
    }

    if (citesEl) {
      citesEl.innerHTML = '';
      if (citations && citations.length > 0) {
        citations.slice(0, 3).forEach(c => {
          const citeLink = document.createElement('a');
          citeLink.href = c.url;
          citeLink.className = 'di-inline-cite';
          citeLink.target = '_blank';
          citeLink.rel = 'noopener noreferrer';
          citeLink.innerHTML = `
            <span class="di-inline-cite-num">${c.index}</span>
            ${c.title}
          `;
          citesEl.appendChild(citeLink);
        });
      }
    }
  }

  /**
   * Remove the AI answer card from DOM
   */
  private removeAIAnswer(): void {
    if (this.aiAnswerContainer) {
      this.aiAnswerContainer.remove();
      this.aiAnswerContainer = null;
    }
  }

  /**
   * Dispatch event to open the full AI panel with a pre-filled query
   */
  private openPanel(query: string): void {
    window.dispatchEvent(new CustomEvent('depthindex:open-panel', { detail: { query } }));
  }

  /**
   * Teardown — called when FloatingButton.vue unmounts
   */
  destroy(): void {
    this.cleanupQueryWatcher();
    this.domObserver?.disconnect();
    this.removeAIAnswer();
    this.modalEl = null;
  }
}
