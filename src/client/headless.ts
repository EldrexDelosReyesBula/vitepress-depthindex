// src/client/headless.ts

import { ref, readonly } from 'vue';
import { DepthIndexEngine } from './search-engine.js';
import { SearchResult, DepthIndexOptions } from '../types/index.js';
import { SubscriptionGate } from '../sdk/subscription/gate.js';
import { WebhookManager } from '../sdk/webhooks/types.js';
import { BannerManager } from './banner-manager.js';
import { BannerConfig } from '../types/banner.js';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  results?: SearchResult[];
  feedback?: 'positive' | 'negative';
}

export function useDepthIndex(options?: DepthIndexOptions) {
  const engine = new DepthIndexEngine();
  const messages = ref<ChatMessage[]>([]);
  const query = ref('');
  const isSearching = ref(false);
  const isPanelOpen = ref(false);
  const activeBanners = ref<BannerConfig[]>([]);

  const subscriptionGate = options?.subscription
    ? new SubscriptionGate(options.subscription)
    : null;

  const webhookManager = options?.webhooks
    ? new WebhookManager(options.webhooks)
    : new WebhookManager();

  const bannerManager = options?.banners
    ? new BannerManager(options.banners)
    : new BannerManager();

  if (options) {
    engine.init(options).catch(() => {});
  }

  const search = async (searchQuery: string, topK = 5): Promise<SearchResult[]> => {
    if (!searchQuery.trim()) return [];

    if (subscriptionGate) {
      const allowed = await subscriptionGate.canQuery();
      if (!allowed) {
        console.warn('[DepthIndex] Subscription query limit reached.');
        return [];
      }
      await subscriptionGate.trackQuery();
    }

    isSearching.value = true;
    query.value = searchQuery;

    // Trigger webhook for search
    webhookManager.send('search.query', { query: searchQuery }).catch(() => {});

    // Evaluate banner triggers
    activeBanners.value = bannerManager.trackSearch();

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      content: searchQuery,
      timestamp: new Date().toISOString(),
    };
    messages.value.push(userMsg);

    const results = engine.search(searchQuery, topK);

    if (results.length === 0) {
      webhookManager.send('search.no_results', { query: searchQuery }).catch(() => {});
    }

    const assistantMsg: ChatMessage = {
      id: 'msg_' + (Date.now() + 1),
      sender: 'assistant',
      content: results.length > 0
        ? `Found ${results.length} relevant sections in documentation.`
        : 'No relevant documentation found for your query.',
      timestamp: new Date().toISOString(),
      results,
    };
    messages.value.push(assistantMsg);

    isSearching.value = false;
    return results;
  };

  const sendFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    const msg = messages.value.find(m => m.id === messageId);
    if (msg) {
      msg.feedback = feedback;
      const eventName = feedback === 'positive' ? 'feedback.positive' : 'feedback.negative';
      webhookManager.send(eventName, { messageId, query: query.value }).catch(() => {});
    }
  };

  const openPanel = () => {
    isPanelOpen.value = true;
    webhookManager.send('panel.open', {}).catch(() => {});
  };

  const closePanel = () => {
    isPanelOpen.value = false;
    webhookManager.send('panel.close', {}).catch(() => {});
  };

  const dismissBanner = (bannerId: string) => {
    bannerManager.dismiss(bannerId);
    activeBanners.value = bannerManager.getActiveBanners();
  };

  return {
    engine,
    messages: readonly(messages),
    query,
    isSearching: readonly(isSearching),
    isPanelOpen: readonly(isPanelOpen),
    activeBanners: readonly(activeBanners),
    subscriptionGate,
    webhookManager,
    bannerManager,
    search,
    sendFeedback,
    openPanel,
    closePanel,
    dismissBanner,
  };
}
