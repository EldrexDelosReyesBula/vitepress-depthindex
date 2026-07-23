// src/sdk/subscription/gate.ts

import { SubscriptionConfig, SubscriptionPlan, SubscriptionUser, PlanFeatures } from './types.js';

export class SubscriptionGate {
  private config: SubscriptionConfig;
  private currentUser: SubscriptionUser | null = null;
  private checkPromise: Promise<SubscriptionUser | null> | null = null;

  constructor(config: SubscriptionConfig) {
    this.config = config;
  }

  /**
   * Check if user has access to a feature.
   */
  async canAccess(feature: keyof PlanFeatures): Promise<boolean> {
    if (!this.config.enabled) return true;

    const user = await this.getCurrentUser();
    if (!user) return false;

    const plan = this.getPlan(user.plan);
    if (!plan) return false;

    return !!plan.features[feature];
  }

  /**
   * Check if user has remaining queries.
   */
  async canQuery(): Promise<boolean> {
    if (!this.config.enabled) return true;

    const user = await this.getCurrentUser();
    if (!user) return false;

    const plan = this.getPlan(user.plan);
    if (!plan) return false;

    return user.queriesUsed < plan.features.maxQueriesPerDay;
  }

  /**
   * Track query usage.
   */
  async trackQuery(): Promise<void> {
    if (!this.config.enabled) return;

    const user = await this.getCurrentUser();
    if (!user) return;

    user.queriesUsed++;
  }

  /**
   * Get current user with caching.
   */
  private async getCurrentUser(): Promise<SubscriptionUser | null> {
    if (this.currentUser) return this.currentUser;
    if (this.checkPromise) return this.checkPromise;

    this.checkPromise = this.config.checkAccess();
    this.currentUser = await this.checkPromise;
    this.checkPromise = null;

    return this.currentUser;
  }

  /**
   * Get plan by ID.
   */
  getPlan(planId: string): SubscriptionPlan | undefined {
    return this.config.plans.find(p => p.id === planId);
  }

  /**
   * Get all plans.
   */
  getPlans(): SubscriptionPlan[] {
    return this.config.plans;
  }

  /**
   * Get upgrade prompt HTML.
   */
  getUpgradePrompt(feature?: string): string {
    const msg = this.config.ui?.upgradeMessage || 
      `Upgrade to access ${feature || 'this feature'}`;
    const btn = this.config.ui?.upgradeButtonText || 'Upgrade';
    const url = this.config.ui?.upgradeUrl || '/pricing';

    return `
      <div class="di-upgrade-prompt">
        <p>${msg}</p>
        <a href="${url}" class="di-upgrade-btn">${btn}</a>
      </div>
    `;
  }

  /**
   * Clear user cache (on logout/plan change).
   */
  clearCache(): void {
    this.currentUser = null;
  }
}
