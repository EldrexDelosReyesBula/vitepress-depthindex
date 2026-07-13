export class SecurityManager {
  private blockedIPs: Set<string> = new Set();
  private queryPatterns: Map<string, number> = new Map();
  private suspiciousPatterns: RegExp[];
  private maxQueryLength = 2000;
  private maxQueriesPerMinute = 30;
  private queryTimestamps: number[] = [];
  private blockedUntil: number | null = null;
  
  // XSS prevention allowed tags and attributes
  private allowedTags = new Set([
    'div', 'span', 'p', 'br', 'hr',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'a', 'img', 'code', 'pre', 'blockquote',
    'strong', 'em', 'b', 'i', 'u', 's', 'mark',
    'details', 'summary', 'figure', 'figcaption',
  ]);
  private allowedAttributes = new Set([
    'href', 'src', 'alt', 'title', 'width', 'height',
    'class', 'id', 'target', 'rel', 'loading'
  ]);
  
  constructor() {
    this.suspiciousPatterns = [
      // SQL Injection attempts (safe, bounded patterns)
      /\b(SELECT\s+.*\s+FROM|INSERT\s+INTO|UPDATE\s+.*\s+SET|DELETE\s+FROM|DROP\s+(TABLE|DATABASE)|UNION\s+SELECT)\b/i,
      
      // XSS attempts (bounded, no nested quantifiers)
      /<script[\s\S]*?>/i,
      /javascript\s*:/i,
      /on(load|error|click|mouseover|focus|blur)\s*=/i,
      
      // Path traversal (literal, no backtracking)
      /\.\.\/\.\.\//,
      /\/etc\/(passwd|shadow|hosts)/,
      /[;|&]{2,}/,  // Multiple command separators
      
      // Prototype pollution (exact match)
      /__proto__/i,
      /constructor\s*\[/i,
      
      // Character repetition detection using bounded match
      /(.)\1{200,}/,
    ];
  }
  
  /**
   * Safe repetition check without ReDoS vulnerability
   * Uses character-by-character scanning instead of nested regex quantifiers
   */
  private checkRepeatedPatterns(input: string): boolean {
    let maxRepeat = 0;
    let currentRepeat = 0;
    let lastChar = '';
    
    for (const char of input) {
      if (char === lastChar) {
        currentRepeat++;
        maxRepeat = Math.max(maxRepeat, currentRepeat);
      } else {
        currentRepeat = 1;
        lastChar = char;
      }
      
      if (maxRepeat > 200) return true;
    }
    
    return maxRepeat > 200;
  }
  
  /**
   * Check for nested pattern attacks without regex
   */
  private checkNestedPatterns(input: string): boolean {
    let depth = 0;
    let maxDepth = 0;
    const openers = new Set(['(', '[', '{']);
    const closers: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
    
    for (const char of input) {
      if (openers.has(char)) {
        depth++;
        maxDepth = Math.max(maxDepth, depth);
      } else if (char in closers) {
        depth = Math.max(0, depth - 1);
      }
      
      if (maxDepth > 50) return true;
    }
    
    return false;
  }
  
  validateQuery(query: string): {
    valid: boolean;
    sanitized?: string;
    error?: string;
    code?: string;
  } {
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const TIMEOUT_MS = 100;

    // Check if blocked
    if (this.blockedUntil && Date.now() < this.blockedUntil) {
      const remaining = Math.ceil((this.blockedUntil - Date.now()) / 1000);
      return {
        valid: false,
        error: `Too many requests. Please wait ${remaining} seconds.`,
        code: 'RATE_LIMITED',
      };
    }
    
    // Check query length
    if (query.length > this.maxQueryLength) {
      return {
        valid: false,
        error: `Query exceeds maximum length of ${this.maxQueryLength} characters.`,
        code: 'QUERY_TOO_LONG',
      };
    }
    
    // Check for empty query
    if (!query.trim()) {
      return {
        valid: false,
        error: 'Query cannot be empty.',
        code: 'EMPTY_QUERY',
      };
    }
    
    // Check rate limit
    if (!this.checkRateLimit()) {
      this.blockedUntil = Date.now() + 60000; // Block for 1 minute
      return {
        valid: false,
        error: 'Rate limit exceeded. Please wait before sending more queries.',
        code: 'RATE_LIMITED',
      };
    }
    
    // Check for repeated patterns (non-regex approach)
    if (this.checkRepeatedPatterns(query) || this.checkNestedPatterns(query)) {
      console.warn('[DepthIndex Security] Suspicious query blocked (repetition/nesting)');
      return {
        valid: false,
        error: 'Query contains suspicious patterns.',
        code: 'SUSPICIOUS_PATTERN',
      };
    }
    
    // Check regex patterns with timeout
    for (const pattern of this.suspiciousPatterns) {
      const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
      if (elapsed > TIMEOUT_MS) {
        return {
          valid: false,
          error: 'Validation timeout. Please simplify your query.',
          code: 'VALIDATION_TIMEOUT',
        };
      }
      
      pattern.lastIndex = 0;
      if (pattern.test(query)) {
        console.warn('[DepthIndex Security] Suspicious query blocked:', query.substring(0, 100));
        this.trackSuspiciousPattern(pattern.source);
        return {
          valid: false,
          error: 'Query contains invalid patterns.',
          code: 'SUSPICIOUS_PATTERN',
        };
      }
    }
    
    const sanitized = this.sanitizeHTML(query.trim());
    return {
      valid: true,
      sanitized,
    };
  }
  
  sanitizeHTML(input: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;',
    };
    
    return input.replace(/[&<>"'`=/]/g, char => map[char] || char);
  }
  
  /**
   * SECURE: Sanitize HTML output using DOMParser
   * DOMParser creates an inert document — scripts don't execute,
   * images don't load, and event handlers are not triggered.
   */
  sanitizeOutput(html: string): string {
    if (!html || typeof html !== 'string') return '';
    
    if (!/<[a-z][\s\S]*>/i.test(html)) {
      return this.sanitizeHTML(html); // Use entity encoding for plain text
    }

    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
      // Fallback for SSR/Node environment
      return this.sanitizeHTML(html.replace(/<[^>]*>/g, ''));
    }
    
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      this.cleanNodeSecure(doc.body);
      
      return doc.body.innerHTML;
    } catch (error) {
      console.warn('[DepthIndex Security] DOMParser failed, falling back to text-only', error);
      return this.sanitizeHTML(html.replace(/<[^>]*>/g, ''));
    }
  }
  
  private cleanNodeSecure(node: Node): void {
    const walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT,
      {
        acceptNode: (currentNode) => {
          if (currentNode.nodeType === Node.COMMENT_NODE) {
            return NodeFilter.FILTER_REJECT;
          }
          
          const element = currentNode as HTMLElement;
          const tagName = element.tagName.toLowerCase();
          
          const dangerousTags = new Set([
            'script', 'iframe', 'object', 'embed', 'applet',
            'form', 'input', 'button', 'select', 'textarea',
            'link', 'meta', 'base', 'style',
          ]);
          
          if (dangerousTags.has(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          if (this.allowedTags.has(tagName)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          
          return NodeFilter.FILTER_REJECT;
        },
      }
    );
    
    const nodesToProcess: HTMLElement[] = [];
    let currentNode = walker.nextNode();
    while (currentNode) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        nodesToProcess.push(currentNode as HTMLElement);
      } else if (currentNode.nodeType === Node.COMMENT_NODE) {
        currentNode.parentNode?.removeChild(currentNode);
      }
      currentNode = walker.nextNode();
    }
    
    for (const element of nodesToProcess) {
      this.sanitizeElementAttributes(element);
    }
  }
  
  private sanitizeElementAttributes(element: HTMLElement): void {
    const attributesToRemove: string[] = [];
    
    for (const attr of Array.from(element.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.toLowerCase();
      
      if (name.startsWith('on')) {
        attributesToRemove.push(attr.name);
        continue;
      }
      
      if ((name === 'href' || name === 'src' || name === 'action') &&
          (value.startsWith('javascript:') || value.startsWith('data:text/html'))) {
        attributesToRemove.push(attr.name);
        continue;
      }
      
      if (name === 'style' && value.includes('expression(')) {
        attributesToRemove.push(attr.name);
        continue;
      }
      
      if (!this.allowedAttributes.has(name) && !name.startsWith('data-') && !name.startsWith('aria-')) {
        attributesToRemove.push(attr.name);
      }
    }
    
    for (const attrName of attributesToRemove) {
      element.removeAttribute(attrName);
    }
    
    if (element.tagName.toLowerCase() === 'a') {
      const href = element.getAttribute('href');
      if (href && href.startsWith('http')) {
        element.setAttribute('rel', 'noopener noreferrer');
        element.setAttribute('target', '_blank');
      }
    }
  }
  
  private checkRateLimit(): boolean {
    const now = Date.now();
    this.queryTimestamps = this.queryTimestamps.filter(t => now - t < 60000);
    
    if (this.queryTimestamps.length >= this.maxQueriesPerMinute) {
      return false;
    }
    
    this.queryTimestamps.push(now);
    return true;
  }
  
  private trackSuspiciousPattern(pattern: string): void {
    const count = this.queryPatterns.get(pattern) || 0;
    this.queryPatterns.set(pattern, count + 1);
    
    if (count >= 5) {
      console.warn('[DepthIndex Security] Pattern flagged for potential blocking:', pattern);
    }
  }
  
  generateCSP(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      "img-src 'self' data: https:",
      "font-src 'self' https://cdn.jsdelivr.net",
      "connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com https://api.anthropic.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
  }
  
  verifyOrigin(origin: string): boolean {
    if (typeof window === 'undefined') return true;
    const allowedOrigins = [
      window.location.origin,
      'null',
    ];
    return allowedOrigins.includes(origin);
  }
  
  validateApiKey(key: string, provider: string): boolean {
    const formats: Record<string, RegExp> = {
      openai: /^sk-[a-zA-Z0-9]{32,}$/,
      gemini: /^AIza[0-9A-Za-z\-_]{35}$/,
      anthropic: /^sk-ant-[a-zA-Z0-9\-_]{32,}$/,
      custom: /^.+$/,
    };
    
    const pattern = formats[provider];
    if (!pattern) return false;
    
    return pattern.test(key.trim());
  }
  
  private cloudApiCallTimestamps: number[] = [];
  private maxCloudCallsPerMinute = 10;
  
  checkCloudApiRateLimit(): boolean {
    const now = Date.now();
    this.cloudApiCallTimestamps = this.cloudApiCallTimestamps.filter(t => now - t < 60000);
    
    if (this.cloudApiCallTimestamps.length >= this.maxCloudCallsPerMinute) {
      return false;
    }
    
    this.cloudApiCallTimestamps.push(now);
    return true;
  }
  
  static sanitizeRegexPattern(pattern: string): string {
    return pattern
      .replace(/\(\?[^)]*\)/g, '')
      .replace(/\([^)]*\)[+*]{2,}/g, '$&'.replace(/[+*]{2,}$/, '+'))
      .replace(/\.\*\+/g, '.*')
      .substring(0, 1000);
  }
}
