// src/client/search-modes.ts
import { SearchResult } from '../types/index.js';

export type SearchMode = 'local' | 'hybrid' | 'cloud';

export interface ModeConfig {
  mode: SearchMode;
  offline: boolean;
  cloudAvailable: boolean;
}

export interface SearchResponse {
  results: SearchResult[];
  answer: string;
  source: 'local' | 'cloud' | 'hybrid' | 'hybrid-local' | 'fallback';
  latency: number;
  cloudModel?: string;
  cloudUsage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

/**
 * SearchModeManager
 *
 * Coordinates local / cloud / hybrid search execution.
 * In hybrid mode: always starts with local (fast, offline-safe), then optionally
 * enhances with cloud AI. All fallbacks are silent — users never see error states
 * from a failed cloud call when local data is available.
 */
export class SearchModeManager {
  private config: ModeConfig;
  private localEngine: any;       // DepthIndexEngine — injected
  private cloudAdapter: any;      // CloudAdapter — injected
  private synthesizer: any;       // AnswerSynthesizer — injected
  private removeConnectivityListeners: (() => void) | null = null;

  constructor(options: {
    defaultMode: SearchMode;
    localEngine: any;
    cloudAdapter: any;
    synthesizer: any;
  }) {
    this.localEngine = options.localEngine;
    this.cloudAdapter = options.cloudAdapter;
    this.synthesizer = options.synthesizer;

    this.config = {
      mode: options.defaultMode,
      offline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
      cloudAvailable: this.checkCloudAvailability(),
    };

    this.watchConnectivity();
  }

  // --- Connectivity -------------------------------------------

  private watchConnectivity(): void {
    if (typeof window === 'undefined') return;

    const handler = () => {
      const wasOffline = this.config.offline;
      this.config.offline = !navigator.onLine;

      if (wasOffline && navigator.onLine) {
        console.log('[DepthIndex] Back online — cloud available again');
        this.config.cloudAvailable = this.checkCloudAvailability();
      } else if (!navigator.onLine) {
        console.log('[DepthIndex] Offline — using local search only');
      }
    };

    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);

    this.removeConnectivityListeners = () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  }

  // --- Public API ---------------------------------------------

  async search(query: string): Promise<SearchResponse> {
    const effective = this.getEffectiveMode();
    switch (effective) {
      case 'cloud':   return this.searchCloud(query);
      case 'hybrid':  return this.searchHybrid(query);
      default:        return this.searchLocal(query);
    }
  }

  setMode(mode: SearchMode): void {
    if (mode === 'cloud' && !navigator.onLine) {
      console.warn('[DepthIndex] Cannot switch to cloud mode while offline — staying on current mode');
      return;
    }
    this.config.mode = mode;
    try { localStorage.setItem('depthindex-search-mode', mode); } catch {}
  }

  getEffectiveMode(): SearchMode {
    if (this.config.offline) return 'local';
    if (this.config.mode === 'cloud' && !this.config.cloudAvailable) return 'local';
    return this.config.mode;
  }

  isCloudAvailable(): boolean {
    return this.config.cloudAvailable && !this.config.offline;
  }

  destroy(): void {
    this.removeConnectivityListeners?.();
  }

  // --- Search Strategies --------------------------------------

  private async searchLocal(query: string): Promise<SearchResponse> {
    const t0 = performance.now();
    try {
      const results: SearchResult[] = await this.localEngine.search(query, 10);
      const answer = await this.synthesizer.synthesize(query, results, { mode: 'local' });
      return { results, answer: answer.content ?? answer, source: 'local', latency: performance.now() - t0 };
    } catch (err) {
      console.error('[DepthIndex] Local search failed:', err);
      return this.fallbackResponse();
    }
  }

  private async searchCloud(query: string): Promise<SearchResponse> {
    if (!navigator.onLine || !this.config.cloudAvailable) {
      return this.searchLocal(query);
    }
    const t0 = performance.now();
    try {
      const localResults: SearchResult[] = await this.localEngine.search(query, 5);
      const docContext = this.buildDocumentContext(localResults);
      const cloudResponse = await this.cloudAdapter.query(
        query,
        {
          provider: this.cloudAdapter.getActiveProvider?.() ?? 'gemini',
          apiKey: this.cloudAdapter.getApiKey?.() ?? '',
          model: this.cloudAdapter.getModel?.() ?? '',
          options: { scopeToDocs: true, maxTokens: 2000, temperature: 0.3 },
        },
        docContext
      );
      return {
        results: localResults,
        answer: cloudResponse.content,
        source: 'cloud',
        latency: performance.now() - t0,
        cloudModel: cloudResponse.model,
        cloudUsage: cloudResponse.usage,
      };
    } catch (err: any) {
      console.warn('[DepthIndex] Cloud search failed, using local:', err?.message);
      return this.searchLocal(query);
    }
  }

  private async searchHybrid(query: string): Promise<SearchResponse> {
    const t0 = performance.now();

    // Step 1: Always run local first
    let localResults: SearchResult[] = [];
    let localAnswer: any = '';
    try {
      localResults = await this.localEngine.search(query, 10);
      const synthesized = await this.synthesizer.synthesize(query, localResults, { mode: 'local' });
      localAnswer = synthesized.content ?? synthesized;
    } catch (err) {
      console.error('[DepthIndex] Local search failed in hybrid mode:', err);
      return this.fallbackResponse();
    }

    // Step 2: Try cloud enhancement (silent failure)
    if (navigator.onLine && this.config.cloudAvailable) {
      try {
        const docContext = this.buildDocumentContext(localResults);
        const cloudResponse = await this.cloudAdapter.query(
          query,
          {
            provider: this.cloudAdapter.getActiveProvider?.() ?? 'gemini',
            apiKey: this.cloudAdapter.getApiKey?.() ?? '',
            model: this.cloudAdapter.getModel?.() ?? '',
            options: { scopeToDocs: true, maxTokens: 2000, temperature: 0.3 },
          },
          docContext
        );
        // Use cloud response if it's meaningfully better
        if (cloudResponse.content && cloudResponse.content.length > (localAnswer?.length ?? 0) * 0.8) {
          return {
            results: localResults,
            answer: cloudResponse.content,
            source: 'hybrid',
            latency: performance.now() - t0,
            cloudModel: cloudResponse.model,
            cloudUsage: cloudResponse.usage,
          };
        }
      } catch (err: any) {
        // Silent fallback — user stays on local answer
        console.log('[DepthIndex] Cloud enhancement skipped:', err?.message);
      }
    }

    return {
      results: localResults,
      answer: localAnswer,
      source: 'hybrid-local',
      latency: performance.now() - t0,
    };
  }

  // --- Helpers ------------------------------------------------

  private buildDocumentContext(results: SearchResult[]): string {
    let context = 'DOCUMENTATION CONTENT (use ONLY this information):\n\n';
    for (const result of results.slice(0, 5)) {
      context += `## ${result.chunk.pageTitle}\n`;
      if (result.chunk.heading) context += `Section: ${result.chunk.heading}\n`;
      context += `${result.chunk.content}\n\n`;
      if (result.chunk.codeBlocks) {
        for (const block of result.chunk.codeBlocks) {
          context += `\`\`\`${block.language}\n${block.code}\n\`\`\`\n\n`;
        }
      }
    }
    context += '\nIMPORTANT: Answer ONLY based on the above documentation. If information is not found, say so clearly. Do NOT fabricate information.';
    return context;
  }

  private fallbackResponse(): SearchResponse {
    return {
      results: [],
      answer: `I wasn't able to process your question at this moment. Please try again.\n\nIn the meantime, you can browse the documentation using the sidebar navigation.`,
      source: 'fallback',
      latency: 0,
    };
  }

  private checkCloudAvailability(): boolean {
    try {
      // Check env key (injected at build time)
      if (typeof window !== 'undefined' && (window as any).__DI_CLOUD_KEY__) return true;
    } catch {}

    try {
      const stored = localStorage.getItem('depthindex-cloud-config');
      if (stored) {
        const config = JSON.parse(stored);
        return !!(config.apiKey && config.provider);
      }
    } catch {}

    // Also check individual provider keys
    try {
      const providers = ['openai', 'gemini', 'anthropic', 'custom'];
      return providers.some(p => !!localStorage.getItem(`depthindex_api_key_${p}`));
    } catch {}

    return false;
  }

  /** Re-check cloud availability (call after user saves API key) */
  refreshCloudAvailability(): void {
    this.config.cloudAvailable = this.checkCloudAvailability();
  }
}

/** Restore persisted mode from localStorage */
export function getPersistedMode(defaultMode: SearchMode = 'local'): SearchMode {
  try {
    const saved = localStorage.getItem('depthindex-search-mode') as SearchMode | null;
    if (saved && ['local', 'hybrid', 'cloud'].includes(saved)) return saved;
  } catch {}
  return defaultMode;
}
