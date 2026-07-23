import { describe, it, expect, vi } from 'vitest';
import { WebhookManager, WebhookConfig } from '../src/sdk/webhooks/index.js';

describe('Webhook SDK Module', () => {
  it('should register webhook config and send sanitized payload', async () => {
    const manager = new WebhookManager();
    const config: WebhookConfig = {
      url: 'https://example.com/webhook',
      secret: 'super_secret',
      events: ['search.query'],
    };

    manager.register(config);

    // Mock global fetch if present
    const originalFetch = global.fetch;
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    await manager.send('search.query', {
      query: 'Test search',
      email: 'user@secret.com', // PII to be sanitized
      apiKey: 'sk-12345',       // Sensitive data to be removed
    });

    expect(mockFetch).toHaveBeenCalled();
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[0]).toBe('https://example.com/webhook');

    const body = JSON.parse(callArgs[1].body);
    expect(body.event).toBe('search.query');
    expect(body.data.query).toBe('Test search');
    expect(body.data.email).toBeUndefined();
    expect(body.data.apiKey).toBeUndefined();
    expect(body.signature).toBeDefined();

    global.fetch = originalFetch;
  });
});
