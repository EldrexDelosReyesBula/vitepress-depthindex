<template>
  <div v-if="noticeMode !== 'hidden'" class="compliance-section">
    <!-- Link Mode -->
    <div v-if="noticeMode === 'link'" class="notice-link-wrapper">
      <a :href="noticeLink" target="_blank" rel="noopener noreferrer" class="notice-external-link">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="link-icon">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
        Legal Notices & Disclaimers
      </a>
    </div>

    <!-- Detailed Expandable Notices Mode -->
    <details v-else class="notices-details" open>
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

const props = defineProps<{
  options?: any;
}>();

const noticeMode = computed(() => {
  const opt = props.options?.ui?.legalNotice;
  if (opt === false || opt === 'hidden') return 'hidden';
  if (typeof opt === 'string' && (opt.startsWith('http://') || opt.startsWith('https://'))) {
    return 'link';
  }
  return 'details';
});

const noticeLink = computed(() => {
  return typeof props.options?.ui?.legalNotice === 'string' ? props.options.ui.legalNotice : '#';
});

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

.notice-link-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 0;
}

.notice-external-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--vp-c-brand, #3eaf7c);
  text-decoration: none;
  font-weight: 600;
  transition: opacity 0.15s ease;
}

.notice-external-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.link-icon {
  flex-shrink: 0;
}

.notices-details {
  border-top: none;
  padding-top: 0;
}

.notices-summary {
  cursor: pointer;
  font-weight: 600;
  user-select: none;
  color: var(--vp-c-text-2, #666666);
  outline: none;
  margin-bottom: 8px;
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
