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

  // Expanded stop words with categories
  private stopWords = new Set([
    // Question frames
    'what', 'is', 'the', 'how', 'do', 'i', 'can', 'you', 'a', 'an',
    'of', 'in', 'to', 'for', 'why', 'who', 'where', 'when', 'which',
    'show', 'me', 'explain', 'tell', 'about', 'does', 'did', 'will',
    'would', 'could', 'should', 'are', 'am', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'having',
    
    // Pronouns
    'it', 'its', 'they', 'them', 'their', 'we', 'us', 'our', 'my',
    'your', 'he', 'she', 'his', 'her', 'him',
    
    // Prepositions & particles
    'on', 'at', 'by', 'with', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'under', 'over',
    'and', 'but', 'or', 'not', 'no', 'so', 'than', 'then', 'also',
    'just', 'only', 'very', 'too', 'quite', 'rather', 'really',
    
    // Documentation-specific noise
    'page', 'section', 'docs', 'documentation', 'readme', 'guide',
    'tutorial', 'example', 'please', 'need', 'want', 'like', 'try',
    'using', 'use', 'get', 'got', 'make', 'made', 'know', 'see',
  ]);
  
  // Technical keyword boost list (terms that indicate genuine interest)
  private technicalBoost = new Set([
    'api', 'config', 'setup', 'install', 'deploy', 'build', 'test',
    'debug', 'error', 'database', 'server', 'client', 'auth', 'token',
    'plugin', 'module', 'component', 'function', 'class', 'method',
  ]);
  
  // Minimum meaningful word length
  private minWordLength = 3;

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

  /**
   * Extract meaningful keywords from a query for personalization
   * Uses multi-stage filtering to identify genuine topics of interest
   */
  public extractKeyTerms(query: string): string[] {
    // Stage 1: Normalize and tokenize
    const normalized = query.toLowerCase().trim();
    const tokens = normalized
      .split(/[\s,;:.!?()\[\]{}'"]+/)
      .filter(Boolean);
    
    // Stage 2: Remove stop words and short tokens
    const filtered = tokens.filter(token => 
      !this.stopWords.has(token) && token.length >= this.minWordLength
    );
    
    // Stage 3: Stem common technical suffixes for better matching
    const stemmed = filtered.map(token => this.stemToken(token));
    
    // Stage 4: Deduplicate while preserving order
    const unique = [...new Set(stemmed)];
    
    // Stage 5: If query was a question, try to identify the main subject
    if (this.isQuestionFrame(normalized) && unique.length > 1) {
      // The last meaningful terms are usually the subject
      // e.g., "how do I configure the database" → "configure database"
      return unique.slice(-2);
    }
    
    // Stage 6: Boost technical terms if they appear
    const technical = unique.filter(t => this.technicalBoost.has(t));
    const nonTechnical = unique.filter(t => !this.technicalBoost.has(t));
    
    // Return technical terms first, then up to 3 non-technical terms
    return [...technical, ...nonTechnical].slice(0, 5);
  }

  /**
   * Simple Porter-style stemmer for technical terms
   * Reduces variations like "configuring", "configured" → "config"
   */
  private stemToken(token: string): string {
    const suffixes = ['uration', 'ment', 'able', 'ible', 'tion', 'uring', 'ured', 'ure', 'ing', 'ed', 'es', 's'];
    
    for (const suffix of suffixes) {
      if (token.endsWith(suffix) && token.length - suffix.length >= 4) {
        return token.slice(0, -suffix.length);
      }
    }
    
    return token;
  }

  /**
   * Detect if query is framed as a question
   */
  private isQuestionFrame(text: string): boolean {
    const questionPatterns = [
      /^(how|what|why|when|where|who|can|could|would|will|do|does|did|is|are|was|were)\b/i,
      /\?$/,
      /^(show|tell|explain|describe|list|find)\b.*\b(me|us)\b/i,
    ];
    
    return questionPatterns.some(pattern => pattern.test(text));
  }

  public recordQuery(query: string, results?: SearchResult[]): void {
    if (!this.enabled || typeof window === 'undefined') return;

    // 1. Save to History
    const history = this.getHistory();
    const newItem: SearchHistoryItem = {
      query,
      timestamp: Date.now()
    };
    const updatedHistory = [newItem, ...history.filter(h => h.query !== query)].slice(0, 15);
    window.localStorage.setItem(this.storageKeyHistory, JSON.stringify(updatedHistory));

    // 2. Update Topic Affinity
    const affinity = this.getAffinity();
    const terms = this.extractKeyTerms(query);
    
    for (const term of terms) {
      const current = affinity[term] || 0;
      affinity[term] = current + 1;
    }

    // Mix in category extraction from search results if available
    if (results) {
      results.forEach(res => {
        const category = res.chunk.pageTitle.split(' ')[0] || res.chunk.pageTitle;
        const normalizedCat = this.stemToken(category.toLowerCase());
        if (normalizedCat.length > 2 && !this.stopWords.has(normalizedCat)) {
          affinity[normalizedCat] = (affinity[normalizedCat] || 0) + 0.5;
        }
      });
    }

    // Sort and keep top 10 topics
    const sortedKeys = Object.keys(affinity).sort((a, b) => affinity[b] - affinity[a]);
    const trimmedAffinity: Record<string, number> = {};
    sortedKeys.slice(0, 10).forEach(k => {
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
    const topTopics = Object.keys(affinity)
      .sort((a, b) => affinity[b] - affinity[a])
      .slice(0, 10);
    const history = this.getHistory();
    const suggestions: string[] = [];

    // Contextual suggestion templates based on top topics
    const templates = [
      (topic: string) => `How do I configure ${topic}?`,
      (topic: string) => `What is ${topic}?`,
      (topic: string) => `Tell me about ${topic} setup`,
      (topic: string) => `Show me ${topic} examples`,
      (topic: string) => `Explain ${topic} configuration`,
    ];

    for (const topic of topTopics) {
      if (suggestions.length >= 5) break;

      const weight = Math.floor(affinity[topic]) || 1;
      const templateIndex = Math.min(weight - 1, templates.length - 1);
      const suggestion = templates[templateIndex](topic);

      const words = suggestion.split(' ');
      const lastWord = words[words.length - 1].replace(/[?.!]/g, '');
      if (!this.stopWords.has(lastWord.toLowerCase()) && lastWord.length >= this.minWordLength) {
        suggestions.push(suggestion);
      }
    }

    // Add suggestions based on last query
    if (history.length > 0 && suggestions.length < 5) {
      const lastQuery = history[0].query.toLowerCase();
      if (lastQuery.includes('install') || lastQuery.includes('setup')) {
        suggestions.push('What are the system prerequisites?');
      } else if (lastQuery.includes('error') || lastQuery.includes('fail')) {
        suggestions.push('Where can I see the logs for troubleshooting?');
      }
    }

    // Mix in defaults
    const merged = [...suggestions, ...defaults];
    const unique = Array.from(new Set(merged));
    
    // Verify suggestion ends cleanly (not with stop-word)
    const finalFiltered = unique.filter(s => {
      const words = s.split(' ');
      const last = words[words.length - 1].replace(/[?.!]/g, '').toLowerCase();
      return !this.stopWords.has(last) && last.length >= this.minWordLength;
    });

    return finalFiltered.slice(0, 5);
  }
}
