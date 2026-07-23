// src/client/banner-manager.ts

import { BannerConfig } from '../types/banner.js';

export class BannerManager {
  private banners: BannerConfig[] = [];
  private searchCount = 0;
  private pageViewCount = 0;
  private activeBanners: Set<string> = new Set();
  private dismissedBanners: Set<string> = new Set();

  constructor(banners: BannerConfig[] = []) {
    this.banners = [...banners];
    this.loadDismissed();
  }

  private loadDismissed(): void {
    for (const banner of this.banners) {
      if (this.isDismissed(banner)) {
        this.dismissedBanners.add(banner.id);
      }
    }
  }

  public register(banner: BannerConfig): void {
    this.banners.push(banner);
  }

  public trackSearch(): BannerConfig[] {
    this.searchCount++;
    return this.evaluateTriggers();
  }

  public trackPageView(currentPath?: string): BannerConfig[] {
    this.pageViewCount++;
    return this.evaluateTriggers(currentPath);
  }

  public trackExitIntent(): BannerConfig[] {
    return this.banners.filter(b => {
      if (this.isDismissed(b)) return false;
      return !!b.trigger?.onExitIntent;
    });
  }

  public evaluateTriggers(currentPath?: string): BannerConfig[] {
    const triggered: BannerConfig[] = [];

    for (const banner of this.banners) {
      if (this.isDismissed(banner)) continue;

      const trigger = banner.trigger;
      if (!trigger) {
        triggered.push(banner);
        this.activeBanners.add(banner.id);
        continue;
      }

      let matches = true;

      if (trigger.afterSearches !== undefined && this.searchCount < trigger.afterSearches) {
        matches = false;
      }

      if (trigger.afterPageViews !== undefined && this.pageViewCount < trigger.afterPageViews) {
        matches = false;
      }

      if (trigger.onPages && currentPath) {
        const pathMatches = trigger.onPages.some(page => currentPath.includes(page));
        if (!pathMatches) matches = false;
      }

      if (matches) {
        triggered.push(banner);
        this.activeBanners.add(banner.id);
      }
    }

    return triggered;
  }

  public dismiss(bannerId: string): void {
    this.dismissedBanners.add(bannerId);
    this.activeBanners.delete(bannerId);

    const banner = this.banners.find(b => b.id === bannerId);
    if (!banner) return;

    if (banner.showOnceEver && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`di_banner_dismissed_ever_${bannerId}`, '1');
      } catch {}
    } else if (banner.showOnce && typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem(`di_banner_dismissed_session_${bannerId}`, '1');
      } catch {}
    }
  }

  private isDismissed(banner: BannerConfig): boolean {
    if (this.dismissedBanners.has(banner.id)) return true;

    if (banner.showOnceEver && typeof localStorage !== 'undefined') {
      try {
        if (localStorage.getItem(`di_banner_dismissed_ever_${banner.id}`)) return true;
      } catch {}
    }

    if (banner.showOnce && typeof sessionStorage !== 'undefined') {
      try {
        if (sessionStorage.getItem(`di_banner_dismissed_session_${banner.id}`)) return true;
      } catch {}
    }

    return false;
  }

  public getActiveBanners(): BannerConfig[] {
    return this.banners.filter(b => this.activeBanners.has(b.id) && !this.isDismissed(b));
  }
}
