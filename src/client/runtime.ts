import { DepthIndexOptions } from '../types/index.js';
import { DepthIndexEngine } from './search-engine.js';
import { SessionManager } from './session-manager.js';

export class DepthIndexRuntime {
  private initialized = false;
  private errors: Error[] = [];
  private maxErrors = 10;
  
  private engine: DepthIndexEngine | null = null;
  private sessionManager: SessionManager | null = null;
  
  /**
   * Initialize with full error isolation.
   * Each component fails independently.
   */
  async init(config: DepthIndexOptions): Promise<void> {
    if (this.initialized) return;
    
    // Phase 1: Critical — must succeed
    try {
      await this.initCritical(config);
    } catch (error) {
      console.error('[DepthIndex] Critical init failed:', error);
      this.recordError(error);
      this.showDegradedMessage();
      return; // Stop — can't function without critical components
    }
    
    // Phase 2: Important — failures degrade gracefully
    await this.safeInit('Search Engine', () => this.initSearchEngine(config));
    await this.safeInit('Session Manager', () => this.initSessionManager(config));
    await this.safeInit('Site Intelligence', () => this.initSiteIntelligence(config));
    
    // Phase 3: Optional — failures are silent
    await this.safeInit('Search Bar', () => this.initSearchBar(config), true);
    await this.safeInit('Floating Button', () => this.initFloatingButton(config), true);
    await this.safeInit('Panel', () => this.initPanel(config), true);
    await this.safeInit('Analytics', () => this.initAnalytics(config), true);
    await this.safeInit('Personalization', () => this.initPersonalization(config), true);
    
    this.initialized = true;
    console.log('[DepthIndex] Runtime initialized');
  }
  
  private async initCritical(config: DepthIndexOptions): Promise<void> {
    if (!config) {
      throw new Error('Missing configuration options');
    }
    if (typeof document === 'undefined') {
      throw new Error('document is undefined');
    }
  }
  
  private async initSearchEngine(config: DepthIndexOptions): Promise<void> {
    this.engine = new DepthIndexEngine();
    const { fetchAndDecompressIndex } = await import('./index-loader.js');
    const index = await fetchAndDecompressIndex();
    if (index) {
      this.engine.setIndex(index);
    }
  }
  
  private async initSessionManager(config: DepthIndexOptions): Promise<void> {
    this.sessionManager = new SessionManager();
    await this.sessionManager.init();
  }
  
  private async initSiteIntelligence(config: DepthIndexOptions): Promise<void> {
    // Placeholder for site intelligence init
  }
  
  private async initSearchBar(config: DepthIndexOptions): Promise<void> {
    // Placeholder for search bar init
  }
  
  private async initFloatingButton(config: DepthIndexOptions): Promise<void> {
    // Placeholder for floating button init
  }
  
  private async initPanel(config: DepthIndexOptions): Promise<void> {
    // Placeholder for panel init
  }
  
  private async initAnalytics(config: DepthIndexOptions): Promise<void> {
    // Placeholder for analytics init
  }
  
  private async initPersonalization(config: DepthIndexOptions): Promise<void> {
    // Placeholder for personalization init
  }
  
  private async safeInit(
    name: string,
    fn: () => Promise<void>,
    silent: boolean = false
  ): Promise<void> {
    try {
      await fn();
    } catch (error) {
      if (!silent) {
        console.warn(`[DepthIndex] ${name} failed to initialize:`, error);
      }
      this.recordError(error);
      // Continue — other components still work
    }
  }
  
  private recordError(error: any): void {
    this.errors.push(error instanceof Error ? error : new Error(String(error)));
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
  }
  
  private showDegradedMessage(): void {
    if (typeof document === 'undefined') return;
    // Show minimal fallback UI
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;bottom:16px;right:16px;padding:8px 16px;background:#fef2f2;border:1px solid#fecaca;border-radius:8px;font-size:12px;color:#991b1b;z-index:9999;';
    el.textContent = 'AI search unavailable. Please use the documentation sidebar.';
    document.body.appendChild(el);
  }
  
  getErrors(): Error[] {
    return [...this.errors];
  }
  
  isHealthy(): boolean {
    return this.initialized && this.errors.length === 0;
  }
}
