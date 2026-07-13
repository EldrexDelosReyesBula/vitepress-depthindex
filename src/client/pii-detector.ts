export enum PIICategory {
  EMAIL = 'email',
  PHONE = 'phone',
  CREDIT_CARD = 'credit_card',
  SSN = 'ssn',
  ADDRESS = 'address',
  NAME = 'name',
  IP_ADDRESS = 'ip_address',
  API_KEY = 'api_key',
  PASSWORD = 'password',
  PH_PII = 'ph_pii', // Philippines-specific PII
}

export interface PIIMatch {
  category: PIICategory;
  match: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
}

export class PIIDetector {
  private patterns: Map<PIICategory, RegExp[]> = new Map([
    [PIICategory.EMAIL, [
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
    ]],
    
    [PIICategory.PHONE, [
      /\+\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,  // International
      /(\+63|0)[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,                 // Philippines
      /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,                          // US/General
    ]],
    
    [PIICategory.CREDIT_CARD, [
      /\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g,  // Visa/Mastercard
      /\b\d{4}\s?\d{6}\s?\d{5}\b/g,                       // Amex
      /\b3[47]\d{2}[-.\s]?\d{6}[-.\s]?\d{5}\b/g,          // Amex (strict)
      /\b(?:5[1-5]\d{2}|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[01]\d|2720)[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g, // Mastercard (strict)
    ]],
    
    [PIICategory.SSN, [
      /\b\d{3}-\d{2}-\d{4}\b/g,              // US SSN
      /\b\d{4}-\d{4}-\d{4}-\d{2}\b/g,        // PH SSS number (alternate)
      /\b\d{2}-\d{7}-\d{1}\b/g,              // PH SSS number (standard)
      /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g, // US SSN (valid ranges)
    ]],
    
    [PIICategory.IP_ADDRESS, [
      /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g, // IPv4
      /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,                                  // IPv6
      /\b(?:[0-9a-fA-F]{1,4}:){1,7}:\b/g,                                                // IPv6 compressed
    ]],
    
    [PIICategory.API_KEY, [
      /sk-[a-zA-Z0-9]{32,}/g,                       // OpenAI
      /AIza[0-9A-Za-z\-_]{35}/g,                    // Google
      /sk-ant-[a-zA-Z0-9\-_]{32,}/g,                // Anthropic
      /ghp_[a-zA-Z0-9]{36,}/g,                      // GitHub
      /github_pat_[a-zA-Z0-9_]{40,}/g,              // GitHub PAT
    ]],
    
    [PIICategory.PASSWORD, [
      /password[=:]\s*['"]?[^\s'"]+['"]?/gi,
      /passwd[=:]\s*['"]?[^\s'"]+['"]?/gi,
      /secret[=:]\s*['"]?[^\s'"]+['"]?/gi,
      /token[=:]\s*['"]?[^\s'"]+['"]?/gi,
    ]],
    
    [PIICategory.PH_PII, [
      /\b\d{2}-\d{9}-\d{1}\b/g,                  // PhilHealth ID
      /\b\d{3}-\d{3}-\d{3}-\d{3}\b/g,            // TIN
      /\b\d{4}-\d{7}-\d{1}\b/g,                  // UMID
      /\b[A-Z]\d{7}\b/g,                          // Philippine Passport
      /\b[A-Z]\d{2}-\d{2}-\d{6}\b/g,              // Driver's License
    ]],
    
    [PIICategory.ADDRESS, [
      /\b\d{1,5}\s+\w+\s+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|highway|hwy)\b/gi,
      /\b(?:P\.?O\.?\s*Box\s*\d+)\b/gi,
    ]],
    
    [PIICategory.NAME, [
      /\b(?:Mr|Mrs|Ms|Miss|Dr|Prof|Atty|Engr|Arch)\.\s+[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
    ]],
  ]);
  
  constructor() {
    this.validateAllPatterns();
  }
  
  private validateAllPatterns(): void {
    const missingFlags: string[] = [];
    
    for (const [category, patterns] of this.patterns) {
      for (const pattern of patterns) {
        if (!pattern.flags.includes('g')) {
          missingFlags.push(`[${category}] ${pattern.toString()}`);
        }
      }
    }
    
    if (missingFlags.length > 0) {
      const message = `PIIDetector: ${missingFlags.length} pattern(s) missing global (/g) flag:\n` +
        missingFlags.join('\n') +
        '\n\nThese must be fixed to prevent infinite loops.';
      
      const isDev = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') || 
                    (typeof window !== 'undefined' && (import.meta as any).env?.DEV);
      
      if (isDev) {
        throw new Error(message);
      } else {
        console.warn(message);
      }
    }
  }
  
  private safeExecAll(pattern: RegExp, text: string): RegExpExecArray[] {
    const matches: RegExpExecArray[] = [];
    const MAX_MATCHES = 1000;
    const MAX_ITERATIONS = 10000;
    
    let safePattern = pattern;
    if (!pattern.flags.includes('g')) {
      safePattern = new RegExp(pattern.source, pattern.flags + 'g');
    }
    
    safePattern.lastIndex = 0;
    
    let iterations = 0;
    let match = safePattern.exec(text);
    
    while (match !== null && iterations < MAX_ITERATIONS) {
      matches.push(match);
      iterations++;
      
      if (match[0].length === 0) {
        safePattern.lastIndex++;
      }
      
      if (matches.length >= MAX_MATCHES) {
        console.warn('[DepthIndex PII] Reached maximum match limit:', MAX_MATCHES);
        break;
      }
      
      match = safePattern.exec(text);
    }
    
    if (iterations >= MAX_ITERATIONS) {
      console.error('[DepthIndex PII] Infinite loop prevented in pattern:', pattern.toString());
    }
    
    return matches;
  }
  
  scanForPII(text: string): PIIMatch[] {
    if (!text || typeof text !== 'string') return [];
    
    const matches: PIIMatch[] = [];
    
    for (const [category, patterns] of this.patterns) {
      for (const pattern of patterns) {
        const execResults = this.safeExecAll(pattern, text);
        
        for (const match of execResults) {
          if (this.validateMatch(category, match[0], match.index)) {
            matches.push({
              category,
              match: match[0],
              startIndex: match.index,
              endIndex: match.index + match[0].length,
              confidence: this.calculateConfidence(category, match[0]),
            });
          }
        }
      }
    }
    
    // Sort by confidence (descending) then length (descending)
    const sorted = matches.sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex);
    });

    // Filter out overlaps
    const filtered: PIIMatch[] = [];
    for (const m of sorted) {
      const overlaps = filtered.some(f => 
        (m.startIndex >= f.startIndex && m.startIndex < f.endIndex) ||
        (m.endIndex > f.startIndex && m.endIndex <= f.endIndex) ||
        (m.startIndex <= f.startIndex && m.endIndex >= f.endIndex)
      );
      if (!overlaps) {
        filtered.push(m);
      }
    }

    // Sort by startIndex for sequential processing
    return filtered.sort((a, b) => a.startIndex - b.startIndex);
  }
  
  private validateMatch(category: PIICategory, match: string, index: number): boolean {
    switch (category) {
      case PIICategory.EMAIL:
        const tld = match.split('.').pop()?.toLowerCase();
        const validTLDs = ['com', 'org', 'net', 'edu', 'gov', 'ph', 'co', 'io', 'dev'];
        return tld ? validTLDs.some(t => tld.startsWith(t)) : false;
        
      case PIICategory.IP_ADDRESS:
        const parts = match.split('.').map(Number);
        if (parts.length === 4) {
          return parts.every(p => p >= 0 && p <= 255);
        }
        return true;
        
      case PIICategory.CREDIT_CARD:
        return this.luhnCheck(match.replace(/[^0-9]/g, ''));
        
      default:
        return true;
    }
  }
  
  private luhnCheck(cardNumber: string): boolean {
    if (!/^\d{13,19}$/.test(cardNumber)) return false;
    
    let sum = 0;
    let alternate = false;
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i), 10);
      
      if (alternate) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      
      sum += digit;
      alternate = !alternate;
    }
    
    return sum % 10 === 0;
  }
  
  private calculateConfidence(category: PIICategory, match: string): number {
    const confidenceMap: Record<string, number> = {
      [PIICategory.EMAIL]: 0.95,
      [PIICategory.CREDIT_CARD]: 0.90,
      [PIICategory.PH_PII]: 0.85,
      [PIICategory.API_KEY]: 0.90,
      [PIICategory.PHONE]: 0.75,
      [PIICategory.IP_ADDRESS]: 0.70,
      [PIICategory.SSN]: 0.80,
      [PIICategory.PASSWORD]: 0.90,
    };
    
    return confidenceMap[category] || 0.5;
  }
  
  sanitizePII(text: string, method: 'remove' | 'mask' = 'mask'): {
    sanitized: string;
    found: PIIMatch[];
    wasSanitized: boolean;
  } {
    const matches = this.scanForPII(text);
    
    if (matches.length === 0) {
      return { sanitized: text, found: [], wasSanitized: false };
    }
    
    let sanitized = text;
    const reversedMatches = [...matches].reverse();
    
    for (const match of reversedMatches) {
      const start = match.startIndex;
      const end = match.endIndex;
      
      let replacement: string;
      
      if (method === 'remove') {
        replacement = '';
      } else {
        replacement = this.maskValue(match.category, match.match);
      }
      
      sanitized = sanitized.substring(0, start) + replacement + sanitized.substring(end);
    }
    
    return { sanitized, found: matches, wasSanitized: true };
  }
  
  private maskValue(category: PIICategory, value: string): string {
    switch (category) {
      case PIICategory.EMAIL:
        const [name, domain] = value.split('@');
        return `${name[0]}***@${domain}`;
        
      case PIICategory.CREDIT_CARD:
        return `****-****-****-${value.slice(-4)}`;
        
      case PIICategory.PHONE:
        return `${value.slice(0, 3)}***${value.slice(-4)}`;
        
      case PIICategory.API_KEY:
        return `${value.slice(0, 6)}...${value.slice(-4)}`;
        
      case PIICategory.PASSWORD:
        return '********';
        
      default:
        return '***REDACTED***';
    }
  }
  
  containsPII(text: string): boolean {
    return this.scanForPII(text).length > 0;
  }
  
  auditPII(text: string): {
    containsPII: boolean;
    categories: PIICategory[];
    count: number;
    sanitized: string;
  } {
    const matches = this.scanForPII(text);
    const categories = [...new Set(matches.map(m => m.category))];
    const { sanitized } = this.sanitizePII(text);
    
    return {
      containsPII: matches.length > 0,
      categories,
      count: matches.length,
      sanitized,
    };
  }

  static runPatternValidation(): { valid: boolean; issues: string[] } {
    const detector = new PIIDetector();
    const issues: string[] = [];
    
    for (const [category, patterns] of (detector as any).patterns) {
      for (const pattern of patterns) {
        if (!pattern.flags.includes('g')) {
          issues.push(`[${category}] Missing /g flag: ${pattern.toString()}`);
        }
        if (/\([^)]*\)[+*?]{2,}/.test(pattern.source)) {
          issues.push(`[${category}] Potential ReDoS: ${pattern.toString()}`);
        }
        if (pattern.source.includes('.*') || pattern.source.includes('.+')) {
          issues.push(`[${category}] Unbounded pattern: ${pattern.toString()}`);
        }
      }
    }
    
    return {
      valid: issues.length === 0,
      issues,
    };
  }
}
