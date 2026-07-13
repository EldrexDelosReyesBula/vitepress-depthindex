<template>
  <div class="compliance-section">
    <!-- Badges Row -->
    <div class="badges-row">
      <div 
        v-for="badge in visibleBadges" 
        :key="badge.label"
        class="compliance-badge"
        :title="badge.description"
      >
        <span class="badge-icon">{{ badge.icon }}</span>
        <span class="badge-label">{{ badge.label }}</span>
      </div>
    </div>
    
    <!-- Expandable Notices -->
    <details class="notices-details">
      <summary class="notices-summary">
        <span>📋 Legal Notices & Disclaimers</span>
      </summary>
      
      <div class="notices-content">
        <!-- AS-IS Notice -->
        <div class="notice-block warning">
          <h4>⚠️ AS-IS Disclaimer</h4>
          <p>{{ legalNotices.AS_IS }}</p>
        </div>
        
        <!-- Privacy Notice -->
        <div class="notice-block info">
          <h4>🔒 Privacy & Data Handling</h4>
          <p>{{ legalNotices.PRIVACY }}</p>
        </div>
        
        <!-- Third-Party Notice -->
        <div class="notice-block warning">
          <h4>🔗 Third-Party Integrations</h4>
          <p>{{ legalNotices.THIRD_PARTY }}</p>
        </div>
        
        <!-- Jurisdiction Notice -->
        <div class="notice-block">
          <h4>🇵🇭 Philippine Jurisdiction</h4>
          <p>{{ legalNotices.JURISDICTION }}</p>
        </div>
        
        <!-- Scope Notice -->
        <div class="notice-block info">
          <h4>📚 Documentation Scope</h4>
          <p>{{ legalNotices.SCOPE }}</p>
        </div>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { COMPLIANCE_BADGES } from '../client/legal-notices.js';

const visibleBadges = computed(() => [
  COMPLIANCE_BADGES.NO_TRACKING,
  COMPLIANCE_BADGES.NO_PII,
  COMPLIANCE_BADGES.LOCAL_FIRST,
  COMPLIANCE_BADGES.OPEN_SOURCE,
  COMPLIANCE_BADGES.PH_COMPLIANT,
]);

const legalNotices = {
  AS_IS: 'VitePress DepthIndex is provided "AS-IS", without warranty of any kind. The creator(s) are not liable for any damages arising from use.',
  PRIVACY: 'No analytics, telemetry, tracking, or PII collection. All data stays on your device by default.',
  THIRD_PARTY: 'Cloud AI integrations connect directly to providers. DepthIndex is not affiliated with or endorsed by OpenAI, Google, or Anthropic.',
  JURISDICTION: 'Created in the Philippines. Subject to RA 10173 (Data Privacy Act), RA 10175 (Cybercrime Prevention Act), and RA 8792 (E-Commerce Act).',
  SCOPE: 'Default search scope is limited to the documentation where installed. External data access requires explicit developer configuration.',
};
</script>

<style scoped>
.compliance-section {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--vp-c-bg-soft, #f6f6f7);
  border-radius: 8px;
  border: 1px solid var(--vp-c-gutter, #e2e2e3);
  font-size: 0.85rem;
}

.badges-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.compliance-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--vp-c-bg, #ffffff);
  border: 1px solid var(--vp-c-gutter, #e2e2e3);
  border-radius: 6px;
  font-weight: 500;
  cursor: help;
  transition: all 0.2s ease;
}

.compliance-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border-color: var(--vp-c-brand, #3eaf7c);
}

.badge-icon {
  font-size: 1rem;
}

.notices-details {
  border-top: 1px dashed var(--vp-c-gutter, #e2e2e3);
  padding-top: 8px;
}

.notices-summary {
  cursor: pointer;
  font-weight: 600;
  user-select: none;
  color: var(--vp-c-text-2, #666666);
  outline: none;
}

.notices-summary:hover {
  color: var(--vp-c-text-1, #2c3e50);
}

.notices-content {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notice-block {
  padding: 8px 12px;
  background: var(--vp-c-bg, #ffffff);
  border-left: 3px solid var(--vp-c-text-3, #999999);
  border-radius: 0 4px 4px 0;
}

.notice-block h4 {
  margin: 0 0 4px 0;
  font-weight: 600;
  font-size: 0.85rem;
}

.notice-block p {
  margin: 0;
  color: var(--vp-c-text-2, #666666);
  line-height: 1.35;
}

.notice-block.warning {
  border-left-color: var(--vp-c-warning, #e7c000);
}

.notice-block.info {
  border-left-color: var(--vp-c-brand, #3eaf7c);
}
</style>
