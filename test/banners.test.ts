import { describe, it, expect } from 'vitest';
import { BannerManager } from '../src/client/banner-manager.js';
import { BannerConfig } from '../src/types/banner.js';

describe('Banner & Modal System', () => {
  const sampleBanner: BannerConfig = {
    id: 'test-offer',
    type: 'modal',
    position: 'center',
    content: 'Special Offer',
    showOnce: true,
    trigger: {
      afterSearches: 2,
    },
  };

  it('should trigger banner after required search count', () => {
    const manager = new BannerManager([sampleBanner]);

    let active = manager.trackSearch();
    expect(active.length).toBe(0);

    active = manager.trackSearch();
    expect(active.length).toBe(1);
    expect(active[0].id).toBe('test-offer');
  });

  it('should dismiss banner and filter it out', () => {
    const manager = new BannerManager([sampleBanner]);
    manager.trackSearch();
    manager.trackSearch();

    manager.dismiss('test-offer');
    const active = manager.getActiveBanners();
    expect(active.length).toBe(0);
  });
});
