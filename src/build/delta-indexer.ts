import crypto from 'crypto';
import zlib from 'zlib';
import { ExtractedPage } from '../types/index.js';

export interface BuildManifest {
  version: string;
  buildId: string;
  timestamp: string;
  signature: string;
  files: Record<string, { hash: string; size: number }>;
  removedPages: string[];
  addedPages: string[];
  modifiedPages: string[];
  minClientVersion: string;
  publicKey: string;
}

export class DeltaIndexer {
  /**
   * Generate delta between builds.
   * Only changed pages are included in the update.
   */
  async generateDelta(
    currentPages: ExtractedPage[],
    previousBuild: BuildManifest | null
  ): Promise<{
    fullIndex: Uint8Array;
    deltaIndex: Uint8Array | null;
    manifest: BuildManifest;
    removedPages: string[];
  }> {
    // Generate full index (always available for new users)
    const fullIndex = await this.buildFullIndex(currentPages);
    
    // If no previous build, no delta needed
    if (!previousBuild) {
      return {
        fullIndex,
        deltaIndex: null,
        manifest: this.createManifest(currentPages, [], [], [], null),
        removedPages: [],
      };
    }
    
    // Compare with previous build
    const previousPages = await this.loadPreviousPages(previousBuild);
    const { added, modified, removed } = this.diffPages(currentPages, previousPages);
    
    // Build delta index (only changed pages)
    const deltaIndex = added.length + modified.length > 0
      ? await this.buildDeltaIndex([...added, ...modified])
      : null;
    
    const manifest = this.createManifest(
      currentPages, added, modified, removed, previousBuild
    );
    
    return {
      fullIndex,
      deltaIndex,
      manifest,
      removedPages: removed.map(p => p.url),
    };
  }
  
  private diffPages(
    current: ExtractedPage[],
    previous: ExtractedPage[]
  ): {
    added: ExtractedPage[];
    modified: ExtractedPage[];
    removed: ExtractedPage[];
  } {
    const currentMap = new Map(current.map(p => [p.url, p]));
    const previousMap = new Map(previous.map(p => [p.url, p]));
    
    const added: ExtractedPage[] = [];
    const modified: ExtractedPage[] = [];
    const removed: ExtractedPage[] = [];
    
    // Find added and modified
    for (const [url, page] of currentMap) {
      const prev = previousMap.get(url);
      if (!prev) {
        added.push(page);
      } else if (this.pageHash(page) !== this.pageHash(prev)) {
        modified.push(page);
      }
    }
    
    // Find removed
    for (const [url, page] of previousMap) {
      if (!currentMap.has(url)) {
        removed.push(page);
      }
    }
    
    return { added, modified, removed };
  }
  
  private pageHash(page: ExtractedPage): string {
    return this.sha256(
      page.url + page.title + JSON.stringify(page.sections)
    );
  }
  
  private sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  private createManifest(
    pages: ExtractedPage[],
    added: ExtractedPage[],
    modified: ExtractedPage[],
    removed: ExtractedPage[],
    previousBuild: BuildManifest | null
  ): BuildManifest {
    const buildId = this.generateBuildId();
    
    return {
      version: '1.1.7',
      buildId,
      timestamp: new Date().toISOString(),
      signature: '', // Signed during deploy
      files: {
        'index.json.br': { hash: '', size: 0 },
        'llms.txt': { hash: '', size: 0 },
      },
      removedPages: removed.map(p => p.url),
      addedPages: added.map(p => p.url),
      modifiedPages: modified.map(p => p.url),
      minClientVersion: '1.1.0',
      publicKey: '', // Public key for signature verification
    };
  }
  
  private generateBuildId(): string {
    return `bld_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 10)}`;
  }
  
  private async buildFullIndex(pages: ExtractedPage[]): Promise<Uint8Array> {
    const data = new TextEncoder().encode(JSON.stringify(pages));
    return this.brotliCompress(data);
  }
  
  private async buildDeltaIndex(pages: ExtractedPage[]): Promise<Uint8Array> {
    const data = new TextEncoder().encode(JSON.stringify(pages));
    return this.brotliCompress(data);
  }
  
  private async brotliCompress(data: Uint8Array): Promise<Uint8Array> {
    if (typeof window === 'undefined') {
      return new Promise((resolve, reject) => {
        zlib.brotliCompress(data, (err, result) => {
          if (err) reject(err);
          else resolve(new Uint8Array(result));
        });
      });
    }
    return data; // Browser: server does compression
  }
  
  private async loadPreviousPages(manifest: BuildManifest): Promise<ExtractedPage[]> {
    // Load from build cache
    return [];
  }
}
