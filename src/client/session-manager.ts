import { toRaw } from 'vue';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  pageContext?: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  renderedContent?: string; // Pre-rendered Markdown cache
  sources?: { url: string; title: string; confidence: number }[];
  citations?: any[]; // For citation formatting and panel rendering
  timestamp: number;
  feedback?: 'up' | 'down';
  offlineFallback?: boolean;
}

export class SessionManager {
  private db: IDBDatabase | null = null;
  private dbName = 'depthindex-sessions';
  private dbVersion = 2; // Incremented for schema changes

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        reject(new Error('Failed to open database: ' + (event.target as any).error));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as any).result;
        this.verifyDatabaseIntegrity().then(resolve).catch(reject);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as any).result as IDBDatabase;
        
        // Create sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          sessionStore.createIndex('createdAt', 'createdAt', { unique: false });
        } else {
          const tx = (event.target as any).transaction;
          const store = tx.objectStore('sessions');
          if (!store.indexNames.contains('updatedAt')) {
            store.createIndex('updatedAt', 'updatedAt', { unique: false });
          }
          if (!store.indexNames.contains('createdAt')) {
            store.createIndex('createdAt', 'createdAt', { unique: false });
          }
        }

        // Create messages store with required indexes
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('sessionId', 'sessionId', { unique: false });
          messageStore.createIndex('timestamp', 'timestamp', { unique: false });
          messageStore.createIndex('role', 'role', { unique: false });
          messageStore.createIndex('sessionId_timestamp', ['sessionId', 'timestamp'], { unique: false });
        } else {
          const tx = (event.target as any).transaction;
          const store = tx.objectStore('messages');
          if (!store.indexNames.contains('sessionId')) {
            store.createIndex('sessionId', 'sessionId', { unique: false });
          }
          if (!store.indexNames.contains('timestamp')) {
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
          if (!store.indexNames.contains('role')) {
            store.createIndex('role', 'role', { unique: false });
          }
          if (!store.indexNames.contains('sessionId_timestamp')) {
            store.createIndex('sessionId_timestamp', ['sessionId', 'timestamp'], { unique: false });
          }
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Create feedback store for user feedback
        if (!db.objectStoreNames.contains('feedback')) {
          const feedbackStore = db.createObjectStore('feedback', { keyPath: 'id', autoIncrement: true });
          feedbackStore.createIndex('messageId', 'messageId', { unique: false });
          feedbackStore.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  /**
   * Verify database integrity after initialization
   */
  private async verifyDatabaseIntegrity(): Promise<void> {
    if (!this.db) return;
    
    const requiredStores = ['sessions', 'messages', 'settings'];
    const requiredIndexes: Record<string, string[]> = {
      messages: ['sessionId', 'timestamp', 'role'],
      sessions: ['updatedAt'],
    };
    
    for (const storeName of requiredStores) {
      if (!this.db.objectStoreNames.contains(storeName)) {
        throw new Error(`[DepthIndex] Missing required object store: ${storeName}`);
      }
    }
    
    // Verify indexes exist
    for (const [storeName, indexes] of Object.entries(requiredIndexes)) {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      for (const indexName of indexes) {
        if (!store.indexNames.contains(indexName)) {
          console.warn(`[DepthIndex] Missing index: ${storeName}.${indexName}`);
        }
      }
    }
  }

  async saveSession(session: ChatSession): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const sanitized = this.sanitizeForIDB(session);
    const testClone = this.safeStructuredClone(sanitized);
    if (!testClone) {
      throw new Error('Session cannot be serialized for storage');
    }
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('sessions', 'readwrite');
      const store = tx.objectStore('sessions');
      const request = store.put(testClone);
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject((e.target as any).error);
    });
  }

  async getSession(id: string): Promise<ChatSession | null> {
    if (!this.db) throw new Error('Database not initialized');
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('sessions', 'readonly');
      const store = tx.objectStore('sessions');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = (e) => reject((e.target as any).error);
    });
  }

  async getSessions(): Promise<ChatSession[]> {
    if (!this.db) return [];
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('sessions', 'readonly');
      const store = tx.objectStore('sessions');
      const request = store.getAll();
      request.onsuccess = () => {
        const sessions = request.result || [];
        resolve(sessions.sort((a, b) => b.updatedAt - a.updatedAt));
      };
      request.onerror = (e) => reject((e.target as any).error);
    });
  }

  async saveMessage(message: Message): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const sanitized = this.sanitizeForIDB(message);
      
      if (!sanitized.id) {
        sanitized.id = crypto.randomUUID?.() || 
          `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      }
      
      const testClone = this.safeStructuredClone(sanitized);
      if (!testClone) {
        throw new Error('Message cannot be serialized for storage');
      }

      await new Promise<void>((resolve, reject) => {
        const tx = this.db!.transaction('messages', 'readwrite');
        const store = tx.objectStore('messages');
        const request = store.put(testClone);
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject((e.target as any).error);
      });

      const session = await this.getSession(message.sessionId);
      if (session) {
        session.updatedAt = Date.now();
        await this.saveSession(session);
      }
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        await this.handleQuotaExceeded();
        try {
          const sanitized = this.sanitizeForIDB(message);
          await new Promise<void>((resolve, reject) => {
            const tx = this.db!.transaction('messages', 'readwrite');
            const store = tx.objectStore('messages');
            const request = store.put(sanitized);
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject((e.target as any).error);
          });
          return;
        } catch (retryError) {
          console.error('[DepthIndex] Retry after quota cleanup failed:', retryError);
        }
      }
      console.error('[DepthIndex] Failed to save message:', error);
    }
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    if (!this.db) return [];
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('messages', 'readonly');
      const store = tx.objectStore('messages');
      const index = store.index('sessionId');
      const request = index.getAll(sessionId);
      request.onsuccess = () => {
        const msgs = request.result || [];
        resolve(msgs.sort((a, b) => a.timestamp - b.timestamp));
      };
      request.onerror = (e) => reject((e.target as any).error);
    });
  }

  /**
   * Get messages with pagination
   */
  async getMessagesPaginated(
    sessionId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<{ messages: Message[]; total: number }> {
    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('messages', 'readonly');
      const store = tx.objectStore('messages');
      const index = store.index('sessionId');
      
      const allMsgsRequest = index.getAll(sessionId);
      allMsgsRequest.onerror = (e) => reject((e.target as any).error);
      allMsgsRequest.onsuccess = () => {
        const allMsgs = allMsgsRequest.result || [];
        const sorted = allMsgs.sort((a, b) => a.timestamp - b.timestamp);
        const total = sorted.length;
        const messages = sorted.slice(offset, offset + limit);
        resolve({ messages, total });
      };
    });
  }

  /**
   * Delete a session and all its messages (transactional)
   */
  async deleteSession(sessionId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const messages = await this.getMessages(sessionId);
    await new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(['sessions', 'messages'], 'readwrite');
      const msgStore = tx.objectStore('messages');
      const sessionStore = tx.objectStore('sessions');
      
      // Delete session
      sessionStore.delete(sessionId);
      
      // Delete messages
      for (const msg of messages) {
        msgStore.delete(msg.id);
      }
      
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject((e.target as any).error);
    });
  }

  /**
   * Delete a single message from the database
   */
  async deleteMessage(messageId: string): Promise<void> {
    if (!this.db) {
      console.warn('[DepthIndex] Database not initialized, cannot delete message');
      return;
    }
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = this.db!.transaction('messages', 'readwrite');
        const msgStore = tx.objectStore('messages');
        msgStore.delete(messageId);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject((e.target as any).error);
      });
    } catch (error) {
      console.error('[DepthIndex] Failed to delete message:', error);
    }
  }

  /**
   * Delete all messages in a session
   */
  async deleteMessages(sessionId: string): Promise<void> {
    if (!this.db) return;
    try {
      const messages = await this.getMessages(sessionId);
      await new Promise<void>((resolve, reject) => {
        const tx = this.db!.transaction('messages', 'readwrite');
        const msgStore = tx.objectStore('messages');
        for (const msg of messages) {
          msgStore.delete(msg.id);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject((e.target as any).error);
      });
    } catch (error) {
      console.error('[DepthIndex] Failed to delete messages:', error);
    }
  }

  /**
   * Update a message (for editing)
   */
  async updateMessage(messageId: string, updates: Partial<Message>): Promise<void> {
    if (!this.db) return;
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = this.db!.transaction('messages', 'readwrite');
        const msgStore = tx.objectStore('messages');
        const getReq = msgStore.get(messageId);
        getReq.onsuccess = () => {
          const existing = getReq.result;
          if (existing) {
            const updated = this.sanitizeForIDB({
              ...existing,
              ...updates,
              updatedAt: Date.now()
            });
            msgStore.put(updated);
          }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject((e.target as any).error);
      });
    } catch (error) {
      console.error('[DepthIndex] Failed to update message:', error);
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(['sessions', 'messages', 'settings'], 'readwrite');
      tx.objectStore('sessions').clear();
      tx.objectStore('messages').clear();
      tx.objectStore('settings').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject((e.target as any).error);
    });
  }

  /**
   * Batch save messages for better performance
   */
  async saveMessages(sessionId: string, messages: Message[]): Promise<void> {
    if (!this.db || messages.length === 0) return;
    
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = this.db!.transaction('messages', 'readwrite');
        const store = tx.objectStore('messages');
        
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject((e.target as any).error);
        
        for (const message of messages) {
          try {
            const sanitized = this.sanitizeForIDB(message);
            store.put(sanitized);
          } catch (error) {
            console.error('[DepthIndex] Failed to save message in batch:', error);
          }
        }
      });
      
      const session = await this.getSession(sessionId);
      if (session) {
        session.updatedAt = Date.now();
        await this.saveSession(session);
      }
    } catch (err) {
      console.error('[DepthIndex] Failed batch saving messages:', err);
    }
  }

  /**
   * Handle IndexedDB quota exceeded
   */
  private async handleQuotaExceeded(): Promise<void> {
    console.warn('[DepthIndex] Storage quota exceeded, cleaning old data...');
    if (!this.db) return;
    
    try {
      const sessions = await this.getSessions();
      sessions.sort((a, b) => (a.updatedAt || 0) - (b.updatedAt || 0));
      
      const toRemove = sessions.slice(0, Math.ceil(sessions.length / 2));
      for (const session of toRemove) {
        await this.deleteSession(session.id);
      }
      console.log(`[DepthIndex] Cleaned ${toRemove.length} old sessions to free space`);
    } catch (error) {
      console.error('[DepthIndex] Failed to clean old data:', error);
    }
  }

  /**
   * Sanitize data for IndexedDB storage.
   * Strips Vue reactivity proxies, DOM references, functions, and circular refs.
   */
  private sanitizeForIDB<T>(data: T): T {
    if (data === null || data === undefined) return data;
    
    if (data instanceof Date) return new Date(data.getTime()) as unknown as T;
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeForIDB(item)) as unknown as T;
    }
    
    if (typeof data === 'object') {
      const isProxy = (data as any).constructor?.name === 'Proxy' || 
                      (data as any).__v_isReactive || 
                      (data as any).__v_isRef ||
                      (data as any).__v_raw;
                      
      if (isProxy) {
        const raw = (data as any).__v_raw || toRaw(data);
        return this.sanitizeForIDB(raw);
      }
      
      const sanitized: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'function') continue;
        if (typeof Node !== 'undefined' && value instanceof Node) continue;
        if (typeof value === 'symbol') continue;
        if (key.startsWith('__v_') || key === '__v_isVNode') continue;
        if (value === undefined) continue;
        if (typeof File !== 'undefined' && value instanceof File) continue;
        if (typeof Blob !== 'undefined' && value instanceof Blob) continue;
        
        sanitized[key] = this.sanitizeForIDB(value);
      }
      
      return sanitized as T;
    }
    
    return data;
  }

  /**
   * Deep clone with structured clone safety check
   */
  private safeStructuredClone<T>(data: T): T | null {
    try {
      if (typeof structuredClone !== 'undefined') {
        return structuredClone(data);
      }
    } catch (error) {
      console.warn('[DepthIndex] structuredClone failed, using JSON fallback:', error);
    }
    
    try {
      return JSON.parse(JSON.stringify(data));
    } catch (jsonError) {
      console.error('[DepthIndex] Cannot clone data for IndexedDB:', jsonError);
      return null;
    }
  }
}
