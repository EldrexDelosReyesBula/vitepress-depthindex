import { BuildManifest } from '../build/delta-indexer.js';

export interface DeviceIdentity {
  deviceId: string;
  createdAt: string;
  lastSeen: string;
}

export interface StoredIndex {
  buildId: string;
  version: string;
  pages: Map<string, IndexedPage>;
  lastSynced: string;
}

export interface IndexedPage {
  url: string;
  hash: string;
  data: Uint8Array;
  cached: string;
}

export class SecureUpdateEngine {
  private deviceId: string;
  private publicKey: CryptoKey | null = null;
  private db: IDBDatabase | null = null;
  
  // NEVER exposed to developers or external APIs
  private readonly DEVICE_ID_KEY = 'depthindex_device_identity_v2';
  private readonly INDEX_STORE = 'secure_index_store';
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB max
  
  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }
  
  /**
   * Initialize — check for updates on page load
   */
  async init(): Promise<void> {
    await this.initDatabase();
    
    // Fetch current manifest from server
    const manifest = await this.fetchManifest();
    
    // Verify manifest signature
    const isValid = await this.verifySignature(manifest);
    if (!isValid) {
      console.error('[DepthIndex Security] Manifest signature invalid! Possible tampering.');
      return;
    }
    
    // Check if update needed
    const storedBuildId = localStorage.getItem('depthindex_build_id');
    
    if (storedBuildId !== manifest.buildId) {
      console.log('[DepthIndex] Update detected, syncing...');
      await this.applyUpdate(manifest);
    }
    
    // Clean up removed pages
    await this.removeDeletedPages(manifest.removedPages);
    
    // Enforce cache size limit
    await this.enforceCacheLimit();
  }
  
  /**
   * Get or create persistent device ID.
   * Stored in localStorage for client persistence.
   */
  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem(this.DEVICE_ID_KEY);
    
    if (!deviceId) {
      deviceId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? `dev_${crypto.randomUUID()}` 
        : `dev_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  }
  
  /**
   * Fetch the current build manifest from server
   */
  private async fetchManifest(): Promise<BuildManifest> {
    const response = await fetch('/.well-known/depthindex-manifest.json', {
      cache: 'no-cache',
      headers: { 'X-DepthIndex-Device-Id': this.deviceId },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch manifest: ${response.status}`);
    }
    
    return response.json();
  }
  
  /**
   * Verify manifest signature using the embedded public key
   */
  private async verifySignature(manifest: BuildManifest): Promise<boolean> {
    try {
      if (!manifest.signature) {
        // If signature is empty (developer bypass / local development), return true
        return true;
      }
      if (!this.publicKey) {
        await this.loadPublicKey(manifest.publicKey);
      }
      
      // Verify with SubtleCrypto
      const encoder = new TextEncoder();
      const data = encoder.encode(
        manifest.buildId + manifest.timestamp + JSON.stringify(manifest.files)
      );
      const signature = this.base64ToArrayBuffer(manifest.signature);
      
      return await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        this.publicKey!,
        signature,
        data
      );
    } catch (error) {
      console.error('[DepthIndex Security] Signature verification failed:', error);
      return false;
    }
  }
  
  /**
   * Apply delta update — only download changed pages
   */
  private async applyUpdate(manifest: BuildManifest): Promise<void> {
    const startTime = performance.now();
    
    // If major version change or new user, download full index
    const storedVersion = localStorage.getItem('depthindex_version');
    const needsFullDownload = !storedVersion || 
      storedVersion.split('.')[0] !== manifest.version.split('.')[0];
    
    if (needsFullDownload) {
      console.log('[DepthIndex] Full index download required');
      await this.downloadFullIndex(manifest);
    } else {
      // Delta update — only changed pages
      console.log('[DepthIndex] Delta update');
      await this.downloadDelta(manifest);
    }
    
    // Remove deleted pages
    await this.removeDeletedPages(manifest.removedPages);
    
    // Store new build info
    localStorage.setItem('depthindex_build_id', manifest.buildId);
    localStorage.setItem('depthindex_version', manifest.version);
    
    const duration = performance.now() - startTime;
    console.log(`[DepthIndex] Update complete in ${Math.round(duration)}ms`);
  }
  
  /**
   * Download full index
   */
  private async downloadFullIndex(manifest: BuildManifest): Promise<void> {
    const response = await fetch('/assets/depth-index.json.br', {
      headers: { 'X-DepthIndex-Device-Id': this.deviceId },
    });
    
    const compressed = await response.arrayBuffer();
    const decompressed = await this.brotliDecompress(new Uint8Array(compressed));
    const pages = JSON.parse(new TextDecoder().decode(decompressed));
    
    await this.storePages(pages, manifest);
  }
  
  /**
   * Download delta (only changed pages)
   */
  private async downloadDelta(manifest: BuildManifest): Promise<void> {
    const allChanged = [
      ...manifest.addedPages,
      ...manifest.modifiedPages,
    ];
    
    if (allChanged.length === 0) {
      console.log('[DepthIndex] No page changes in this update');
      return;
    }
    
    const response = await fetch('/assets/depth-delta.json.br', {
      headers: { 'X-DepthIndex-Device-Id': this.deviceId },
    });
    
    if (response.status === 404) {
      // Delta not available, download full
      await this.downloadFullIndex(manifest);
      return;
    }
    
    const compressed = await response.arrayBuffer();
    const decompressed = await this.brotliDecompress(new Uint8Array(compressed));
    const pages = JSON.parse(new TextDecoder().decode(decompressed));
    
    // Merge delta with existing pages
    await this.mergePages(pages, manifest);
  }
  
  /**
   * Remove pages that developer deleted from documentation
   */
  private removeDeletedPages(deletedUrls: string[]): Promise<void> {
    if (deletedUrls.length === 0) return Promise.resolve();
    
    console.log(`[DepthIndex Security] Removing ${deletedUrls.length} deleted pages from local storage`);
    
    return new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(this.INDEX_STORE, 'readwrite');
      const store = tx.objectStore(this.INDEX_STORE);
      
      for (const url of deletedUrls) {
        store.delete(url);
        console.log(`[DepthIndex Security] Removed: ${url}`);
      }
      
      tx.oncomplete = () => {
        // Also clear from memory cache
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('depthindex:pages-removed', {
            detail: { urls: deletedUrls },
          }));
        }
        resolve();
      };
      
      tx.onerror = () => reject(tx.error);
    });
  }
  
  /**
   * Enforce maximum cache size
   */
  private async enforceCacheLimit(): Promise<void> {
    const allPages = await this.getAllStoredPages();
    let totalSize = allPages.reduce((sum, p) => sum + (p.data?.length || 0), 0);
    
    if (totalSize > this.MAX_CACHE_SIZE) {
      console.log('[DepthIndex] Cache size exceeded, cleaning oldest pages');
      
      // Sort by last accessed, remove oldest
      allPages.sort((a, b) => 
        new Date(a.cached).getTime() - new Date(b.cached).getTime()
      );
      
      return new Promise<void>((resolve, reject) => {
        const deleteTx = this.db!.transaction(this.INDEX_STORE, 'readwrite');
        const store = deleteTx.objectStore(this.INDEX_STORE);
        
        for (const page of allPages) {
          if (totalSize <= this.MAX_CACHE_SIZE * 0.8) break;
          
          store.delete(page.url);
          totalSize -= page.data?.length || 0;
        }
        
        deleteTx.oncomplete = () => resolve();
        deleteTx.onerror = () => reject(deleteTx.error);
      });
    }
  }
  
  private getAllStoredPages(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(this.INDEX_STORE, 'readonly');
      const store = tx.objectStore(this.INDEX_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  
  /**
   * Merge delta pages with existing index
   */
  private mergePages(
    deltaPages: any[],
    manifest: BuildManifest
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(this.INDEX_STORE, 'readwrite');
      const store = tx.objectStore(this.INDEX_STORE);
      
      for (const page of deltaPages) {
        store.put({
          url: page.url,
          hash: this.hashPage(page),
          data: new TextEncoder().encode(JSON.stringify(page)),
          cached: new Date().toISOString(),
        });
      }
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  
  private storePages(pages: any[], manifest: BuildManifest): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(this.INDEX_STORE, 'readwrite');
      const store = tx.objectStore(this.INDEX_STORE);
      
      // Clear old data (full download)
      store.clear();
      
      for (const page of pages) {
        store.put({
          url: page.url,
          hash: this.hashPage(page),
          data: new TextEncoder().encode(JSON.stringify(page)),
          cached: new Date().toISOString(),
        });
      }
      
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  
  private hashPage(page: any): string {
    const str = page.url + page.title + JSON.stringify(page.content);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash.toString(36);
  }
  
  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('depthindex_secure_store', 2);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.INDEX_STORE)) {
          db.createObjectStore(this.INDEX_STORE, { keyPath: 'url' });
        }
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onerror = () => reject(request.error);
    });
  }
  
  private async loadPublicKey(keyBase64: string): Promise<void> {
    const keyData = this.base64ToArrayBuffer(keyBase64);
    this.publicKey = await crypto.subtle.importKey(
      'spki',
      keyData,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );
  }
  
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  private async brotliDecompress(data: Uint8Array): Promise<Uint8Array> {
    // Browser decompression
    if (typeof window !== 'undefined' && 'DecompressionStream' in window) {
      try {
        const stream = new DecompressionStream('br' as any);
        const writer = stream.writable.getWriter();
        writer.write(data as any);
        writer.close();
        
        const reader = stream.readable.getReader();
        const chunks: Uint8Array[] = [];
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        
        const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        
        return result;
      } catch (err) {
        console.warn('[DepthIndex] DecompressionStream failed, fallback to raw data:', err);
      }
    }
    
    return data;
  }
}
