// src/sdk/subscription/types.ts

export interface PlanFeatures {
  maxQueriesPerDay: number;
  maxTokensPerQuery: number;
  cloudAI: boolean;
  chatHistory: boolean;
  citations: boolean;
  codeBlocks: boolean;
  exportChats: boolean;
  customAI: boolean;
  prioritySupport: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year' | 'lifetime';
  features: PlanFeatures;
}

export interface SubscriptionUser {
  id: string;
  plan: string;
  status: 'active' | 'cancelled' | 'expired' | 'trialing';
  startedAt: string;
  expiresAt: string;
  queriesUsed: number;
  tokensUsed: number;
}

export interface SubscriptionConfig {
  /** Enable subscription gating */
  enabled: boolean;
  
  /** Subscription plans */
  plans: SubscriptionPlan[];
  
  /** Check user access */
  checkAccess: () => Promise<SubscriptionUser | null>;
  
  /** Webhook URL for subscription events */
  webhookUrl?: string;
  
  /** Webhook secret for verification */
  webhookSecret?: string;
  
  /** Payment provider */
  provider: 'stripe' | 'paddle' | 'lemonsqueezy' | 'gumroad' | 'custom';
  
  /** Provider configuration */
  providerConfig?: Record<string, any>;
  
  /** UI configuration */
  ui?: {
    /** Show upgrade prompts */
    showUpgradePrompts?: boolean;
    /** Upgrade prompt frequency */
    promptFrequency?: 'always' | 'daily' | 'weekly' | 'never';
    /** Custom upgrade message */
    upgradeMessage?: string;
    /** Custom upgrade button text */
    upgradeButtonText?: string;
    /** Custom upgrade URL */
    upgradeUrl?: string;
    /** Show plan comparison */
    showPlanComparison?: boolean;
  };
}
