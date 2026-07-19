import { PIIDetector } from '../client/pii-detector.js';

export interface AnalyticsEvent {
  id: string;
  category: 'search' | 'click' | 'feedback' | 'error' | 'session' | 'navigation';
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  sessionId: string;
  pageUrl: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsConfig {
  enabled: boolean;
  storage: 'indexeddb' | 'localstorage' | 'memory' | 'none';
  externalEndpoint?: string;
  externalHeaders?: Record<string, string>;
  batchSize?: number;
  flushInterval?: number;
  maxEvents?: number;
  trackedCategories?: AnalyticsEvent['category'][];
  excludePages?: string[];
  notice?: NoticeConfig;
}

export interface NoticeConfig {
  type: 'banner' | 'modal' | 'bottom-sheet' | 'fullscreen' | 'inline';
  title: string;
  content: string;
  primaryAction?: { text: string; onClick: () => void; icon?: string };
  secondaryAction?: { text: string; onClick: () => void };
  dismissible?: boolean;
  showOnce?: boolean;
  position?: 'top' | 'bottom';
  icon?: string;
}

export interface AnalyticsDashboard {
  totalEvents: number;
  byCategory: Record<string, number>;
  topQueries: Array<{ query: string; count: number }>;
  zeroResultQueries: Array<{ query: string; count: number; lastSeen: number }>;
  topCitations: Array<{ url: string; title: string; clicks: number }>;
  feedbackRatio: { positive: number; negative: number; total: number };
  topSearchPages: Array<{ page: string; count: number }>;
  avgSessionDuration: number;
  period: { start: number; end: number };
}

export class AnalyticsEngine {
  private config: AnalyticsConfig;
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private flushTimer: any = null;
  private db: IDBDatabase | null = null;
  private piiDetector: PIIDetector;
  
  // FIELDS THAT MUST BE STRIPPED
  private readonly PII_FIELDS = [
    'email', 'phone', 'name', 'address', 'password',
    'token', 'secret', 'apiKey', 'apikey', 'api_key',
    'credential', 'ssn', 'creditcard', 'cardnumber',
  ];
  
  // USER CONFIG KEYS THAT CAN NEVER BE ACCESSED
  private readonly PROTECTED_CONFIG_KEYS = [
    'depthindex-cloud-config',
    'depthindex-api-key',
    'depthindex-user-settings',
  ];
  
  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      storage: config.storage ?? 'indexeddb',
      batchSize: config.batchSize ?? 20,
      flushInterval: config.flushInterval ?? 30000,
      maxEvents: config.maxEvents ?? 10000,
      trackedCategories: config.trackedCategories ?? [
        'search', 'click', 'feedback', 'error', 'session',
      ],
      excludePages: config.excludePages ?? [],
    };
    
    this.piiDetector = new PIIDetector();
    this.sessionId = this.generateSessionId();
    
    if (this.config.enabled) {
      this.init();
    }
  }
  
  private async init(): Promise<void> {
    if (this.config.storage === 'indexeddb') {
      await this.initIndexedDB();
      await this.loadEvents();
    }
    
    if (this.config.externalEndpoint) {
      this.startFlushTimer();
    }
    
    this.track('session', 'session_start', {
      referrer: typeof document !== 'undefined' ? (document.referrer || 'direct') : 'direct',
    });
  }
  
  async track(
    category: AnalyticsEvent['category'],
    action: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!this.config.enabled) return;
    if (!this.config.trackedCategories?.includes(category)) return;
    if (this.isExcludedPage()) return;
    
    const sanitizedMetadata = metadata ? this.sanitizeMetadata(metadata) : undefined;
    const sanitizedAction = this.sanitizeText(action);
    
    const pagePath = typeof window !== 'undefined' ? window.location.pathname : '/';
    
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      category,
      action: sanitizedAction,
      label: sanitizedMetadata?.label,
      value: sanitizedMetadata?.value,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      pageUrl: this.sanitizePageUrl(pagePath),
      metadata: sanitizedMetadata,
    };
    
    this.events.push(event);
    
    if (this.events.length > this.config.maxEvents!) {
      this.events = this.events.slice(-this.config.maxEvents!);
    }
    
    await this.persistEvent(event);
    
    if (this.config.externalEndpoint && 
        this.events.length % this.config.batchSize! === 0) {
      await this.flush();
    }
    
    // Dispatch for SDK extensions
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('depthindex:analytics-event', {
        detail: event,
      }));
    }
  }
  
  async trackSearch(query: string, resultCount: number, duration: number): Promise<void> {
    await this.track('search', 'query', {
      query: this.anonymizeQuery(query),
      resultCount,
      duration,
      hasResults: resultCount > 0,
    });
  }
  
  async trackZeroResultQuery(query: string): Promise<void> {
    const pagePath = typeof window !== 'undefined' ? window.location.pathname : '/';
    await this.track('search', 'zero_results', {
      query: this.anonymizeQuery(query),
      pageUrl: pagePath,
    });
  }
  
  async trackCitationClick(url: string, title: string): Promise<void> {
    await this.track('click', 'citation', {
      url: this.sanitizeUrl(url),
      title: this.sanitizeText(title),
    });
  }
  
  async trackFeedback(messageId: string, type: 'up' | 'down'): Promise<void> {
    await this.track('feedback', type, { messageId });
  }
  
  async trackError(category: string, message: string): Promise<void> {
    await this.track('error', 'occurred', {
      errorCategory: category,
      errorMessage: this.sanitizeText(message),
    });
  }
  
  async getDashboard(period?: { start: number; end: number }): Promise<AnalyticsDashboard> {
    const events = await this.getEvents(period);
    
    const byCategory: Record<string, number> = {};
    const queryCounts = new Map<string, number>();
    const zeroResults = new Map<string, { count: number; lastSeen: number }>();
    const citationClicks = new Map<string, { url: string; title: string; clicks: number }>();
    const pageCounts = new Map<string, number>();
    const sessions = new Map<string, { first: number; last: number }>();
    
    for (const event of events) {
      byCategory[event.category] = (byCategory[event.category] || 0) + 1;
      
      if (event.category === 'search' && event.metadata?.query) {
        const q = event.metadata.query;
        queryCounts.set(q, (queryCounts.get(q) || 0) + 1);
        if (event.action === 'zero_results') {
          zeroResults.set(q, {
            count: (zeroResults.get(q)?.count || 0) + 1,
            lastSeen: event.timestamp,
          });
        }
        const page = event.pageUrl;
        pageCounts.set(page, (pageCounts.get(page) || 0) + 1);
      }
      
      if (event.category === 'click' && event.metadata?.url) {
        const key = event.metadata.url;
        if (!citationClicks.has(key)) {
          citationClicks.set(key, { url: event.metadata.url, title: event.metadata.title || '', clicks: 0 });
        }
        citationClicks.get(key)!.clicks++;
      }
      
      if (!sessions.has(event.sessionId)) {
        sessions.set(event.sessionId, { first: event.timestamp, last: event.timestamp });
      }
      const session = sessions.get(event.sessionId)!;
      session.last = Math.max(session.last, event.timestamp);
    }
    
    const feedbackEvents = events.filter(e => e.category === 'feedback');
    const positive = feedbackEvents.filter(e => e.action === 'up').length;
    const negative = feedbackEvents.filter(e => e.action === 'down').length;
    
    const durations = Array.from(sessions.values())
      .map(s => s.last - s.first)
      .filter(d => d > 0);
    const avgSessionDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    
    return {
      totalEvents: events.length,
      byCategory,
      topQueries: Array.from(queryCounts.entries())
        .sort((a, b) => b[1] - a[1]).slice(0, 20)
        .map(([query, count]) => ({ query, count })),
      zeroResultQueries: Array.from(zeroResults.entries())
        .sort((a, b) => b[1].count - a[1].count).slice(0, 10)
        .map(([query, data]) => ({ query, ...data })),
      topCitations: Array.from(citationClicks.values())
        .sort((a, b) => b.clicks - a.clicks).slice(0, 10),
      feedbackRatio: { positive, negative, total: positive + negative },
      topSearchPages: Array.from(pageCounts.entries())
        .sort((a, b) => b[1] - a[1]).slice(0, 10)
        .map(([page, count]) => ({ page, count })),
      avgSessionDuration,
      period: period || {
        start: events[0]?.timestamp || Date.now(),
        end: events[events.length - 1]?.timestamp || Date.now(),
      },
    };
  }
  
  // ─── SANITIZATION ───
  
  private sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (this.PROTECTED_CONFIG_KEYS.some(k => key.toLowerCase().includes(k))) continue;
      if (this.PII_FIELDS.some(f => key.toLowerCase().includes(f))) continue;
      if (typeof value === 'string') sanitized[key] = this.sanitizeText(value);
      else if (typeof value === 'number' || typeof value === 'boolean') sanitized[key] = value;
    }
    return sanitized;
  }
  
  private sanitizeText(text: string): string {
    if (!text) return '';
    return text
      .replace(/[\w.-]+@[\w.-]+\.\w+/g, '[email]')
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[phone]')
      .replace(/sk-[a-zA-Z0-9]{20,}/g, '[api-key]')
      .replace(/AIza[0-9A-Za-z\-_]{35}/g, '[api-key]')
      .replace(/ghp_[a-zA-Z0-9]{36,}/g, '[api-key]')
      .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[ip]')
      .replace(/\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g, '[card]')
      .replace(/(password|secret|token|credential|key)\s*[=:]\s*\S+/gi, '$1=[redacted]')
      .substring(0, 500);
  }
  
  private anonymizeQuery(query: string): string {
    return this.sanitizeText(query).replace(/\s+/g, ' ').trim().substring(0, 200);
  }
  
  private sanitizePageUrl(url: string): string {
    return url.split('?')[0];
  }
  
  private sanitizeUrl(url: string): string {
    try { return new URL(url).origin + new URL(url).pathname; }
    catch { return url.split('?')[0].split('#')[0]; }
  }
  
  private isExcludedPage(): boolean {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname;
    return this.config.excludePages?.some(pattern => {
      if (pattern.includes('*')) return new RegExp(pattern.replace(/\*/g, '.*')).test(path);
      return path.startsWith(pattern);
    }) ?? false;
  }
  
  // ─── STORAGE ───
  
  private async initIndexedDB(): Promise<void> {
    if (typeof window === 'undefined') return;
    return new Promise((resolve) => {
      const request = indexedDB.open('depthindex-analytics', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('events')) {
          db.createObjectStore('events', { keyPath: 'id' });
        }
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onerror = () => resolve();
    });
  }
  
  private async persistEvent(event: AnalyticsEvent): Promise<void> {
    if (this.config.storage === 'none' || this.config.storage === 'memory') return;
    try {
      if (this.config.storage === 'indexeddb' && this.db) {
        const tx = this.db.transaction('events', 'readwrite');
        tx.objectStore('events').add(event);
      } else if (this.config.storage === 'localstorage' && typeof window !== 'undefined') {
        const stored = JSON.parse(localStorage.getItem('di-analytics') || '[]');
        stored.push(event);
        localStorage.setItem('di-analytics', JSON.stringify(stored.slice(-this.config.maxEvents!)));
      }
    } catch {}
  }
  
  private async loadEvents(): Promise<void> {
    try {
      if (this.config.storage === 'indexeddb' && this.db) {
        const tx = this.db.transaction('events', 'readonly');
        this.events = await new Promise((resolve) => {
          const request = tx.objectStore('events').getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => resolve([]);
        });
      } else if (this.config.storage === 'localstorage' && typeof window !== 'undefined') {
        this.events = JSON.parse(localStorage.getItem('di-analytics') || '[]');
      }
    } catch {
      this.events = [];
    }
  }
  
  private async getEvents(period?: { start: number; end: number }): Promise<AnalyticsEvent[]> {
    let events = this.events;
    if (period) {
      events = events.filter(e => e.timestamp >= period.start && e.timestamp <= period.end);
    }
    return events;
  }
  
  // ─── EXTERNAL SYNC ───
  
  private startFlushTimer(): void {
    if (typeof window === 'undefined') return;
    if (this.flushTimer) return;
    this.flushTimer = window.setInterval(() => this.flush(), this.config.flushInterval);
  }
  
  async flush(): Promise<void> {
    if (!this.config.externalEndpoint || this.events.length === 0) return;
    const batch = this.events.splice(0, this.config.batchSize);
    try {
      await fetch(this.config.externalEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(this.config.externalHeaders || {}) },
        body: JSON.stringify({ events: batch, sentAt: Date.now(), source: 'depthindex-analytics' }),
      });
    } catch {
      this.events.unshift(...batch);
    }
  }
  
  // ─── UTILITY ───
  
  private generateSessionId(): string {
    return `sess_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  }
  
  private generateEventId(): string {
    return `evt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
  }
  
  async clearAll(): Promise<void> {
    this.events = [];
    if (this.db) {
      const tx = this.db.transaction('events', 'readwrite');
      tx.objectStore('events').clear();
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('di-analytics');
    }
  }
  
  async exportData(): Promise<string> {
    return JSON.stringify(await this.getEvents(), null, 2);
  }
  
  destroy(): void {
    if (typeof window !== 'undefined' && this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }
}
