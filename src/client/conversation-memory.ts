export interface MemoryEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  entities: string[];
  topics: string[];
  intent: string;
}

export class ConversationMemory {
  private entries: MemoryEntry[] = [];
  private maxEntries: number;
  private sessionTimeout: number;
  private customEntities: Set<string>;
  private entityRegistry: Set<string>;
  
  constructor(config?: {
    maxEntries?: number;
    sessionTimeout?: number;
    customEntities?: string[];
  }) {
    this.maxEntries = config?.maxEntries || 10;
    this.sessionTimeout = config?.sessionTimeout || 300000; // 5 min
    this.customEntities = new Set(config?.customEntities || []);
    this.entityRegistry = new Set(config?.customEntities || []);
  }
  
  /**
   * Add a message to memory
   */
  add(entry: Omit<MemoryEntry, 'entities' | 'topics' | 'intent'>): void {
    const entities = this.extractEntities(entry.content);
    const topics = this.extractTopics(entry.content);
    const intent = this.detectIntent(entry.content);
    
    this.entries.push({
      ...entry,
      entities,
      topics,
      intent,
    });
    
    // Trim old entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }
    
    // Register new entities
    entities.forEach(e => this.entityRegistry.add(e));
  }
  
  /**
   * Build context for the next query.
   * Resolves anaphora (it, this, that, they, etc.)
   */
  buildContext(currentQuery: string): string {
    if (this.entries.length === 0) return '';
    
    const context: string[] = [];
    const recentEntries = this.getRecentEntries(5);
    
    // Resolve anaphora in current query
    const resolvedQuery = this.resolveAnaphora(currentQuery, recentEntries);
    
    // Build context from recent messages
    for (const entry of recentEntries) {
      context.push(`${entry.role === 'user' ? 'User asked' : 'Assistant answered'}: "${entry.content.substring(0, 200)}"`);
    }
    
    // Add resolved query
    if (resolvedQuery !== currentQuery) {
      context.push(`(Resolved query: "${resolvedQuery}")`);
    }
    
    return context.join('\n');
  }
  
  /**
   * Resolve anaphoric references.
   * "What about on Vercel?" → "What about installing DepthIndex on Vercel?"
   */
  resolveAnaphora(query: string, recentEntries: MemoryEntry[] = this.getRecentEntries(5)): string {
    const anaphora = ['it', 'this', 'that', 'they', 'them', 'these', 'those'];
    
    const hasAnaphora = anaphora.some(term => new RegExp(`\\b${term}\\b`, 'i').test(query));
    if (!hasAnaphora) return query;
    
    if (recentEntries.length === 0) return query;
    
    let resolved = query;
    
    for (const term of anaphora) {
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      if (regex.test(resolved)) {
        // Scan backwards to find the most recent entity/topic
        let replacement = '';
        for (let i = recentEntries.length - 1; i >= 0; i--) {
          const entry = recentEntries[i];
          // Check custom registered entities first (preferred)
          const registeredEntity = entry.entities.find(e => this.customEntities.has(e));
          if (registeredEntity) {
            replacement = registeredEntity;
            break;
          }
        }
        
        // If no registered entity found, fallback to any entity
        if (!replacement) {
          for (let i = recentEntries.length - 1; i >= 0; i--) {
            const entry = recentEntries[i];
            if (entry.entities.length > 0) {
              replacement = entry.entities[0];
              break;
            }
          }
        }
        
        // If still no entity, fallback to topic
        if (!replacement) {
          for (let i = recentEntries.length - 1; i >= 0; i--) {
            const entry = recentEntries[i];
            if (entry.topics.length > 0) {
              replacement = entry.topics[0];
              break;
            }
          }
        }
        
        if (replacement) {
          resolved = resolved.replace(regex, replacement);
        }
      }
    }
    
    return resolved;
  }
  
  /**
   * Extract entities from a message
   */
  private extractEntities(text: string): string[] {
    const entities: string[] = [];
    
    // Check against registered entities
    for (const entity of this.entityRegistry) {
      if (text.toLowerCase().includes(entity.toLowerCase())) {
        entities.push(entity);
      }
    }
    
    // Extract quoted strings
    const quoted = text.match(/"([^"]+)"|'([^']+)'/g);
    if (quoted) {
      quoted.forEach(q => entities.push(q.replace(/['"]/g, '')));
    }
    
    // Extract code-like terms
    const codeTerms = text.match(/`([^`]+)`/g);
    if (codeTerms) {
      codeTerms.forEach(t => entities.push(t.replace(/`/g, '')));
    }
    
    // Extract capitalized phrases (likely proper nouns)
    const capitalized = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
    if (capitalized) {
      capitalized.forEach(c => {
        if (c.length > 3 && !['The', 'This', 'That', 'How', 'What', 'When', 'Where', 'Why'].includes(c.split(' ')[0])) {
          entities.push(c);
        }
      });
    }
    
    return [...new Set(entities)].slice(0, 5);
  }
  
  /**
   * Extract topics from a message
   */
  private extractTopics(text: string): string[] {
    const topics: string[] = [];
    const topicPatterns = [
      /\b(install|configure|deploy|build|test|debug|optimize)\b/gi,
      /\b(api|endpoint|config|plugin|module|component)\b/gi,
      /\b(error|bug|issue|problem|fix|solution)\b/gi,
      /\b(cloud|offline|local|hybrid|server|client)\b/gi,
      /\b(security|privacy|auth|token|key)\b/gi,
    ];
    
    for (const pattern of topicPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(m => topics.push(m.toLowerCase()));
      }
    }
    
    return [...new Set(topics)].slice(0, 5);
  }
  
  /**
   * Detect intent of a message
   */
  private detectIntent(text: string): string {
    if (/^(how|steps?|guide|tutorial|walkthrough)\b/i.test(text)) return 'how_to';
    if (/^(what|who|where|when|why)\b/i.test(text)) return 'question';
    if (/\b(error|bug|issue|problem|fail|crash|broke)\b/i.test(text)) return 'troubleshoot';
    if (/\b(config|configuration|setting|option|parameter)\b/i.test(text)) return 'configure';
    if (/^(yes|no|ok|okay|thanks|thank you|got it)\b/i.test(text)) return 'acknowledgment';
    if (/^(and|but|so|then|also|however|what about|how about)\b/i.test(text)) return 'follow_up';
    return 'general';
  }
  
  /**
   * Get recent entries within the session timeout
   */
  getRecentEntries(count: number): MemoryEntry[] {
    const now = Date.now();
    const recent = this.entries.filter(
      e => now - e.timestamp < this.sessionTimeout
    );
    return recent.slice(-count);
  }
  
  /**
   * Check if the conversation is still active
   */
  isSessionActive(): boolean {
    if (this.entries.length === 0) return false;
    const lastEntry = this.entries[this.entries.length - 1];
    return Date.now() - lastEntry.timestamp < this.sessionTimeout;
  }
  
  /**
   * Get the current conversation topic
   */
  getCurrentTopic(): string {
    const recent = this.getRecentEntries(5);
    const allTopics = recent.flatMap(e => e.topics);
    
    // Find most frequent topic
    const freq = new Map<string, number>();
    allTopics.forEach(t => freq.set(t, (freq.get(t) || 0) + 1));
    
    let topTopic = '';
    let topCount = 0;
    for (const [topic, count] of freq) {
      if (count > topCount) {
        topCount = count;
        topTopic = topic;
      }
    }
    
    return topTopic;
  }
  
  /**
   * Clear conversation memory
   */
  clear(): void {
    this.entries = [];
  }
  
  /**
   * Export memory for debugging
   */
  export(): MemoryEntry[] {
    return [...this.entries];
  }
}
