export interface ContentClassification {
  /** Is this documentation-related? */
  isDocRelated: boolean;
  /** Is this chitchat/conversational? */
  isConversational: boolean;
  /** Is this completely off-topic? */
  isOffTopic: boolean;
  /** Does it contain sensitive personal data? */
  hasSensitiveData: boolean;
  /** Categories of sensitive data found */
  sensitiveCategories: SensitiveCategory[];
  /** Should we ask for user consent before logging? */
  requiresConsent: boolean;
}

export type SensitiveCategory = 
  | 'credit_card'
  | 'api_key'
  | 'email'
  | 'phone'
  | 'password'
  | 'address'
  | 'ssn'
  | 'location'
  | 'ip_address'
  | 'health'
  | 'personal_story';

export class QueryGuard {
  private encryptionKey: CryptoKey | null = null;
  
  // Patterns that indicate off-topic or personal conversation
  private readonly OFF_TOPIC_PATTERNS = [
    /^(hi|hello|hey|how are you|what'?s up|good morning|good evening)\s*$/i,
    /\b(my girlfriend|my boyfriend|my wife|my husband|my cat|my dog|my pet)\b/i,
    /\b(tell me a joke|tell me a story|sing|poem|recipe|cook|weather|news|sports)\b/i,
    /\b(politics|election|president|government|war|religion)\b/i,
    /\b(my (day|weekend|life|job|boss|coworker|friend))\b/i,
  ];
  
  // CREDIT CARD: Must detect and strip ALL formats
  private readonly CREDIT_CARD_PATTERNS = [
    /\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g,  // 16-digit
    /\b\d{4}\s?\d{6}\s?\d{5}\b/g,                        // Amex
    /\b3[47]\d{2}[-.\s]?\d{6}[-.\s]?\d{5}\b/g,           // Amex strict
    /\b(?:4\d{3}|5[1-5]\d{2}|6011|65\d{2})[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g, // Visa/MC/Discover
    /\b\d{4}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{4}[-.\s]?\d{4}\b/g, // Some debit
  ];
  
  // Luhn check for credit card validation
  private luhnCheck(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    
    let sum = 0;
    let alternate = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);
      if (alternate) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      alternate = !alternate;
    }
    return sum % 10 === 0;
  }
  
  /**
   * FULL QUERY SANITIZATION — Strip ALL sensitive data
   */
  sanitizeQuery(query: string): {
    sanitized: string;
    wasSanitized: boolean;
    findings: SensitiveCategory[];
  } {
    const findings: SensitiveCategory[] = [];
    let sanitized = query;
    
    // 1. Credit cards (with Luhn validation)
    for (const pattern of this.CREDIT_CARD_PATTERNS) {
      const matches = sanitized.match(pattern);
      if (matches) {
        for (const match of matches) {
          if (this.luhnCheck(match)) {
            sanitized = sanitized.replace(match, '[CARD REDACTED]');
            findings.push('credit_card');
          }
        }
      }
    }
    
    // 2. API keys
    const apiKeyPatterns = [
      /sk-[a-zA-Z0-9]{20,}/g,
      /AIza[0-9A-Za-z\-_]{35}/g,
      /sk-ant-[a-zA-Z0-9\-_]{32,}/g,
      /ghp_[a-zA-Z0-9]{36,}/g,
      /github_pat_[a-zA-Z0-9_]{40,}/g,
      /xox[baprs]-[a-zA-Z0-9-]+/g,
      /hf_[a-zA-Z0-9]{34,}/g,
    ];
    for (const pattern of apiKeyPatterns) {
      if (pattern.test(sanitized)) {
        sanitized = sanitized.replace(pattern, '[API KEY REDACTED]');
        findings.push('api_key');
      }
    }
    
    // 3. Emails
    if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(sanitized)) {
      sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL REDACTED]');
      findings.push('email');
    }
    
    // 4. Phone numbers (international + local)
    if (/\b(?:\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/.test(sanitized)) {
      sanitized = sanitized.replace(/\b(?:\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}\b/g, '[PHONE REDACTED]');
      findings.push('phone');
    }
    
    // 5. Passwords in key=value format
    if (/(?:password|passwd|pwd|secret|token)\s*[=:]\s*\S+/gi.test(sanitized)) {
      sanitized = sanitized.replace(/(?:password|passwd|pwd|secret|token)\s*[=:]\s*\S+/gi, '$1=[REDACTED]');
      findings.push('password');
    }
    
    // 6. Physical addresses
    if (/\b\d{1,5}\s+\w+\s+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)\b/gi.test(sanitized)) {
      sanitized = sanitized.replace(/\b\d{1,5}\s+\w+\s+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)\b/gi, '[ADDRESS REDACTED]');
      findings.push('address');
    }
    
    // 7. IP addresses in text (user might paste them)
    if (/\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(sanitized)) {
      sanitized = sanitized.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP REDACTED]');
      findings.push('ip_address');
    }
    
    // 8. SSN / National ID patterns
    if (/\b\d{3}-\d{2}-\d{4}\b/.test(sanitized) || /\b\d{4}-\d{4}-\d{4}-\d{2}\b/.test(sanitized)) {
      sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[ID REDACTED]');
      sanitized = sanitized.replace(/\b\d{4}-\d{4}-\d{4}-\d{2}\b/g, '[ID REDACTED]');
      findings.push('ssn');
    }
    
    return {
      sanitized,
      wasSanitized: findings.length > 0,
      findings: [...new Set(findings)],
    };
  }
  
  /**
   * Classify content — is it documentation-related or personal?
   */
  classify(query: string): ContentClassification {
    const isConversational = this.OFF_TOPIC_PATTERNS.some(p => p.test(query));
    const hasSensitiveData = this.sanitizeQuery(query).wasSanitized;
    
    // Check if query relates to documentation topics
    const docKeywords = [
      'install', 'configure', 'setup', 'deploy', 'build', 'test',
      'api', 'endpoint', 'config', 'error', 'bug', 'fix',
      'how to', 'what is', 'explain', 'example', 'code',
      'plugin', 'module', 'component', 'function', 'method',
      'npm', 'yarn', 'pnpm', 'node', 'typescript', 'javascript',
    ];
    
    const isDocRelated = docKeywords.some(k => query.toLowerCase().includes(k));
    const isOffTopic = isConversational && !isDocRelated;
    
    return {
      isDocRelated,
      isConversational,
      isOffTopic,
      hasSensitiveData,
      sensitiveCategories: hasSensitiveData 
        ? this.sanitizeQuery(query).findings 
        : [],
      requiresConsent: isOffTopic && !hasSensitiveData,
    };
  }
  
  /**
   * Encrypt query before storage using AES-256-GCM.
   * Encryption key is per-device, stored in localStorage.
   * Key NEVER leaves the device.
   */
  async encryptForStorage(query: string): Promise<{
    encrypted: ArrayBuffer;
    iv: Uint8Array;
  } | null> {
    try {
      const key = await this.getOrCreateEncryptionKey();
      const cryptoObj = typeof crypto !== 'undefined' ? crypto : null;
      if (!cryptoObj || !cryptoObj.subtle) {
        throw new Error('Web Crypto API is not available');
      }
      const iv = cryptoObj.getRandomValues(new Uint8Array(12));
      const encoder = new TextEncoder();
      const encoded = encoder.encode(query);
      
      const encrypted = await cryptoObj.subtle.encrypt(
        { name: 'AES-GCM', iv: iv as any },
        key,
        encoded as any
      );
      
      return { encrypted, iv };
    } catch (error) {
      console.error('[DepthIndex Privacy] Encryption failed:', error);
      return null;
    }
  }
  
  /**
   * Decrypt query from storage.
   */
  async decryptFromStorage(encrypted: ArrayBuffer, iv: Uint8Array): Promise<string | null> {
    try {
      const key = await this.getOrCreateEncryptionKey();
      const cryptoObj = typeof crypto !== 'undefined' ? crypto : null;
      if (!cryptoObj || !cryptoObj.subtle) {
        throw new Error('Web Crypto API is not available');
      }
      
      const decrypted = await cryptoObj.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as any },
        key,
        encrypted
      );
      
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('[DepthIndex Privacy] Decryption failed:', error);
      return null;
    }
  }
  
  /**
   * Get or create per-device encryption key.
   * Stored in localStorage — NEVER transmitted.
   */
  private async getOrCreateEncryptionKey(): Promise<CryptoKey> {
    if (this.encryptionKey) return this.encryptionKey;
    
    // Try to load existing key
    const stored = await this.loadKeyFromStorage();
    if (stored) {
      this.encryptionKey = stored;
      return stored;
    }
    
    const cryptoObj = typeof crypto !== 'undefined' ? crypto : null;
    if (!cryptoObj || !cryptoObj.subtle) {
      throw new Error('Web Crypto API is not available');
    }
    
    // Generate new key
    const key = await cryptoObj.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true, // extractable for storage
      ['encrypt', 'decrypt']
    );
    
    // Store key
    await this.storeKey(key);
    this.encryptionKey = key;
    
    return key;
  }
  
  private async loadKeyFromStorage(): Promise<CryptoKey | null> {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem('di_encryption_key');
      if (!raw) return null;
      
      const cryptoObj = typeof crypto !== 'undefined' ? crypto : null;
      if (!cryptoObj || !cryptoObj.subtle) return null;
      
      const jwk = JSON.parse(raw);
      return cryptoObj.subtle.importKey(
        'jwk',
        jwk,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    } catch {
      return null;
    }
  }
  
  private async storeKey(key: CryptoKey): Promise<void> {
    try {
      if (typeof localStorage === 'undefined') return;
      const cryptoObj = typeof crypto !== 'undefined' ? crypto : null;
      if (!cryptoObj || !cryptoObj.subtle) return;
      
      const jwk = await cryptoObj.subtle.exportKey('jwk', key);
      localStorage.setItem('di_encryption_key', JSON.stringify(jwk));
    } catch (error) {
      console.error('[DepthIndex Privacy] Failed to store encryption key:', error);
    }
  }
}
