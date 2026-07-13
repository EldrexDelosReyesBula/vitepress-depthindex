export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  INDEX_LOAD = 'index_load',
  SEARCH_EXECUTION = 'search_execution',
  RENDERING = 'rendering',
  NETWORK = 'network',
  STORAGE = 'storage',
  CLOUD_API = 'cloud_api',
  VALIDATION = 'validation',
  SECURITY = 'security',
  UNKNOWN = 'unknown',
}

export interface DepthIndexError {
  id: string;
  timestamp: number;
  severity: ErrorSeverity;
  category: ErrorCategory;
  code: string;
  message: string;
  details?: string;
  stack?: string;
  context?: Record<string, any>;
  recoverable: boolean;
  userAction?: string;
}

export interface ErrorReportConfig {
  enabled: boolean;
  target: 'github' | 'email' | 'custom' | 'none';
  githubRepo?: string; // e.g., 'username/repo'
  emailAddress?: string;
  customEndpoint?: string;
  customHandler?: (error: DepthIndexError) => void;
  includeSystemInfo: boolean;
  includeQueryContext: boolean;
  sanitizeUserData: boolean;
}

export class ErrorHandler {
  private errors: DepthIndexError[] = [];
  private maxErrors = 50; // Prevent memory overflow
  private reportConfig: ErrorReportConfig;
  private listeners: Map<string, ((error: DepthIndexError) => void)[]> = new Map();
  private isReporting = false;
  private reportQueue: DepthIndexError[] = [];
  
  // Rate limiting for error reporting
  private reportRateLimit = new Map<string, number>();
  private rateLimitWindow = 60000; // 1 minute
  
  // Sanitization patterns
  private sensitivePatterns = [
    /api[_-]?key[=:]\s*['"]?[\w-]+['"]?/gi,
    /Bearer\s+[\w-]+\.[\w-]+\.[\w-]+/gi,
    /sk-[a-zA-Z0-9]{32,}/gi,
    /AIza[0-9A-Za-z\-_]{35}/gi,
    /password[=:]\s*['"]?[^'"]+['"]?/gi,
    /token[=:]\s*['"]?[^'"]+['"]?/gi,
  ];
  
  constructor(config?: Partial<ErrorReportConfig>) {
    this.reportConfig = {
      enabled: true,
      target: 'github',
      githubRepo: 'EldrexDelosReyesBula/vitepress-depthindex', // Default repo
      includeSystemInfo: true,
      includeQueryContext: true,
      sanitizeUserData: true,
      ...config,
    };
    
    if (typeof window !== 'undefined') {
      this.setupGlobalHandlers();
    }
  }
  
  private setupGlobalHandlers(): void {
    if (typeof window === 'undefined') return;

    // Catch unhandled promises
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        new Error(event.reason?.message || 'Unhandled Promise Rejection'),
        ErrorCategory.UNKNOWN,
        ErrorSeverity.ERROR,
        { reason: event.reason }
      );
    });
    
    // Catch global errors
    window.addEventListener('error', (event) => {
      this.handleError(
        new Error(event.message || 'Unknown Error'),
        ErrorCategory.UNKNOWN,
        ErrorSeverity.ERROR,
        { filename: event.filename, lineno: event.lineno }
      );
    });
  }
  
  handleError(
    error: Error,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context?: Record<string, any>
  ): DepthIndexError {
    // Prevent infinite loop if already reported
    if (context?.alreadyReported) {
      return {
        id: this.generateErrorId(),
        timestamp: Date.now(),
        severity,
        category,
        code: `${category}_${severity}`.toUpperCase(),
        message: error.message,
        recoverable: true
      };
    }

    const depthError: DepthIndexError = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      severity,
      category,
      code: `${category}_${severity}`.toUpperCase(),
      message: this.sanitizeMessage(error.message),
      details: error.stack ? this.sanitizeMessage(error.stack) : undefined,
      context: context ? this.sanitizeContext(context) : {},
      recoverable: severity !== ErrorSeverity.CRITICAL,
      userAction: this.getUserAction(category, severity),
    };
    
    // Mark as reported to prevent recursive loops
    depthError.context = { ...depthError.context, alreadyReported: true };

    // Store error
    this.errors.unshift(depthError);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }
    
    // Notify listeners
    this.notifyListeners(category, depthError);
    
    // Log appropriately
    this.logError(depthError);
    
    // Auto-report if configured
    if (this.reportConfig.enabled && typeof window !== 'undefined') {
      this.reportError(depthError);
    }
    
    return depthError;
  }
  
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
  
  private sanitizeMessage(message: string): string {
    if (!this.reportConfig.sanitizeUserData) return message;
    
    let sanitized = message;
    for (const pattern of this.sensitivePatterns) {
      sanitized = sanitized.replace(pattern, (match) => {
        const prefix = match.split(/[=:]/)[0];
        return `${prefix}=[REDACTED]`;
      });
    }
    return sanitized;
  }
  
  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    if (!this.reportConfig.sanitizeUserData) return context;
    
    const sanitized: Record<string, any> = {};
    const sensitiveKeys = ['apiKey', 'token', 'password', 'secret', 'credential'];
    
    for (const [key, value] of Object.entries(context)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string') {
        sanitized[key] = this.sanitizeMessage(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  private getUserAction(category: ErrorCategory, severity: ErrorSeverity): string {
    const actions: Record<string, string> = {
      [ErrorCategory.INDEX_LOAD]: 'Try refreshing the page. If the problem persists, the documentation index may need to be rebuilt.',
      [ErrorCategory.SEARCH_EXECUTION]: 'Try rephrasing your question or checking your internet connection for cloud mode.',
      [ErrorCategory.NETWORK]: 'Check your internet connection. You can switch to offline-only mode in settings.',
      [ErrorCategory.CLOUD_API]: 'Verify your API key is correct and has sufficient credits. Check the API provider status page.',
      [ErrorCategory.STORAGE]: 'Try clearing your browser storage or check if private browsing mode is enabled.',
      [ErrorCategory.SECURITY]: 'This action was blocked for security reasons. If you believe this is an error, please report it.',
      [ErrorCategory.VALIDATION]: 'Please check your input and try again.',
    };
    
    return actions[category] || 'Please try again. If the issue persists, report it to the documentation maintainer.';
  }
  
  private logError(error: DepthIndexError): void {
    const logMethod = 
      error.severity === ErrorSeverity.CRITICAL ? console.error :
      error.severity === ErrorSeverity.ERROR ? console.error :
      error.severity === ErrorSeverity.WARNING ? console.warn :
      console.info;
    
    logMethod(
      `[DepthIndex] ${error.severity.toUpperCase()}: ${error.message}`,
      { code: error.code, category: error.category, context: error.context }
    );
  }
  
  /**
   * PUBLIC: Report an error directly without triggering listeners
   * Used for user-initiated error reports to avoid infinite loops
   */
  async reportErrorDirectly(error: DepthIndexError): Promise<void> {
    if (typeof window === 'undefined') return;

    if (this.isReporting) {
      this.reportQueue.push(error);
      return;
    }
    
    this.isReporting = true;
    
    try {
      await this.sendErrorReport(error);
    } catch (e) {
      console.error('[DepthIndex] Failed to send error report:', e);
    } finally {
      this.isReporting = false;
      if (this.reportQueue.length > 0) {
        const next = this.reportQueue.shift()!;
        this.reportErrorDirectly(next);
      }
    }
  }

  private async reportError(error: DepthIndexError): Promise<void> {
    if (typeof window === 'undefined') return;

    // Rate limit checking
    if (!this.checkRateLimit(error.category)) {
      console.warn('[DepthIndex] Error reporting rate limited for category:', error.category);
      return;
    }
    
    // Explicitly ask for user permission before redirection or reporting
    const consent = window.confirm(`An error occurred in DepthIndex:\n${error.message}\n\nDo you want to report this error and open the issue submission page?`);
    if (!consent) return;
    
    await this.sendErrorReport(error);
  }

  private async sendErrorReport(error: DepthIndexError): Promise<void> {
    switch (this.reportConfig.target) {
      case 'github':
        await this.reportToGithub(error);
        break;
      case 'email':
        this.reportViaEmail(error);
        break;
      case 'custom':
        await this.reportToCustomEndpoint(error);
        break;
    }
  }
  
  private checkRateLimit(category: string): boolean {
    const now = Date.now();
    const key = `report_${category}`;
    const lastReport = this.reportRateLimit.get(key) || 0;
    
    if (now - lastReport < this.rateLimitWindow) {
      return false;
    }
    
    this.reportRateLimit.set(key, now);
    return true;
  }
  
  private async reportToGithub(error: DepthIndexError): Promise<void> {
    if (typeof window === 'undefined') return;
    
    const reportValidation = this.validateReportTarget();
    
    if (reportValidation.valid) {
      this.showReportButton(error);
    } else {
      this.showGenericReportLink(error);
    }
  }
  
  private reportViaEmail(error: DepthIndexError): void {
    if (!this.reportConfig.emailAddress || typeof window === 'undefined') return;
    
    const subject = encodeURIComponent(
      `[DepthIndex Error] ${error.category}: ${error.message.substring(0, 80)}`
    );
    const body = encodeURIComponent(this.formatErrorForReport(error));
    
    window.location.href = `mailto:${this.reportConfig.emailAddress}?subject=${subject}&body=${body}`;
  }
  
  private async reportToCustomEndpoint(error: DepthIndexError): Promise<void> {
    if (!this.reportConfig.customEndpoint || typeof window === 'undefined') return;
    
    try {
      await fetch(this.reportConfig.customEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error,
          systemInfo: this.reportConfig.includeSystemInfo ? this.getSystemInfo() : undefined,
        }),
      });
    } catch (e) {
      console.warn('[DepthIndex] Failed to report error to custom endpoint:', e);
    }
  }
  
  public formatErrorForReport(error: DepthIndexError): string {
    let report = `## Error Report\n\n`;
    report += `**Error ID:** \`${error.id}\`\n`;
    report += `**Timestamp:** ${new Date(error.timestamp).toISOString()}\n`;
    report += `**Severity:** ${error.severity}\n`;
    report += `**Category:** ${error.category}\n`;
    report += `**Code:** ${error.code}\n\n`;
    report += `### Message\n\`\`\`\n${error.message}\n\`\`\`\n\n`;
    
    if (error.details) {
      report += `### Details\n\`\`\`\n${error.details}\n\`\`\`\n\n`;
    }
    
    if (error.context && Object.keys(error.context).length > 0) {
      report += `### Context\n\`\`\`json\n${JSON.stringify(error.context, null, 2)}\n\`\`\`\n\n`;
    }
    
    if (this.reportConfig.includeSystemInfo && typeof window !== 'undefined') {
      report += `### System Info\n${this.getSystemInfo()}\n\n`;
    }
    
    report += `### User Action\n${error.userAction}\n\n`;
    report += `---\n*Automatically reported by DepthIndex Error Handler*`;
    
    return report;
  }
  
  private getSystemInfo(): string {
    if (typeof window === 'undefined') return '';
    return [
      `- **User Agent:** ${navigator.userAgent}`,
      `- **Platform:** ${navigator.platform}`,
      `- **Language:** ${navigator.language}`,
      `- **Screen:** ${window.screen.width}x${window.screen.height}`,
      `- **Online:** ${navigator.onLine}`,
      `- **Memory:** ${(performance as any).memory?.jsHeapSizeLimit ? `${Math.round((performance as any).memory.jsHeapSizeLimit / 1048576)}MB` : 'N/A'}`,
      `- **DepthIndex Version:** ${this.getVersion()}`,
      `- **URL:** ${window.location.href}`,
    ].join('\n');
  }
  
  private getVersion(): string {
    if (typeof window === 'undefined') return 'unknown';
    return (window as any).__DEPTHINDEX_VERSION__ || '1.0.1';
  }
  
  onError(category: ErrorCategory | '*', callback: (error: DepthIndexError) => void): () => void {
    const key = category || '*';
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key)!.push(callback);
    
    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) listeners.splice(index, 1);
      }
    };
  }
  
  private notifyListeners(category: ErrorCategory, error: DepthIndexError): void {
    const categoryListeners = this.listeners.get(category) || [];
    const allListeners = this.listeners.get('*') || [];
    
    for (const listener of [...categoryListeners, ...allListeners]) {
      try {
        listener(error);
      } catch (e) {
        console.error('[DepthIndex] Error in error listener:', e);
      }
    }
  }
  
  getErrors(): DepthIndexError[] {
    return [...this.errors];
  }
  
  clearErrors(): void {
    this.errors = [];
  }
  
  setReportConfig(config: Partial<ErrorReportConfig>): void {
    this.reportConfig = { ...this.reportConfig, ...config };
  }

  // Error report targets with validation
  validateReportTarget(): { valid: boolean; reason?: string } {
    switch (this.reportConfig.target) {
      case 'github':
        if (!this.reportConfig.githubRepo) {
          return { valid: false, reason: 'No GitHub repository configured for error reporting.' };
        }
        // Check repo format
        if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(this.reportConfig.githubRepo)) {
          return { valid: false, reason: 'Invalid GitHub repository format. Use "owner/repo".' };
        }
        break;
        
      case 'email':
        if (!this.reportConfig.emailAddress) {
          return { valid: false, reason: 'No email address configured for error reporting.' };
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.reportConfig.emailAddress)) {
          return { valid: false, reason: 'Invalid email address format.' };
        }
        break;
        
      case 'custom':
        if (!this.reportConfig.customEndpoint) {
          return { valid: false, reason: 'No custom endpoint configured for error reporting.' };
        }
        break;
    }
    
    return { valid: true };
  }

  private pendingReport: any = null;

  private showReportButton(error: DepthIndexError): void {
    const reportData = {
      title: `[Auto-Report] ${error.category}: ${error.message.substring(0, 80)}`,
      body: this.formatErrorForReport(error),
      labels: 'bug,auto-reported',
    };
    
    this.pendingReport = reportData;
    
    window.dispatchEvent(new CustomEvent('depthindex:error-report-available', {
      detail: {
        error,
        reportData,
        canReport: true,
      },
    }));
  }
  
  private showGenericReportLink(error: DepthIndexError): void {
    const defaultRepo = 'EldrexDelosReyesBula/vitepress-depthindex';
    
    window.dispatchEvent(new CustomEvent('depthindex:error-report-available', {
      detail: {
        error,
        reportData: {
          title: `[Error] ${error.category}: ${error.message.substring(0, 80)}`,
          body: this.formatErrorForReport(error),
          defaultRepo,
        },
        canReport: false,
        message: `Report manually at: https://github.com/${defaultRepo}/issues/new`,
      },
    }));
  }

  async openGitHubIssue(error: DepthIndexError): Promise<void> {
    const repo = this.reportConfig.githubRepo || 'EldrexDelosReyesBula/vitepress-depthindex';
    
    const issueTitle = encodeURIComponent(
      `[Error] ${error.category}: ${error.message.substring(0, 80)}`
    );
    const issueBody = encodeURIComponent(this.formatErrorForReport(error));
    const labels = encodeURIComponent('bug,auto-reported');
    
    const url = `https://github.com/${repo}/issues/new?title=${issueTitle}&body=${issueBody}&labels=${labels}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('depthindex:error-copy-fallback', {
        detail: {
          message: 'If the issue page didn\'t open, copy the error details below:',
          copyText: this.formatErrorForReport(error),
          issueUrl: url,
        },
      }));
    }, 500);
  }
  
  getPendingReport(): any {
    return this.pendingReport;
  }
  
  clearPendingReport(): void {
    this.pendingReport = null;
  }

  getReportConfig(): ErrorReportConfig {
    return this.reportConfig;
  }
}
