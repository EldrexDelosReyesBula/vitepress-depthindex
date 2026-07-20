import { SearchBarConfig, SearchResult } from '../types/index.js';
import { DepthIndexEngine } from './search-engine.js';
import { AnswerSynthesizer, Citation } from './answer-synthesizer.js';
import { ContentRenderer } from './renderers.js';
import { CitationRenderer } from './citation-renderer.js';
import { RichTextRenderer } from './rich-text-renderer.js';

/**
 * SearchBarIntegration — enhances the VitePress search modal with inline AI answers.
 *
 * Watches for SPA navigation and re-initializes on route changes.
 * Supports concise overview answers as well as full detailed answers.
 */
export class SearchBarIntegration {
  private config: SearchBarConfig;
  private searchEngine: DepthIndexEngine;
  private synthesizer: AnswerSynthesizer;
  private renderer: ContentRenderer;
  private citationRenderer: CitationRenderer;
  private richTextRenderer: RichTextRenderer;
  
  private currentInput: HTMLInputElement | null = null;
  private aiAnswerContainer: HTMLElement | null = null;
  private domObserver: MutationObserver | null = null;
  private routeObserver: MutationObserver | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private isDismissed = false;
  private originalPushState: any = null;
  private originalReplaceState: any = null;
  private isRouteWatcherSetup = false;
  private debounceTimer: any = null;

  private readonly MODAL_SELECTORS = [
    '.VPLocalSearchBox',     // VitePress built-in local search modal
    '.DocSearch-Modal',       // Algolia DocSearch modal
    '.local-search-box',      // legacy/custom class
    '#local-search',          // fallback ID selector
  ];

  constructor(config: SearchBarConfig, engine: DepthIndexEngine) {
    this.config = {
      enabled: true,
      mode: 'overview',
      overviewMaxLength: 400,
      showExpandButton: true,
      askAIButtonText: 'Ask AI',
      placeholder: 'Ask AI or search docs...',
      shortcut: '⌘K',
      position: 'top',
      answerStyle: 'overview',
      maxAnswerLength: 300,
      showTransferHint: true,
      ...config,
    };
    this.searchEngine = engine;
    this.synthesizer = new AnswerSynthesizer();
    this.renderer = new ContentRenderer();
    this.citationRenderer = new CitationRenderer();
    this.richTextRenderer = new RichTextRenderer();
  }

  /**
   * Initialize search bar integration.
   * Watches for SPA navigation and re-initializes on route changes.
   */
  async init(): Promise<void> {
    if (!this.config.enabled) return;
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._init();
    await this.initPromise;
  }

  private async _init(): Promise<void> {
    if (this.config.mode === 'none') {
      this.isInitialized = true;
      return;
    }

    // 1. Wait for search bar input to appear in DOM (either persistent or in modal)
    await this.waitForSearchBar();

    // 2. Enhance the search bar input & modal footer
    this.enhanceSearchBar();

    // 3. Initialize based on mode
    if (this.config.mode === 'button') {
      this.injectAskAIButton();
    } else {
      this.attachInputListener();
    }

    // 4. Watch for VitePress route changes (SPA navigation)
    this.setupRouteWatcher();

    // 5. Watch for modal mount/unmount in body to re-bind if modal is closed and re-opened
    this.setupModalWatcher();

    this.isInitialized = true;
    if (typeof window !== 'undefined') {
      console.log('[DepthIndex] Search bar integration active on:', window.location.pathname);
    }
  }

  /**
   * Watch for VitePress SPA navigation.
   * When the route changes, re-attach to the new search bar.
   */
  private setupRouteWatcher(): void {
    if (typeof window === 'undefined') return;
    if (this.isRouteWatcherSetup) return;

    window.addEventListener('popstate', this.handleRoutePopstate);

    if (typeof history !== 'undefined') {
      this.originalPushState = history.pushState.bind(history);
      this.originalReplaceState = history.replaceState.bind(history);

      history.pushState = (...args) => {
        this.originalPushState(...args);
        this.onRouteChanged();
      };

      history.replaceState = (...args) => {
        this.originalReplaceState(...args);
        this.onRouteChanged();
      };
    }

    if (typeof document !== 'undefined') {
      this.routeObserver = new MutationObserver(() => {
        const newInput = this.findSearchInput();
        if (newInput && newInput !== this.currentInput) {
          this.onRouteChanged();
        }
      });

      this.routeObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    this.isRouteWatcherSetup = true;
  }

  private handleRoutePopstate = () => {
    this.onRouteChanged();
  };

  /**
   * Handle route change — re-initialize on new page.
   */
  private onRouteChanged(): void {
    // Small delay to let VitePress render the new page
    setTimeout(async () => {
      const newPath = typeof window !== 'undefined' ? window.location.pathname : '/';
      console.log('[DepthIndex] Route changed to:', newPath);

      // Remove old listeners and containers
      this.cleanup();

      // Reset init state for new page
      this.isInitialized = false;
      this.initPromise = null;
      this.currentInput = null;
      this.aiAnswerContainer = null;
      this.isDismissed = false;

      // Re-initialize on new page
      await this.init();
    }, 300);
  }

  /**
   * Watch for modal mounting/unmounting to support modals opening/closing
   */
  private setupModalWatcher(): void {
    if (this.domObserver) return;

    this.domObserver = new MutationObserver(() => {
      const input = this.findSearchInput();
      if (input && input !== this.currentInput) {
        this.currentInput = input;
        this.enhanceSearchBar();
        if (this.config.mode === 'button') {
          this.injectAskAIButton();
        } else if (this.config.mode !== 'none') {
          this.attachInputListener();
        }
      } else if (!input && this.currentInput) {
        // Modal was removed
        this.cleanupQueryWatcher();
        this.removeAIAnswer();
        this.removeAskAIButton();
        this.currentInput = null;
      }
    });

    this.domObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  private findSearchInput(): HTMLInputElement | null {
    const selectors = [
      '#local-search input',
      '.DocSearch input',
      '.VPNavBarSearch input',
      '[class*="search"] input',
    ];
    for (const selector of selectors) {
      const input = document.querySelector(selector) as HTMLInputElement | null;
      if (input) return input;
    }
    
    // Fallback for tests or specific mock DOM structures where querySelector is nested
    const localSearch = document.querySelector('#local-search');
    if (localSearch) {
      const input = localSearch.querySelector('input') as HTMLInputElement | null;
      if (input) return input;
    }
    const docSearch = document.querySelector('.DocSearch-Modal');
    if (docSearch) {
      const input = docSearch.querySelector('input') as HTMLInputElement | null;
      if (input) return input;
    }
    return null;
  }

  /**
   * Wait for search bar to appear in DOM (with retry).
   */
  private async waitForSearchBar(): Promise<void> {
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 30; // 10 seconds max

      const check = () => {
        attempts++;
        const input = this.findSearchInput();
        if (input) {
          this.currentInput = input;
          resolve();
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(check, 300);
        } else {
          console.warn('[DepthIndex] Search bar not found after timeout. Will retry on navigation.');
          resolve(); // Don't block — will retry on route change
        }
      };

      check();
    });
  }

  /**
   * Enhance the search bar with config settings and attribution branding.
   */
  private enhanceSearchBar(): void {
    if (!this.currentInput) return;

    // Enhance placeholder
    this.currentInput.placeholder = this.config.placeholder || 'Ask AI or search docs...';

    // Inject mandatory "Powered by DepthIndex" branding into modal footer
    if (this.currentInput.closest) {
      for (const selector of this.MODAL_SELECTORS) {
        const modal = this.currentInput.closest(selector) as HTMLElement | null;
        if (modal) {
          this.injectBranding(modal);
          break;
        }
      }
    } else {
      // Fallback for tests where closest is not defined on mock input
      for (const selector of this.MODAL_SELECTORS) {
        const modal = document.querySelector(selector) as HTMLElement | null;
        if (modal) {
          this.injectBranding(modal);
          break;
        }
      }
    }
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
   * Attach input listener to current search bar.
   */
  private attachInputListener(): void {
    if (!this.currentInput) return;

    this.detachInputListener();

    const handler = () => {
      clearTimeout(this.debounceTimer);

      const query = this.currentInput?.value?.trim() || '';

      if (query.length < 3) {
        this.removeAIAnswer();
        this.isDismissed = false;
        return;
      }

      if (this.isDismissed) return;

      this.debounceTimer = setTimeout(async () => {
        if (this.config.mode === 'overview') {
          const overview = await this.generateOverview(query);
          if (overview) {
            this.showOverview(overview, query);
          } else {
            this.removeAIAnswer();
          }
        } else {
          await this.generateInlineAnswer(query);
        }
      }, 500);
    };

    const keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const query = this.currentInput?.value?.trim() || '';
        if (query.length >= 3) {
          e.preventDefault();
          this.transferToPanel(query);
        }
      }
    };

    this.currentInput.addEventListener('input', handler);
    this.currentInput.addEventListener('keydown', keydownHandler);
    this.currentInput._depthIndexHandler = handler;
    this.currentInput._depthIndexKeydownHandler = keydownHandler;
  }

  private detachInputListener(): void {
    if (this.currentInput?._depthIndexHandler) {
      this.currentInput.removeEventListener('input', this.currentInput._depthIndexHandler);
      delete this.currentInput._depthIndexHandler;
    }
    if (this.currentInput?._depthIndexKeydownHandler) {
      this.currentInput.removeEventListener('keydown', this.currentInput._depthIndexKeydownHandler);
      delete this.currentInput._depthIndexKeydownHandler;
    }
  }

  private cleanupQueryWatcher(): void {
    this.detachInputListener();
    clearTimeout(this.debounceTimer);
  }

  /**
   * Generate inline answer.
   */
  private async generateInlineAnswer(query: string): Promise<void> {
    try {
      if (!this.searchEngine.isLoaded()) return;

      const rawResults = this.searchEngine.search(query, 3);

      if (rawResults.length === 0) {
        this.showNoResults(query);
        return;
      }

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

      const answer = await this.synthesizer.synthesize(query, mappedResults, {
        mode: 'local',
      });

      // Inject / Show the AI card
      this.showAIAnswerCard(answer.content, answer.citations, query, mappedResults);

    } catch (error) {
      console.warn('[DepthIndex] Inline answer failed:', error);
      this.removeAIAnswer();
    }
  }

  private getIconHtml(): string {
    if (this.config.logo?.src) {
      return `<img src="${this.config.logo.src}" alt="${this.config.logo.alt || 'AI'}" class="di-inline-answer-logo-img" style="width: 14px; height: 14px; border-radius: 2px;" />`;
    }
    if (this.config.logo?.icon) {
      return `<i class="${this.config.logo.icon}"></i>`;
    }
    return `
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
        <path d="M12 2L14.85 9.15L22 12L14.85 14.85L12 22L9.15 14.85L2 12L9.15 9.15L12 2Z"/>
      </svg>
    `;
  }

  /**
   * Inject and populate the AI answer card.
   */
  private showAIAnswerCard(
    content: string,
    citations: Citation[],
    query: string,
    results: any[]
  ): void {
    if (!this.currentInput || this.currentInput.value.trim() !== query) {
      return; // input changed or gone
    }

    const resultsContainer = document.querySelector(
      '.VPLocalSearchBox .results, .DocSearch-Hits, .DocSearch-Dropdown, .local-search-results, [class*="search-result"], [class*="search-dropdown"]'
    );

    if (!resultsContainer) {
      // Wait for search dropdown to be mounted and try again
      setTimeout(() => this.showAIAnswerCard(content, citations, query, results), 100);
      return;
    }

    this.removeAIAnswer();

    const isOverview = (this.config.answerStyle || 'overview') === 'overview';
    const label = isOverview ? 'AI Overview' : 'AI Answer';

    this.aiAnswerContainer = document.createElement('div');
    this.aiAnswerContainer.className = 'di-inline-answer';
    
    // Build Header
    let headerHtml = `
      <div class="di-inline-answer-header">
        <span class="di-inline-answer-icon">${this.getIconHtml()}</span>
        <span class="di-inline-answer-label">${label}</span>
        <span class="di-inline-answer-badge">On-Device</span>
    `;

    if (this.config.showExpandButton !== false) {
      headerHtml += `
        <button class="di-inline-answer-expand" title="Open detailed answer in chat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12" aria-hidden="true">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
          </svg>
          Chat
        </button>
      `;
    }

    headerHtml += `
        <button class="di-inline-answer-close" title="Dismiss AI Answer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="12" height="12" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    `;

    // Build Content & Footer/Hint
    let contentHtml = '';
    let citationsHtml = '';
    let hintHtml = '';

    if (isOverview) {
      contentHtml = `<div class="di-inline-answer-content">${this.renderConciseContent(content)}</div>`;
      if (this.config.showTransferHint !== false) {
        hintHtml = `<div class="di-inline-answer-hint">Press Enter to see detailed answer with code examples</div>`;
      }
    } else {
      contentHtml = `<div class="di-inline-answer-content di-inline-answer-loading">
        <div class="di-shimmer-line"></div>
        <div class="di-shimmer-line di-shimmer-short"></div>
        <div class="di-shimmer-line di-shimmer-short"></div>
      </div>`;
      citationsHtml = `<div class="di-inline-answer-citations"></div>`;
    }

    this.aiAnswerContainer.innerHTML = `${headerHtml}${contentHtml}${citationsHtml}${hintHtml}`;

    // Insert at top or bottom depending on position config
    if (this.config.position === 'top' && resultsContainer.firstChild) {
      resultsContainer.insertBefore(this.aiAnswerContainer, resultsContainer.firstChild);
    } else {
      resultsContainer.appendChild(this.aiAnswerContainer);
    }

    // Bind event handlers
    const expandBtn = this.aiAnswerContainer.querySelector('.di-inline-answer-expand');
    if (expandBtn) {
      expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.transferToPanel(query);
      });
    }

    const closeBtn = this.aiAnswerContainer.querySelector('.di-inline-answer-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeAIAnswer();
        this.isDismissed = true;
      });
    }

    // Card click opens panel
    this.aiAnswerContainer.addEventListener('click', (e) => {
      // If user clicked buttons, don't trigger card-level transfer
      if ((e.target as HTMLElement).closest('.di-inline-answer-expand, .di-inline-answer-close, a')) {
        return;
      }
      this.transferToPanel(query);
    });

    // Populate content if detailed (we render it with rich text and citations)
    if (!isOverview) {
      const contentEl = this.aiAnswerContainer.querySelector('.di-inline-answer-content');
      const citesEl = this.aiAnswerContainer.querySelector('.di-inline-answer-citations');

      if (contentEl) {
        contentEl.classList.remove('di-inline-answer-loading');
        const maxLength = this.config.maxAnswerLength || 500;
        const truncated = content.length > maxLength
          ? content.substring(0, maxLength) + '...'
          : content;
        
        const withCitations = this.citationRenderer.renderInline(truncated, citations);
        contentEl.innerHTML = this.richTextRenderer.render(withCitations);
      }

      if (citesEl) {
        citesEl.innerHTML = '';
        if (citations && citations.length > 0) {
          citesEl.innerHTML = this.citationRenderer.renderReferences(citations);
        }
      }
    }
  }

  /**
   * Render concise content — no code blocks, no citations.
   */
  private renderConciseContent(content: string): string {
    // Strip code blocks
    let cleaned = content.replace(/```[\s\S]*?```/g, '[code example]');
    
    // Strip citations
    cleaned = cleaned.replace(/\[\^\d+(?:,\d+)*\]/g, '');
    
    // Strip bold/italic markers for cleaner inline display
    cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1');
    cleaned = cleaned.replace(/\*(.+?)\*/g, '$1');
    
    // Truncate to configured maxAnswerLength (default 300)
    const maxLen = this.config.maxAnswerLength || 300;
    if (cleaned.length > maxLen) {
      const truncated = cleaned.substring(0, maxLen);
      const lastPeriod = truncated.lastIndexOf('.');
      const lastSpace = truncated.lastIndexOf(' ');
      const cutPoint = lastPeriod > (maxLen * 0.6) ? lastPeriod + 1 : lastSpace;
      cleaned = truncated.substring(0, cutPoint > 0 ? cutPoint : maxLen) + '...';
    }
    
    // Convert newlines to spaces for inline
    cleaned = cleaned.replace(/\n+/g, ' ');
    
    return cleaned;
  }

  /**
   * Show when no results found.
   */
  private showNoResults(query: string): void {
    if (!this.currentInput || this.currentInput.value.trim() !== query) {
      return;
    }

    const resultsContainer = document.querySelector(
      '.VPLocalSearchBox .results, .DocSearch-Hits, .DocSearch-Dropdown, .local-search-results, [class*="search-result"], [class*="search-dropdown"]'
    );

    if (!resultsContainer) return;

    this.removeAIAnswer();

    this.aiAnswerContainer = document.createElement('div');
    this.aiAnswerContainer.className = 'di-inline-answer di-inline-answer--no-results';
    this.aiAnswerContainer.innerHTML = `
      <div class="di-inline-answer-header">
        <span class="di-inline-answer-icon"><i class="fa-solid fa-magnifying-glass"></i></span>
        <span class="di-inline-answer-label">No results for "${this.escapeHtml(query)}"</span>
      </div>
      <div class="di-inline-answer-content">
        Try different keywords or <a href="#" class="di-inline-chat-link">ask the AI assistant</a> for help.
      </div>
    `;

    const chatLink = this.aiAnswerContainer.querySelector('.di-inline-chat-link');
    if (chatLink) {
      chatLink.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.transferToPanel(query);
      });
    }

    if (this.config.position === 'top' && resultsContainer.firstChild) {
      resultsContainer.insertBefore(this.aiAnswerContainer, resultsContainer.firstChild);
    } else {
      resultsContainer.appendChild(this.aiAnswerContainer);
    }
  }

  /**
   * Transfer the query to the full chat panel for detailed answer.
   */
  private transferToPanel(query: string): void {
    // Close search dropdown by clearing and blurring
    if (this.currentInput) {
      this.currentInput.value = '';
      this.currentInput.dispatchEvent(new Event('input')); // trigger cleanups
      this.currentInput.blur();
    }

    // Close any search modal in VitePress/Algolia by firing keyboard events or clicking close button
    const closeBtn = document.querySelector('.DocSearch-Cancel, .VPLocalSearchBox-Cancel') as HTMLElement | null;
    if (closeBtn) {
      closeBtn.click();
    } else if (typeof KeyboardEvent !== 'undefined') {
      // Fallback: send escape key to close modals
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }));
    }

    // Remove AI answer card
    this.removeAIAnswer();

    // Open panel with the query
    window.dispatchEvent(new CustomEvent('depthindex:open-panel', {
      detail: { 
        query,
        source: 'search-bar',
      },
    }));
  }

  private removeAIAnswer(): void {
    if (this.aiAnswerContainer) {
      this.aiAnswerContainer.remove();
      this.aiAnswerContainer = null;
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private cleanup(): void {
    this.cleanupQueryWatcher();
    this.removeAIAnswer();
    this.removeAskAIButton();
    this.routeObserver?.disconnect();
    this.routeObserver = null;
  }

  destroy(): void {
    this.cleanup();
    this.domObserver?.disconnect();
    this.domObserver = null;

    if (this.isRouteWatcherSetup) {
      window.removeEventListener('popstate', this.handleRoutePopstate);
      if (this.originalPushState) {
        history.pushState = this.originalPushState;
      }
      if (this.originalReplaceState) {
        history.replaceState = this.originalReplaceState;
      }
      this.isRouteWatcherSetup = false;
    }
  }

  private removeAskAIButton(): void {
    if (this.currentInput) {
      const container = this.currentInput.parentElement;
      if (container && typeof container.querySelector === 'function') {
        const button = container.querySelector('.di-ask-ai-btn');
        if (button) {
          button.remove();
        }
      }
    }
  }

  /**
   * Generate AI Overview.
   */
  private async generateOverview(query: string): Promise<string> {
    if (!this.searchEngine.isLoaded()) return '';
    const results = this.searchEngine.search(query, 5);
    
    if (results.length === 0) {
      return '';
    }
    
    const mappedResults = results.map(r => ({
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
    
    // Get the full synthesized answer
    const fullAnswer = await this.synthesizer.synthesize(query, mappedResults, {
      mode: 'local',
    });
    
    // Convert full answer to overview
    return this.fullToOverview(fullAnswer.content);
  }

  /**
   * Convert full answer to concise overview.
   * Strips all complex elements.
   */
  private fullToOverview(content: string): string {
    let overview = content;
    
    // 1. Remove mermaid blocks first
    overview = overview.replace(/```mermaid[\s\S]*?```/g, '[diagram]');

    // 2. Remove code blocks entirely → "[code example]"
    overview = overview.replace(
      /```[\s\S]*?```/g,
      '[code example]'
    );
    
    // 3. Remove tables entirely → "[table]"
    overview = overview.replace(
      /\|.+\|\n\|[-| :]+\|\n(?:\|.+\|\n?)*/g,
      '[table]'
    );
    
    // 4. Remove HTML tags (images, videos, iframes)
    overview = overview.replace(/<[^>]+>/g, '');
    
    // 5. Remove image markdown → "[image]"
    overview = overview.replace(/!\[[^\]]*\]\([^)]+\)/g, '[image]');
    
    // 6. Remove YouTube/Video URLs → "[video]"
    overview = overview.replace(
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[^\s]+/g,
      '[video]'
    );
    
    // 7. Remove citation references → keep as simple numbers (wait, this strips them, per the instruction)
    overview = overview.replace(/\[\^(\d+(?:,\d+)*)\]/g, '');
    
    // 8. Remove reference section
    overview = overview.replace(/###?\s*References[\s\S]*$/i, '');
    overview = overview.replace(/###?\s*📚\s*References[\s\S]*$/i, '');
    
    // 9. Remove related topics section
    overview = overview.replace(/###?\s*Related Topics[\s\S]*$/i, '');
    overview = overview.replace(/###?\s*🔍\s*Related Topics[\s\S]*$/i, '');
    
    // 10. Remove confidence/source badges
    overview = overview.replace(/💻\s*On-Device.*/gi, '');
    overview = overview.replace(/☁️\s*Cloud AI.*/gi, '');
    
    // 11. Normalize whitespace
    overview = overview.replace(/\n{3,}/g, '\n\n');
    overview = overview.replace(/\s+/g, ' ').trim();
    
    // 12. Truncate at sentence boundary
    const maxLength = this.config.overviewMaxLength || 400;
    if (overview.length > maxLength) {
      const truncated = overview.substring(0, maxLength);
      const lastPeriod = truncated.lastIndexOf('.');
      const lastExclaim = truncated.lastIndexOf('!');
      const lastQuestion = truncated.lastIndexOf('?');
      const lastBreak = Math.max(lastPeriod, lastExclaim, lastQuestion);
      
      if (lastBreak > maxLength * 0.5) {
        overview = truncated.substring(0, lastBreak + 1) + '..';
      } else {
        const lastSpace = truncated.lastIndexOf(' ');
        overview = truncated.substring(0, lastSpace) + '...';
      }
    }
    
    // 13. Clean up placeholder patterns
    overview = overview.replace(/\[code example\]\s*\[code example\]/g, '[code examples]');
    overview = overview.replace(/\[table\]\s*\[table\]/g, '[tables]');
    
    return overview;
  }

  /**
   * Render the overview in search dropdown.
   */
  private showOverview(overview: string, query: string): void {
    const resultsContainer = document.querySelector(
      '.VPLocalSearchBox .results, .DocSearch-Hits, .DocSearch-Dropdown, .local-search-results, [class*="search-result"], [class*="search-dropdown"]'
    );
    if (!resultsContainer) {
      setTimeout(() => this.showOverview(overview, query), 100);
      return;
    }
    
    this.removeAIAnswer();
    
    this.aiAnswerContainer = document.createElement('div');
    this.aiAnswerContainer.className = 'di-search-overview';
    
    this.aiAnswerContainer.innerHTML = `
      <div class="di-overview-header">
        <span class="di-overview-icon">
          <i class="fa-solid fa-robot"></i>
        </span>
        <span class="di-overview-label">AI Overview</span>
        <span class="di-overview-badge">On-Device</span>
        ${this.config.showExpandButton !== false ? `
          <button class="di-overview-expand" title="Open detailed answer in chat">
            <i class="fa-solid fa-message"></i> Chat
          </button>
        ` : ''}
      </div>
      <div class="di-overview-content">
        <p>${this.renderOverviewText(overview)}</p>
      </div>
    `;
    
    // Insert at top or bottom depending on position config
    if (this.config.position === 'top' && resultsContainer.firstChild) {
      resultsContainer.insertBefore(
        this.aiAnswerContainer, 
        resultsContainer.firstChild
      );
    } else {
      resultsContainer.appendChild(this.aiAnswerContainer);
    }
    
    // Click handlers
    const expandBtn = this.aiAnswerContainer.querySelector('.di-overview-expand');
    if (expandBtn) {
      expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.transferToPanel(query);
      });
    }
    
    // Click anywhere on overview to open chat
    this.aiAnswerContainer.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.di-overview-expand, a')) {
        return;
      }
      this.transferToPanel(query);
    });
  }

  /**
   * Render overview text — basic markdown only.
   */
  private renderOverviewText(text: string): string {
    return text
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Inline code (keep for overview)
      .replace(/`([^`]+)`/g, '<code class="di-overview-code">$1</code>')
      // Links
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
      )
      // Line breaks
      .replace(/\n/g, '<br>');
  }

  /**
   * Button mode — Show "Ask AI" button in search bar.
   * No overview. Click opens chat panel.
   */
  private injectAskAIButton(): void {
    if (!this.currentInput) return;
    
    const inputContainer = this.currentInput.parentElement;
    if (!inputContainer) return;
    
    // Check if already injected
    if (inputContainer.querySelector('.di-ask-ai-btn')) return;
    
    // Ensure container has relative positioning
    inputContainer.style.position = 'relative';
    
    const button = document.createElement('button');
    button.className = 'di-ask-ai-btn';
    button.innerHTML = `
      <i class="fa-solid fa-robot"></i>
      <span>${this.config.askAIButtonText || 'Ask AI'}</span>
    `;
    button.title = 'Open AI chat with this query';
    
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const query = this.currentInput?.value?.trim() || '';
      if (query.length >= 3) {
        this.transferToPanel(query);
      } else {
        // Open empty panel
        window.dispatchEvent(new CustomEvent('depthindex:open-panel', {
          detail: { query: '', source: 'search-bar-button' },
        }));
      }
    });
    
    inputContainer.appendChild(button);
    
    // Listen for Enter key to open chat
    const enterHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const query = this.currentInput?.value?.trim() || '';
        if (query.length >= 3) {
          e.preventDefault();
          this.transferToPanel(query);
        }
      }
    };
    
    this.currentInput.addEventListener('keydown', enterHandler);
    this.currentInput._depthIndexKeydownHandler = enterHandler;
  }
}

declare global {
  interface HTMLInputElement {
    _depthIndexHandler?: (e: Event) => void;
    _depthIndexKeydownHandler?: (e: KeyboardEvent) => void;
  }
}
