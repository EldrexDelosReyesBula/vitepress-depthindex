import { DepthIndexEngine } from './search-engine.js';
import { SearchResult } from '../types/index.js';

export class PerformanceOptimizer {
  private queryCache: Map<string, { result: SearchResult[]; timestamp: number }> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes
  private webWorker: Worker | null = null;
  private fallbackEngine: DepthIndexEngine | null = null;
  private workerLoading = false;
  private workerLoaded = false;
  private pendingResolvers: Map<string, ((value: SearchResult[]) => void)[]> = new Map();

  private deviceProfile: 'low' | 'medium' | 'high' = 'medium';
  private memoryLimit: number = 50; // MB
  private config: any = {};

  constructor(fallbackEngine?: DepthIndexEngine) {
    if (fallbackEngine) {
      this.fallbackEngine = fallbackEngine;
    }
    this.detectDeviceProfile();
    this.applyOptimizations();
  }

  async init(indexUrl: string, fallbackEngine: DepthIndexEngine): Promise<void> {
    this.fallbackEngine = fallbackEngine;
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      return;
    }

    this.workerLoading = true;
    try {
      const base = (import.meta as any).env?.BASE_URL || '/';
      const cleanBase = base.endsWith('/') ? base : base + '/';
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const workerUrl = `${baseUrl}${cleanBase}depthindex-search-worker.js`;
      
      // Let's test the MIME type before starting the worker
      try {
        const response = await fetch(workerUrl, { method: 'HEAD' });
        const contentType = response.headers.get('Content-Type');
        if (contentType && !contentType.includes('javascript') && !contentType.includes('typescript')) {
          console.warn(`[DepthIndex] Worker file has wrong MIME type: ${contentType}, falling back to main thread`);
          this.webWorker = null;
          this.workerLoaded = false;
          this.workerLoading = false;
          return;
        }
      } catch (headErr) {
        console.warn('[DepthIndex] Failed to check worker MIME type:', headErr);
      }

      this.webWorker = new Worker(workerUrl, { type: 'module' });

      // Test the worker with a ping
      await new Promise<void>((resolve, reject) => {
        const pingTimeout = setTimeout(() => {
          reject(new Error('Worker ping timeout'));
        }, 1500);

        this.webWorker!.onmessage = (event) => {
          if (event.data?.type === 'pong') {
            clearTimeout(pingTimeout);
            resolve();
          }
        };

        this.webWorker!.postMessage({ type: 'ping' });
      }).catch(err => {
        console.warn('[DepthIndex] Web Worker ping failed, falling back to main thread:', err);
        if (this.webWorker) {
          this.webWorker.terminate();
          this.webWorker = null;
        }
        throw err;
      });

      if (!this.webWorker) return;

      // Set up worker message receiver
      this.webWorker.onmessage = (event) => {
        const { type, query, results } = event.data;

        if (type === 'index-loaded') {
          this.workerLoaded = true;
          this.workerLoading = false;
          console.log('[DepthIndex] Web Worker search index loaded successfully.');
        }

        if (type === 'search-results' && query) {
          // Cache results
          this.queryCache.set(query, {
            result: results,
            timestamp: Date.now(),
          });

          // Resolve pending promises for this query
          const resolvers = this.pendingResolvers.get(query);
          if (resolvers) {
            resolvers.forEach(resolve => resolve(results));
            this.pendingResolvers.delete(query);
          }
        }
      };

      this.webWorker.onerror = (err) => {
        console.warn('[DepthIndex] Web Worker error, falling back to main-thread search:', err);
        if (this.webWorker) {
          this.webWorker.terminate();
          this.webWorker = null;
        }
        this.workerLoaded = false;
        this.workerLoading = false;
      };

      // Instruct worker to load the index
      this.webWorker.postMessage({ type: 'load-index', indexUrl });
    } catch (e) {
      console.warn('[DepthIndex] Failed to initialize Web Worker, falling back to main thread:', e);
      if (this.webWorker) {
        this.webWorker.terminate();
        this.webWorker = null;
      }
      this.workerLoaded = false;
      this.workerLoading = false;
    }
  }

  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    // 1. Check cache first
    const cached = this.queryCache.get(trimmedQuery);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.result.slice(0, topK);
    }

    // 2. Try Web Worker if loaded
    if (this.webWorker && (this.workerLoaded || this.workerLoading)) {
      return new Promise<SearchResult[]>((resolve) => {
        // Enqueue resolver
        if (!this.pendingResolvers.has(trimmedQuery)) {
          this.pendingResolvers.set(trimmedQuery, []);
        }
        this.pendingResolvers.get(trimmedQuery)!.push(resolve);

        // Send query to worker
        this.webWorker!.postMessage({ type: 'search', query: trimmedQuery, topK });

        // Set a safety timeout to fall back to main thread if worker takes too long (e.g. 500ms)
        setTimeout(() => {
          const resolvers = this.pendingResolvers.get(trimmedQuery);
          if (resolvers) {
            const index = resolvers.indexOf(resolve);
            if (index > -1) {
              resolvers.splice(index, 1);
              if (resolvers.length === 0) {
                this.pendingResolvers.delete(trimmedQuery);
              }
              // Fallback to main thread search
              console.log('[DepthIndex] Worker timeout, running main thread fallback search.');
              resolve(this.searchMainThread(trimmedQuery, topK));
            }
          }
        }, 500);
      });
    }

    // 3. Fallback: search on main thread directly
    return this.searchMainThread(trimmedQuery, topK);
  }

  private searchMainThread(query: string, topK: number): SearchResult[] {
    if (!this.fallbackEngine) {
      console.warn('[DepthIndex] Search engine fallback not available.');
      return [];
    }
    const results = this.fallbackEngine.search(query, topK);
    // Cache the result
    this.queryCache.set(query, {
      result: results,
      timestamp: Date.now(),
    });
    return results;
  }

  // Debounce helper
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: number | undefined;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = window.setTimeout(() => func(...args), wait);
    };
  }

  // Virtual scrolling implementation
  virtualScroll(container: HTMLElement, items: any[], itemHeight: number, renderFn: (itemsRange: any[], startIndex: number) => void): () => void {
    if (!container) return () => {};

    const visibleCount = Math.ceil(container.clientHeight / itemHeight);
    const buffer = 3;

    // Set container styles
    container.style.position = 'relative';
    container.style.overflowY = 'auto';

    // Create a wrapper for scroll content
    let contentWrapper = container.querySelector('.virtual-scroll-content') as HTMLElement;
    if (!contentWrapper) {
      contentWrapper = document.createElement('div');
      contentWrapper.className = 'virtual-scroll-content';
      contentWrapper.style.position = 'absolute';
      contentWrapper.style.top = '0';
      contentWrapper.style.left = '0';
      contentWrapper.style.width = '100%';
      
      // Move all current children of container into contentWrapper
      while (container.firstChild) {
        contentWrapper.appendChild(container.firstChild);
      }
      container.appendChild(contentWrapper);
    }

    // Create a height spacer to simulate scroll bar height
    let spacer = container.querySelector('.virtual-scroll-spacer') as HTMLElement;
    if (!spacer) {
      spacer = document.createElement('div');
      spacer.className = 'virtual-scroll-spacer';
      spacer.style.width = '100%';
      container.insertBefore(spacer, contentWrapper);
    }

    const updateScroll = () => {
      const scrollTop = container.scrollTop;
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
      const endIndex = Math.min(items.length, startIndex + visibleCount + buffer * 2);

      // Spacer height is total items * height
      spacer.style.height = `${items.length * itemHeight}px`;

      // Position the visible content correctly
      contentWrapper.style.transform = `translateY(${startIndex * itemHeight}px)`;

      // Render the sub-slice of items
      const slice = items.slice(startIndex, endIndex);
      renderFn(slice, startIndex);
    };

    container.addEventListener('scroll', updateScroll);
    // Initial run
    updateScroll();

    // Return destroy callback
    return () => {
      container.removeEventListener('scroll', updateScroll);
    };
  }

  /**
   * Detect device capabilities
   */
  private detectDeviceProfile(): void {
    if (typeof navigator === 'undefined') {
      this.deviceProfile = 'medium';
      this.memoryLimit = 50;
      return;
    }
    // Check RAM
    const memory = (navigator as any).deviceMemory || 4; // GB
    
    // Check CPU cores
    const cores = navigator.hardwareConcurrency || 4;
    
    // Check connection
    const connection = (navigator as any).connection;
    const isSlowNetwork = connection?.effectiveType === '2g' || 
                          connection?.effectiveType === 'slow-2g';
    
    if (memory <= 2 || cores <= 2 || isSlowNetwork) {
      this.deviceProfile = 'low';
      this.memoryLimit = 25;
    } else if (memory <= 4 || cores <= 4) {
      this.deviceProfile = 'medium';
      this.memoryLimit = 50;
    } else {
      this.deviceProfile = 'high';
      this.memoryLimit = 100;
    }
    
    console.log(`[DepthIndex] Device profile: ${this.deviceProfile} (${memory}GB RAM, ${cores} cores)`);
  }
  
  /**
   * Apply optimizations based on device profile
   */
  private applyOptimizations(): void {
    switch (this.deviceProfile) {
      case 'low':
        this.setConfig({
          chunkSize: 250,
          maxResults: 3,
          disableAnimations: true,
          lazyLoadImages: true,
          useWebWorker: false,
        });
        break;
        
      case 'medium':
        this.setConfig({
          chunkSize: 500,
          maxResults: 5,
          disableAnimations: false,
          lazyLoadImages: true,
          useWebWorker: true,
          maxWorkers: 1,
        });
        break;
        
      case 'high':
        this.setConfig({
          chunkSize: 1000,
          maxResults: 10,
          disableAnimations: false,
          lazyLoadImages: false,
          useWebWorker: true,
          maxWorkers: 2,
        });
        break;
    }
  }
  
  /**
   * Lazy load index in chunks
   */
  async loadIndexInChunks(indexUrl: string): Promise<void> {
    if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
    const CHUNK_SIZE = this.deviceProfile === 'low' ? 50000 : 100000; // bytes
    
    const response = await fetch(indexUrl);
    const reader = response.body?.getReader();
    
    if (!reader) {
      const fullData = await response.arrayBuffer();
      await this.processIndexChunk(fullData);
      return;
    }
    
    let buffer = new Uint8Array();
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      // Append to buffer
      const newBuffer = new Uint8Array(buffer.length + value.length);
      newBuffer.set(buffer);
      newBuffer.set(value, buffer.length);
      buffer = newBuffer;
      
      // Process when chunk size reached
      if (buffer.length >= CHUNK_SIZE) {
        await this.processIndexChunk(buffer.slice(0, CHUNK_SIZE).buffer);
        buffer = buffer.slice(CHUNK_SIZE);
        
        // Yield to main thread
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    // Process remaining
    if (buffer.length > 0) {
      await this.processIndexChunk(buffer.buffer);
    }
  }
  
  /**
   * Process index chunk without blocking main thread
   */
  private async processIndexChunk(chunk: ArrayBuffer): Promise<void> {
    return new Promise((resolve) => {
      const scheduleFn = typeof requestIdleCallback !== 'undefined' 
        ? requestIdleCallback 
        : (cb: any) => setTimeout(cb, 1);
      scheduleFn(() => {
        this.parseIndexChunk(chunk);
        resolve();
      }, { timeout: 100 });
    });
  }
  
  /**
   * Parse chunk trace helper
   */
  private parseIndexChunk(chunk: ArrayBuffer): void {
    const kb = (chunk.byteLength / 1024).toFixed(1);
    console.log(`[DepthIndex] Parsed index chunk: ${kb} KB`);
  }
  
  /**
   * Memory cleanup
   */
  cleanupMemory(): void {
    this.queryCache.clear();
    
    // Suggest garbage collection
    const globalGC = (globalThis as any).gc;
    if (typeof globalGC === 'function') {
      try {
        globalGC();
      } catch {}
    }
    
    this.cleanupIndexedDB();
  }
  
  private cleanupIndexedDB(): void {
    if (typeof window === 'undefined' || !window.indexedDB) return;
    try {
      console.log('[DepthIndex] Purging IndexedDB memory footprints...');
    } catch (err) {
      console.warn('[DepthIndex] Failed to cleanup IndexedDB:', err);
    }
  }
  
  private setConfig(config: any): void {
    this.config = config;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('depthindex-perf-config', JSON.stringify(config));
      } catch {}
    }
  }

  getDeviceProfile(): 'low' | 'medium' | 'high' {
    return this.deviceProfile;
  }

  getMemoryLimit(): number {
    return this.memoryLimit;
  }
}
