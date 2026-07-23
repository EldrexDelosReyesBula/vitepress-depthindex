import { describe, it, expect, vi } from 'vitest';
import { SubscriptionGate, SubscriptionConfig } from '../src/sdk/subscription/index.js';

describe('Subscription SDK Module', () => {
  const sampleConfig: SubscriptionConfig = {
    enabled: true,
    provider: 'stripe',
    plans: [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: {
          maxQueriesPerDay: 2,
          maxTokensPerQuery: 500,
          cloudAI: false,
          chatHistory: false,
          citations: true,
          codeBlocks: true,
          exportChats: false,
          customAI: false,
          prioritySupport: false,
        },
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 29,
        currency: 'USD',
        interval: 'month',
        features: {
          maxQueriesPerDay: 500,
          maxTokensPerQuery: 4000,
          cloudAI: true,
          chatHistory: true,
          citations: true,
          codeBlocks: true,
          exportChats: true,
          customAI: true,
          prioritySupport: true,
        },
      },
    ],
    checkAccess: async () => ({
      id: 'usr_123',
      plan: 'free',
      status: 'active',
      startedAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
      queriesUsed: 0,
      tokensUsed: 0,
    }),
  };

  it('should restrict feature access for Free plan', async () => {
    const gate = new SubscriptionGate(sampleConfig);
    const canCloudAI = await gate.canAccess('cloudAI');
    const canCitations = await gate.canAccess('citations');

    expect(canCloudAI).toBe(false);
    expect(canCitations).toBe(true);
  });

  it('should enforce maxQueriesPerDay limit', async () => {
    const gate = new SubscriptionGate(sampleConfig);

    expect(await gate.canQuery()).toBe(true);
    await gate.trackQuery();
    expect(await gate.canQuery()).toBe(true);
    await gate.trackQuery();
    expect(await gate.canQuery()).toBe(false);
  });

  it('should generate upgrade prompt HTML', () => {
    const gate = new SubscriptionGate(sampleConfig);
    const html = gate.getUpgradePrompt('cloudAI');
    expect(html).toContain('di-upgrade-prompt');
    expect(html).toContain('cloudAI');
  });

  it('should allow everything when disabled', async () => {
    const gate = new SubscriptionGate({ ...sampleConfig, enabled: false });
    expect(await gate.canAccess('cloudAI')).toBe(true);
    expect(await gate.canQuery()).toBe(true);
  });
});
