import { SearchResult } from '../types/index.js';

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  clickedUrl?: string;
  clickedTitle?: string;
}

export class PersonalizationEngine {
  private enabled = true;
  private storageKeyHistory = 'depthindex_history';
  private storageKeyAffinity = 'depthindex_affinity';
  private storageKeyOpt = 'depthindex_opt_in';

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      const opt = window.localStorage.getItem(this.storageKeyOpt);
      if (opt === 'false') {
        this.enabled = false;
      }
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean): void {
    this.enabled = val;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(this.storageKeyOpt, String(val));
      if (!val) {
        this.clearData();
      }
    }
  }

  public clearData(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(this.storageKeyHistory);
      window.localStorage.removeItem(this.storageKeyAffinity);
    }
  }

  public recordQuery(query: string, results: SearchResult[]): void {
    if (!this.enabled || typeof window === 'undefined') return;

    // 1. Save to History
    const history = this.getHistory();
    const newItem: SearchHistoryItem = {
      query,
      timestamp: Date.now()
    };
    // Keep last 15 searches
    const updatedHistory = [newItem, ...history.filter(h => h.query !== query)].slice(0, 15);
    window.localStorage.setItem(this.storageKeyHistory, JSON.stringify(updatedHistory));

    // 2. Update Topic Affinity
    // Extract keywords from results/query
    const affinity = this.getAffinity();
    
    // Add affinity to titles of matched pages
    results.forEach(res => {
      const category = res.chunk.pageTitle.split(' ')[0] || res.chunk.pageTitle;
      if (category.length > 2) {
        affinity[category] = (affinity[category] || 0) + 1;
      }
    });

    // Sort and keep top 5 topics
    const sortedKeys = Object.keys(affinity).sort((a, b) => affinity[b] - affinity[a]);
    const trimmedAffinity: Record<string, number> = {};
    sortedKeys.slice(0, 5).forEach(k => {
      trimmedAffinity[k] = affinity[k];
    });

    window.localStorage.setItem(this.storageKeyAffinity, JSON.stringify(trimmedAffinity));
  }

  public recordClick(query: string, url: string, title: string): void {
    if (!this.enabled || typeof window === 'undefined') return;

    const history = this.getHistory();
    const match = history.find(h => h.query === query);
    if (match) {
      match.clickedUrl = url;
      match.clickedTitle = title;
      window.localStorage.setItem(this.storageKeyHistory, JSON.stringify(history));
    }
  }

  public getHistory(): SearchHistoryItem[] {
    if (!this.enabled || typeof window === 'undefined') return [];
    try {
      const data = window.localStorage.getItem(this.storageKeyHistory);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public getAffinity(): Record<string, number> {
    if (!this.enabled || typeof window === 'undefined') return {};
    try {
      const data = window.localStorage.getItem(this.storageKeyAffinity);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  public generateSuggestions(defaults: string[] = []): string[] {
    if (!this.enabled) return defaults.slice(0, 3);

    const affinity = this.getAffinity();
    const topTopics = Object.keys(affinity).sort((a, b) => affinity[b] - affinity[a]);
    const history = this.getHistory();

    const suggestions: string[] = [];

    // Add suggestions based on top topic affinity
    if (topTopics.length > 0) {
      const topTopic = topTopics[0];
      suggestions.push(`How do I configure ${topTopic.toLowerCase()}?`);
      suggestions.push(`Show me code examples for ${topTopic.toLowerCase()}`);
    }

    // Add suggestions based on last query
    if (history.length > 0) {
      const lastQuery = history[0].query;
      if (lastQuery.toLowerCase().includes('install') || lastQuery.toLowerCase().includes('setup')) {
        suggestions.push('What are the system prerequisites?');
      } else if (lastQuery.toLowerCase().includes('error') || lastQuery.toLowerCase().includes('fail')) {
        suggestions.push('Where can I see the logs for troubleshooting?');
      } else {
        suggestions.push(`Can you explain more about ${lastQuery}?`);
      }
    }

    // Mix in default questions if we don't have enough suggestions
    const merged = [...suggestions, ...defaults];
    // Return unique suggestions
    const unique = Array.from(new Set(merged));
    return unique.slice(0, 4);
  }
}
