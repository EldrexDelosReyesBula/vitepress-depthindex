// src/client/granular-index-loader.ts

import { IndexDownloadConfig } from '../types/index.js';

export interface PageChunk {
  url: string;
  hash: string;
  data: Uint8Array;
  downloaded: number;
  lastAccessed: number;
  size: number;
}

export interface IndexManifest {
  version: string;
  buildId: string;
  pages: Record<string, PageManifestEntry>;
  removedPages: string[];
}

export interface PageManifestEntry {
  url: string;
  title: string;
  hash: string;
  size: number;
  chunkUrl: string;
  lastModified: string;
}

export interface UpdateResult {
  hasUpdates: boolean;
  changedPages: string[];
  removedPages: string[];
  addedPages: string[];
}

export class GranularIndexLoader {
  private config: IndexDownloadConfig;
  private cache: Map<string, PageChunk> = new Map();
  private manifest: IndexManifest | null = null;
  private db: IDBDatabase | null = null;
  private totalCachedSize = 0;
  private visitHistory: Set<string> = new Set();
  private lastUrl = '';

  constructor(config: IndexDownloadConfig = {}) {
    this.config = {
      strategy: 'full',
      maxCacheSizeMB: 50,
      preloadRelatedPages: 2,
      downloadOnDemand: true,
      removeDeletedPages: true,
      ...config,
    };
  }

  /**
   * Initialize — fetch manifest and determine what to download.
   */
  async init(): Promise<void> {
    await this.initDatabase();
    await this.loadManifest();

    switch (this.config.strategy) {
      case 'full':
        await this.downloadFullIndex();
        break;
      case 'lazy':
        console.log('[DepthIndex] Lazy mode: pages download on visit');
        break;
      case 'eager':
        await this.downloadCurrentAndRelated();
        break;
      case 'offline':
        await this.downloadFullIndex();
        break;
    }

    if (typeof window !== 'undefined') {
      this.watchNavigation();
      window.addEventListener('depthindex:page-needed', this.onPageNeeded.bind(this));
    }
  }

  /**
   * Check for updates when dev pushes new version.
   */
  async checkForUpdates(): Promise<UpdateResult> {
    const newManifest = await this.fetchManifest();

    if (!this.manifest || newManifest.buildId === this.manifest.buildId) {
      return { hasUpdates: false, changedPages: [], removedPages: [], addedPages: [] };
    }

    const changedPages: string[] = [];
    const removedPages: string[] = [];
    const addedPages: string[] = [];

    // Find changed pages
    for (const [url, entry] of Object.entries(newManifest.pages)) {
      const oldEntry = this.manifest.pages[url];
      if (!oldEntry) {
        addedPages.push(url);
      } else if (oldEntry.hash !== entry.hash) {
        changedPages.push(url);
      }
    }

    // Find removed pages
    for (const url of Object.keys(this.manifest.pages)) {
      if (!newManifest.pages[url]) {
        removedPages.push(url);
      }
    }

    // Add explicitly removed pages
    for (const url of newManifest.removedPages || []) {
      if (!removedPages.includes(url)) {
        removedPages.push(url);
      }
    }

    // Update changed pages in cache
    for (const url of changedPages) {
      if (this.cache.has(url)) {
        console.log(`[DepthIndex] Updating changed page: ${url}`);
        await this.downloadPage(url);
      }
    }

    // Remove deleted pages from device
    if (this.config.removeDeletedPages) {
      for (const url of removedPages) {
        if (this.cache.has(url)) {
          console.log(`[DepthIndex] Removing deleted page: ${url}`);
          this.cache.delete(url);
          await this.removeFromStorage(url);
        }
      }
    }

    // Update manifest
    this.manifest = newManifest;
    await this.saveManifest(newManifest);

    return { hasUpdates: true, changedPages, removedPages, addedPages };
  }

  /**
   * Called when user visits a page.
   */
  async onPageVisit(url: string): Promise<void> {
    this.visitHistory.add(url);

    if (this.cache.has(url)) {
      const chunk = this.cache.get(url)!;
      chunk.lastAccessed = Date.now();
      return;
    }

    if (this.config.strategy === 'lazy' || this.config.strategy === 'eager') {
      await this.downloadPage(url);
    }

    if (this.config.strategy === 'eager' && (this.config.preloadRelatedPages || 0) > 0) {
      const related = this.findRelatedPages(url);
      for (const relatedUrl of related.slice(0, this.config.preloadRelatedPages)) {
        if (!this.cache.has(relatedUrl)) {
          this.downloadPage(relatedUrl).catch(() => {});
        }
      }
    }
  }

  /**
   * Called when AI search needs a page not yet downloaded.
   */
  private async onPageNeeded(event: Event): Promise<void> {
    const { url } = (event as CustomEvent).detail;

    if (this.cache.has(url)) return;

    if (this.config.downloadOnDemand) {
      console.log(`[DepthIndex] AI requested page, downloading: ${url}`);
      await this.downloadPage(url);
    }
  }

  /**
   * Download a single page chunk.
   */

  async downloadPage(url: string): Promise<void> {
    if (!this.manifest) return;

    const entry = this.manifest.pages[url];
    if (!entry) {
      console.warn(`[DepthIndex] Page not in manifest: ${url}`);
      return;
    }

    if (this.totalCachedSize + entry.size > (this.config.maxCacheSizeMB || 50) * 1024 * 1024) {
      await this.evictOldest();
    }

    try {
      if (typeof fetch !== 'undefined') {
        const response = await fetch(entry.chunkUrl);
        const data = new Uint8Array(await response.arrayBuffer());

        const chunk: PageChunk = {
          url,
          hash: entry.hash,
          data,
          downloaded: Date.now(),
          lastAccessed: Date.now(),
          size: entry.size,
        };

        this.cache.set(url, chunk);
        this.totalCachedSize += entry.size;
        await this.saveToStorage(url, chunk);

        console.log(`[DepthIndex] Downloaded: ${url} (${(entry.size / 1024).toFixed(1)}KB)`);
      }
    } catch (error) {
      console.warn(`[DepthIndex] Failed to download page: ${url}`, error);
    }
  }

  /**
   * Download full index (for 'full' and 'offline' modes).
   */
  private async downloadFullIndex(): Promise<void> {
    if (!this.manifest) return;

    console.log('[DepthIndex] Downloading full index...');
    const pages = Object.keys(this.manifest.pages);

    for (let i = 0; i < pages.length; i++) {
      await this.downloadPage(pages[i]);

      if (i % 10 === 0) {
        await new Promise(r => setTimeout(r, 0));
      }
    }

    console.log(`[DepthIndex] Full index downloaded: ${pages.length} pages`);
  }

  /**
   * Download current page + related.
   */
  private async downloadCurrentAndRelated(): Promise<void> {
    const currentUrl = typeof window !== 'undefined' ? window.location.pathname : '/';
    await this.onPageVisit(currentUrl);
  }

  /**
   * Find related pages from sidebar/links on current page.
   */
  private findRelatedPages(currentUrl: string): string[] {
    if (typeof document === 'undefined') return [];

    const related: string[] = [];

    const sidebarLinks = document.querySelectorAll('.VPSidebarItem .VPLink');
    sidebarLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href !== currentUrl) {
        related.push(href);
      }
    });

    const contentLinks = document.querySelectorAll('.vp-doc a[href]');
    contentLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('/') && !related.includes(href)) {
        related.push(href);
      }
    });

    return related;
  }

  /**
   * Evict oldest cached pages when size limit reached.
   */
  private async evictOldest(): Promise<void> {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    const toRemove = Math.ceil(entries.length * 0.2);

    for (let i = 0; i < toRemove; i++) {
      const [url, chunk] = entries[i];
      this.cache.delete(url);
      this.totalCachedSize -= chunk.size;
      await this.removeFromStorage(url);
    }

    console.log(`[DepthIndex] Evicted ${toRemove} old pages from cache`);
  }

  /**
   * Get cached page data for search.
   */
  getPage(url: string): PageChunk | undefined {
    const chunk = this.cache.get(url);
    if (chunk) {
      chunk.lastAccessed = Date.now();
    }
    return chunk;
  }

  /**
   * Check if page is cached.
   */
  isCached(url: string): boolean {
    return this.cache.has(url);
  }

  /**
   * Get cache stats.
   */
  getStats(): { totalPages: number; totalSize: number; maxSize: number } {
    return {
      totalPages: this.cache.size,
      totalSize: this.totalCachedSize,
      maxSize: (this.config.maxCacheSizeMB || 50) * 1024 * 1024,
    };
  }

  // ─── Storage ───

  private async initDatabase(): Promise<void> {
    if (typeof indexedDB === 'undefined') return;

    return new Promise((resolve) => {
      const request = indexedDB.open('depthindex-page-cache', 2);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('pages')) {
          db.createObjectStore('pages', { keyPath: 'url' });
        }
        if (!db.objectStoreNames.contains('manifest')) {
          db.createObjectStore('manifest', { keyPath: 'buildId' });
        }
      };
      request.onsuccess = () => { this.db = request.result; resolve(); };
      request.onerror = () => resolve();
    });
  }

  private async saveToStorage(url: string, chunk: PageChunk): Promise<void> {
    if (!this.db) return;
    try {
      const tx = this.db.transaction('pages', 'readwrite');
      tx.objectStore('pages').put(chunk);
    } catch {}
  }

  private async removeFromStorage(url: string): Promise<void> {
    if (!this.db) return;
    try {
      const tx = this.db.transaction('pages', 'readwrite');
      tx.objectStore('pages').delete(url);
    } catch {}
  }

  private async loadManifest(): Promise<void> {
    try {
      if (typeof fetch !== 'undefined') {
        const response = await fetch('/.well-known/depthindex-manifest.json');
        this.manifest = await response.json();
        await this.saveManifest(this.manifest!);
      }
    } catch {
      if (this.db) {
        try {
          const tx = this.db.transaction('manifest', 'readonly');
          const store = tx.objectStore('manifest');
          const request = store.getAll();
          request.onsuccess = () => {
            if (request.result && request.result.length > 0) {
              this.manifest = request.result[request.result.length - 1];
            }
          };
        } catch {}
      }
    }
  }

  private async fetchManifest(): Promise<IndexManifest> {
    if (typeof fetch !== 'undefined') {
      const response = await fetch('/.well-known/depthindex-manifest.json', {
        cache: 'no-cache',
      });
      return response.json();
    }
    throw new Error('fetch unavailable');
  }

  private async saveManifest(manifest: IndexManifest): Promise<void> {
    if (!this.db) return;
    try {
      const tx = this.db.transaction('manifest', 'readwrite');
      tx.objectStore('manifest').put(manifest);
    } catch {}
  }

  private watchNavigation(): void {
    if (typeof document === 'undefined') return;

    const observer = new MutationObserver(() => {
      const newUrl = window.location.pathname;
      if (newUrl !== this.lastUrl) {
        this.lastUrl = newUrl;
        this.onPageVisit(newUrl);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('popstate', () => {
      this.onPageVisit(window.location.pathname);
    });

    this.lastUrl = window.location.pathname;
    this.onPageVisit(this.lastUrl);
  }
}
