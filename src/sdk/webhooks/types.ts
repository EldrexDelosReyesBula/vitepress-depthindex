// src/sdk/webhooks/types.ts

export type WebhookEvent =
  | 'search.query'
  | 'search.no_results'
  | 'feedback.positive'
  | 'feedback.negative'
  | 'citation.click'
  | 'panel.open'
  | 'panel.close'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'subscription.expired'
  | 'user.signup'
  | 'user.login'
  | 'error.occurred';

export interface WebhookConfig {
  /** Webhook endpoint URL */
  url: string;
  
  /** Secret for HMAC signature verification */
  secret: string;
  
  /** Events to send */
  events: WebhookEvent[];
  
  /** Retry configuration */
  retry?: {
    maxRetries: number;
    backoff: 'linear' | 'exponential';
    initialDelay: number;
  };
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, any>;
  signature: string;
}

export class WebhookManager {
  private configs: WebhookConfig[] = [];

  constructor(configs?: WebhookConfig[]) {
    if (configs) {
      this.configs = [...configs];
    }
  }

  register(config: WebhookConfig): void {
    this.configs.push(config);
  }

  async send(event: WebhookEvent, data: Record<string, any>): Promise<void> {
    const matchingConfigs = this.configs.filter(c => c.events.includes(event));

    for (const config of matchingConfigs) {
      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data: this.sanitizeData(data),
        signature: '',
      };

      payload.signature = await this.signPayload(payload, config.secret);

      try {
        if (typeof fetch !== 'undefined') {
          await fetch(config.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-DepthIndex-Signature': payload.signature,
              'X-DepthIndex-Event': event,
            },
            body: JSON.stringify(payload),
          });
        }
      } catch (error) {
        console.warn(`[DepthIndex Webhook] Failed to send ${event}:`, error);
      }
    }
  }

  private async signPayload(payload: Omit<WebhookPayload, 'signature'>, secret: string): Promise<string> {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(payload));
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const signature = await crypto.subtle.sign('HMAC', key, data);
        return btoa(String.fromCharCode(...new Uint8Array(signature)));
      } catch {
        // Fallback if crypto subtle fails in specific runner environments
      }
    }
    return 'sig_' + btoa(secret + ':' + JSON.stringify(payload)).substring(0, 32);
  }

  private sanitizeData(data: Record<string, any>): Record<string, any> {
    const sanitized = { ...data };
    delete sanitized.apiKey;
    delete sanitized.email;
    delete sanitized.phone;
    delete sanitized.password;
    delete sanitized.token;
    return sanitized;
  }
}
