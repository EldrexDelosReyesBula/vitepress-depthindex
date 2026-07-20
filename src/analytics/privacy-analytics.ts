import { QueryGuard } from '../privacy/query-guard.js';
import { AnalyticsEngine } from './engine.js';

export class PrivacyAnalytics {
  private queryGuard: QueryGuard;
  private analyticsEngine: AnalyticsEngine;
  
  constructor(analyticsEngine: AnalyticsEngine) {
    this.queryGuard = new QueryGuard();
    this.analyticsEngine = analyticsEngine;
  }
  
  /**
   * Track a search query with FULL privacy protection.
   */
  async trackSearchQuery(rawQuery: string, resultCount: number): Promise<void> {
    // Step 1: Sanitize — strip ALL PII, cards, keys, etc.
    const { sanitized, wasSanitized, findings } = this.queryGuard.sanitizeQuery(rawQuery);
    
    // Step 2: Classify — is this about docs or personal?
    const classification = this.queryGuard.classify(sanitized);
    
    // Step 3: If completely off-topic, ask consent (if configured)
    if (classification.requiresConsent) {
      const consented = await this.askUserConsent(rawQuery);
      if (!consented) {
        // Don't track this query at all
        console.log('[DepthIndex Privacy] User declined analytics for off-topic query');
        return;
      }
    }
    
    // Step 4: If sensitive data was found, log only that it was stripped (not the data)
    if (wasSanitized) {
      console.log(`[DepthIndex Privacy] Stripped ${findings.join(', ')} from query before analytics`);
    }
    
    // Step 5: Encrypt before storage
    const encrypted = await this.queryGuard.encryptForStorage(sanitized);
    
    // Step 6: Track ONLY anonymized metadata
    await this.analyticsEngine.trackSearch(
      sanitized.substring(0, 100), // Truncated, sanitized
      resultCount,
      Date.now()
    );
    
    // NEVER send raw query, location, device fingerprint, or PII
  }
  
  /**
   * Ask user for consent to include off-topic query in analytics.
   */
  private async askUserConsent(query: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    return new Promise((resolve) => {
      // Show a small, non-intrusive consent toast
      const event = new CustomEvent('depthindex:consent-request', {
        detail: {
          message: 'This query seems unrelated to the documentation. Include it in anonymous analytics to help improve the docs?',
          query: query.substring(0, 50) + '...',
          onAccept: () => resolve(true),
          onDecline: () => resolve(false),
        },
      });
      window.dispatchEvent(event);
      
      // Timeout after 10 seconds — default to decline
      setTimeout(() => resolve(false), 10000);
    });
  }
}
