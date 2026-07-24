<template>
  <div class="cloud-config-overlay" @click.self="close">
    <div class="cloud-config-panel">
      <!-- Header -->
      <div class="config-header">
        <div class="header-left">
          <div class="header-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </div>
          <div>
            <h3>{{ t('settings.title') }}</h3>
            <p class="header-subtitle">{{ t('settings.subtitle') }}</p>
          </div>
        </div>
        <button @click="close" class="close-btn" :aria-label="t('panel.close')">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      
      <!-- Info Banner -->
      <div class="info-banner">
        <span class="info-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        </span>
        <span>{{ t('settings.info') }}</span>
      </div>
      
      <!-- Config Form -->
      <div class="config-form">
        <!-- Search Mode -->
        <div class="form-group">
          <label class="form-label">{{ t('settings.searchMode') }}</label>
          <div class="mode-selector">
            <button 
              v-for="mode in searchModes" 
              :key="mode.value"
              :class="['mode-option', { active: config.searchMode === mode.value }]"
              @click="config.searchMode = mode.value"
            >
              <span class="mode-icon" style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; color: var(--di-primary);">
                <svg v-if="mode.value === 'on-device'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="20" x2="22" y2="20"></line><line x1="12" y1="17" x2="12" y2="20"></line></svg>
                <svg v-else-if="mode.value === 'hybrid'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                <svg v-else-if="mode.value === 'cloud'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>
              </span>
              <div class="mode-info">
                <span class="mode-name">{{ t('settings.mode.' + mode.value + '.name') }}</span>
                <span class="mode-desc">{{ t('settings.mode.' + mode.value + '.desc') }}</span>
              </div>
            </button>
          </div>
        </div>
        
        <!-- Language Select -->
        <div class="form-group">
          <label class="form-label">{{ t('settings.language') }} / Wika</label>
          <select 
            v-model="selectedLanguage" 
            @change="changeLanguage(selectedLanguage)"
            class="language-select-dropdown"
          >
            <option 
              v-for="lang in availableLanguages" 
              :key="lang.code" 
              :value="lang.code"
            >
              {{ lang.nativeName }} ({{ lang.englishName }})
            </option>
          </select>
        </div>
        
        <!-- API Provider (only shown in hybrid/cloud mode) -->
        <Transition name="slide">
          <div v-if="config.searchMode !== 'on-device'" class="form-group">
            <label class="form-label">{{ t('settings.provider') }}</label>
            <div class="provider-select">
              <button
                v-for="provider in providers"
                :key="provider.value"
                :class="['provider-option', { active: config.provider === provider.value }]"
                @click="changeProvider(provider.value)"
              >
                <span>{{ provider.name }}</span>
              </button>
            </div>
          </div>
        </Transition>
        
        <!-- API Key Input (only shown in hybrid/cloud mode) -->
        <Transition name="slide">
          <div v-if="config.searchMode !== 'on-device'" class="form-group">
            <label class="form-label" for="api-key-input">
              {{ t('settings.apiKey') }}
              <span class="label-hint">— {{ t('settings.apiKeyHint') }}</span>
            </label>
            <div class="api-key-input-wrapper">
              <input
                id="api-key-input"
                v-model="config.apiKey"
                :type="showKey ? 'text' : 'password'"
                :placeholder="t('settings.apiKey') + ' (' + getProviderName() + ')...'"
                class="api-key-input"
                :class="{ error: !!keyError }"
                autocomplete="off"
                @input="validateKey"
              />
              <button 
                @click="showKey = !showKey" 
                class="toggle-visibility"
                :aria-label="showKey ? 'Hide key' : 'Show key'"
                style="display: inline-flex; align-items: center; justify-content: center; padding: 4px;"
              >
                <svg v-if="showKey" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
            </div>
            <p v-if="keyError" class="error-message">{{ keyError }}</p>
            <p class="key-hint">
              <a :href="getProviderKeyUrl()" target="_blank" rel="noopener noreferrer">
                {{ t('settings.apiKeyGet') }} ({{ getProviderName() }}) →
              </a>
            </p>
          </div>
        </Transition>
        
        <!-- Model Name (optional) -->
        <Transition name="slide">
          <div v-if="config.searchMode !== 'on-device'" class="form-group">
            <label class="form-label" for="model-input">
              {{ t('settings.modelName') }}
              <span class="label-hint">— {{ t('settings.modelOptional') }}</span>
            </label>
            <input
              id="model-input"
              v-model="config.modelName"
              type="text"
              :placeholder="getDefaultModel()"
              class="model-input"
            />
            <div class="model-presets">
              <span class="preset-label">{{ t('settings.presets') }}</span>
              <button
                v-for="preset in getModelPresets()"
                :key="preset"
                class="preset-btn"
                @click="config.modelName = preset"
              >
                {{ preset }}
              </button>
            </div>
          </div>
        </Transition>
        
        <!-- Test Connection -->
        <div v-if="config.searchMode !== 'on-device' && config.apiKey" class="form-group">
          <button 
            @click="testConnection" 
            :disabled="testing || !!keyError"
            class="test-btn"
          >
            <span v-if="testing" class="spinner"></span>
            <span v-else style="display: inline-flex; align-items: center; justify-content: center; margin-right: 4px; vertical-align: middle;">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v8H2z"></path><line x1="6" y1="12" x2="14" y2="12"></line></svg>
            </span>
            {{ testing ? t('settings.testing') : t('settings.testConnection') }}
          </button>
          
          <!-- Test Result -->
          <Transition name="fade">
            <div v-if="testResult" :class="['test-result', testResult.status]">
              <span class="test-icon" style="display: inline-flex; align-items: center; justify-content: center;">
                <svg v-if="testResult.status === 'success'" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color: #10b981;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="color: #ef4444;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </span>
              <span>{{ testResult.message }}</span>
            </div>
          <!-- Telemetry / Vercel Analytics Consent -->
          <div class="form-group" style="margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--di-border, rgba(0,0,0,0.08));">
            <label class="form-label" style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
              <span style="display: flex; align-items: center; gap: 6px;">
                <span>📊</span>
                <span>Vercel Analytics</span>
              </span>
              <input
                type="checkbox"
                :checked="analyticsConsent"
                @change="toggleAnalytics(($event.target as HTMLInputElement).checked)"
                style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--di-primary, #6366f1);"
              />
            </label>
            <span class="label-hint" style="display: block; margin-top: 4px; font-size: 0.75rem;">
              {{ analyticsConsent ? 'Telemetry enabled (click to opt out)' : 'Telemetry disabled (click to opt in)' }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- Footer Actions -->
      <div class="config-footer">
        <div class="footer-info">
          <span class="storage-indicator" style="display: inline-flex; align-items: center; gap: 4px;">
            <span class="storage-icon" style="display: inline-flex; align-items: center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </span>
            {{ t('settings.storageIndicator') }}
          </span>
        </div>
        <div class="footer-actions">
          <button @click="resetConfig" class="reset-btn">{{ t('settings.reset') }}</button>
          <button @click="saveConfig" class="save-btn" :disabled="!isValid">
            {{ t('settings.save') }}
          </button>
        </div>
      </div>
      
      <!-- Security & Compliance -->
      <ComplianceBadges :options="options" style="margin-top: 1rem;" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';

const props = defineProps<{
  options?: any;
}>();
import { SecurityManager } from '../client/security.js';
import { CloudAdapter } from '../client/cloud-adapter.js';
import ComplianceBadges from './ComplianceBadges.vue';
import { I18nAPI } from '../extensions/i18n/index.js';

const i18n = new I18nAPI();
const selectedLanguage = ref(i18n.getCurrentLanguage());
const availableLanguages = i18n.getAvailableLanguages();
const currentLang = ref(i18n.getCurrentLanguage());

function changeLanguage(lang: string) {
  i18n.setLanguage(lang);
  selectedLanguage.value = lang;
  currentLang.value = lang;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('depthindex:language-changed', { detail: { code: lang } }));
  }
}

const t = (key: string, params?: Record<string, string | number>) => {
  const _ = currentLang.value;
  return i18n.t(key, params);
};

const emit = defineEmits(['close', 'save', 'config-updated']);

const security = new SecurityManager();
const cloudAdapter = new CloudAdapter();

// Configuration state
const config = reactive({
  searchMode: 'on-device' as 'on-device' | 'hybrid' | 'cloud',
  provider: 'gemini' as string,
  apiKey: '',
  modelName: '',
});

const showKey = ref(false);
const testing = ref(false);
const testResult = ref<{ status: string; message: string } | null>(null);
const keyError = ref('');

const searchModes: Array<{
  value: 'on-device' | 'hybrid' | 'cloud';
  name: string;
  description: string;
}> = [
  {
    value: 'on-device',
    name: 'On-Device Only',
    description: '100% local, works offline, instant results',
  },
  {
    value: 'hybrid',
    name: 'Hybrid',
    description: 'Local search + Cloud AI reasoning for better answers',
  },
  {
    value: 'cloud',
    name: 'Cloud-Only',
    description: 'Full cloud AI answers (requires API key)',
  },
];

const providers = [
  {
    value: 'gemini',
    name: 'Google Gemini',
  },
  {
    value: 'openai',
    name: 'OpenAI',
  },
  {
    value: 'anthropic',
    name: 'Anthropic Claude',
  },
  {
    value: 'custom',
    name: 'Custom Endpoint',
  },
];

const analyticsConsent = ref(false);

function toggleAnalytics(consented: boolean) {
  analyticsConsent.value = consented;
  if (typeof window !== 'undefined') {
    localStorage.setItem('depthindex-analytics-consent', consented ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('depthindex:analytics-consent-changed', { detail: { consented } }));
  }
}

// Load saved config
onMounted(() => {
  if (typeof window !== 'undefined') {
    analyticsConsent.value = localStorage.getItem('depthindex-analytics-consent') === 'true';
    const saved = localStorage.getItem('depthindex-cloud-config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.assign(config, parsed);
      } catch (e) {
        console.warn('Failed to parse saved cloud config');
      }
    }
  }
});

const isValid = computed(() => {
  if (config.searchMode === 'on-device') return true;
  return config.apiKey.trim().length > 0 && !keyError.value;
});

function getProviderName(): string {
  return providers.find(p => p.value === config.provider)?.name || 'API';
}

function getProviderKeyUrl(): string {
  const urls: Record<string, string> = {
    gemini: 'https://aistudio.google.com/apikey',
    openai: 'https://platform.openai.com/api-keys',
    anthropic: 'https://console.anthropic.com/keys',
    custom: '#',
  };
  return urls[config.provider] || '#';
}

function getDefaultModel(): string {
  const defaults: Record<string, string> = {
    gemini: 'gemini-1.5-flash',
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-haiku-20240307',
    custom: '',
  };
  return defaults[config.provider] || '';
}

function getModelPresets(): string[] {
  const presets: Record<string, string[]> = {
    gemini: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'],
    openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-haiku-20240307', 'claude-3-5-sonnet-20241022'],
    custom: [],
  };
  return presets[config.provider] || [];
}

function validateKey(): void {
  if (!config.apiKey.trim()) {
    keyError.value = '';
    return;
  }
  
  if (!security.validateApiKey(config.apiKey, config.provider)) {
    keyError.value = t('settings.apiKeyInvalid', { provider: getProviderName() });
  } else {
    keyError.value = '';
  }
}

function changeProvider(provider: string) {
  config.provider = provider;
  config.modelName = '';
  
  // Try to restore saved key for this provider
  if (typeof window !== 'undefined') {
    config.apiKey = localStorage.getItem(`depthindex_api_key_${provider}`) || '';
  }
  
  validateKey();
  testResult.value = null;
}

async function testConnection(): Promise<void> {
  testing.value = true;
  testResult.value = null;
  
  try {
    const result = await cloudAdapter.testConnection({
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.modelName || getDefaultModel(),
    });
    
    testResult.value = {
      status: 'success',
      message: `${t('settings.testSuccess')} (Latency: ${result.latency}ms)`,
    };
  } catch (error: any) {
    testResult.value = {
      status: 'error',
      message: `${t('settings.testFailed')}: ${error.message || error}`,
    };
  } finally {
    testing.value = false;
  }
}

function saveConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('depthindex-cloud-config', JSON.stringify(config));
    localStorage.setItem(`depthindex_api_key_${config.provider}`, config.apiKey);
    localStorage.setItem('depthindex_search_mode', config.searchMode);
    localStorage.setItem('depthindex_cloud_provider', config.provider);
  }
  
  emit('save', config);
  emit('config-updated', config);
  close();
}

function resetConfig(): void {
  config.searchMode = 'on-device';
  config.provider = 'gemini';
  config.apiKey = '';
  config.modelName = '';
  keyError.value = '';
  testResult.value = null;
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem('depthindex-cloud-config');
    localStorage.removeItem('depthindex_search_mode');
    localStorage.removeItem('depthindex_cloud_provider');
  }
  emit('config-updated', { ...config });
}

function close(): void {
  emit('close');
}
</script>

<style scoped>
.cloud-config-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.cloud-config-panel {
  background: var(--vp-c-bg, #ffffff);
  border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 95%;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.25s ease;
  display: flex;
  flex-direction: column;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  border-bottom: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
}

.header-left {
  display: flex;
  gap: 10px;
  align-items: center;
}

.header-icon {
  font-size: 24px;
}

.header-left h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--vp-c-text-1, #3c3c3c);
}

.header-subtitle {
  margin: 2px 0 0;
  font-size: 11px;
  color: var(--vp-c-text-2, #666);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  color: var(--vp-c-text-2, #666);
}

.info-banner {
  margin: 12px 16px;
  padding: 8px 12px;
  background: var(--vp-c-bg-soft, #f9f9fa);
  border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
  border-radius: 8px;
  font-size: 11.5px;
  color: var(--vp-c-text-2, #666);
  line-height: 1.4;
}

.config-form {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-1, #3c3c3c);
}

.label-hint {
  font-weight: 400;
  color: var(--vp-c-text-3, #999);
  font-size: 10.5px;
}

/* Mode Selector */
.mode-selector {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
  border-radius: 8px;
  background: var(--vp-c-bg, #ffffff);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.mode-option:hover {
  border-color: var(--vp-c-brand, #3eaf7c);
  background: var(--vp-c-bg-alt, #f6f6f7);
}

.mode-option.active {
  border-color: var(--vp-c-brand, #3eaf7c);
  background: var(--vp-c-brand-dimm, rgba(62, 175, 124, 0.08));
}

.mode-icon {
  font-size: 18px;
}

.mode-info {
  display: flex;
  flex-direction: column;
}

.mode-name {
  font-weight: 600;
  font-size: 12.5px;
  color: var(--vp-c-text-1, #3c3c3c);
}

.mode-desc {
  font-size: 11px;
  color: var(--vp-c-text-3, #999);
  margin-top: 1px;
}

/* Provider Select */
.provider-select {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.provider-option {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
  border-radius: 6px;
  background: var(--vp-c-bg, #ffffff);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  font-weight: 500;
}

.provider-option:hover {
  border-color: var(--vp-c-brand, #3eaf7c);
}

.provider-option.active {
  border-color: var(--vp-c-brand, #3eaf7c);
  background: var(--vp-c-brand-dimm, rgba(62, 175, 124, 0.08));
  color: var(--vp-c-brand, #3eaf7c);
}

/* API Key Input */
.api-key-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.api-key-input {
  width: 100%;
  padding: 8px 32px 8px 10px;
  border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
  border-radius: 6px;
  font-size: 13px;
  font-family: monospace;
  background: var(--vp-c-bg-alt, #f6f6f7);
  color: var(--vp-c-text-1, #3c3c3c);
  outline: none;
}

.api-key-input:focus {
  border-color: var(--vp-c-brand, #3eaf7c);
  background: var(--vp-c-bg, #ffffff);
}

.api-key-input.error {
  border-color: #ef4444;
}

.toggle-visibility {
  position: absolute;
  right: 6px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.error-message {
  color: #ef4444;
  font-size: 11px;
  margin: 0;
}

.key-hint {
  font-size: 11px;
  margin: 0;
}

.key-hint a {
  color: var(--vp-c-brand, #3eaf7c);
  text-decoration: none;
}

.key-hint a:hover {
  text-decoration: underline;
}

/* Model Input */
.model-input {
  padding: 8px 10px;
  border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
  border-radius: 6px;
  font-size: 13px;
  background: var(--vp-c-bg-alt, #f6f6f7);
  color: var(--vp-c-text-1, #3c3c3c);
  outline: none;
}

.model-input:focus {
  border-color: var(--vp-c-brand, #3eaf7c);
  background: var(--vp-c-bg, #ffffff);
}

.model-presets {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.preset-label {
  font-size: 10.5px;
  color: var(--vp-c-text-3, #999);
}

.preset-btn {
  padding: 2px 6px;
  border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
  border-radius: 12px;
  background: var(--vp-c-bg, #ffffff);
  font-size: 10px;
  font-family: monospace;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--vp-c-text-2, #666);
}

.preset-btn:hover {
  border-color: var(--vp-c-brand, #3eaf7c);
  color: var(--vp-c-brand, #3eaf7c);
}

/* Test Button */
.test-btn {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--vp-c-brand, #3eaf7c);
  border-radius: 6px;
  background: transparent;
  color: var(--vp-c-brand, #3eaf7c);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.test-btn:hover:not(:disabled) {
  background: var(--vp-c-brand, #3eaf7c);
  color: white;
}

.test-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.test-result {
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11.5px;
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1.4;
}

.test-result.success {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #065f46;
}

.test-result.error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #991b1b;
}

/* Footer */
.config-footer {
  padding: 16px;
  border-top: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.storage-indicator {
  font-size: 10.5px;
  color: var(--vp-c-text-3, #999);
  display: flex;
  align-items: center;
  gap: 4px;
}

.footer-actions {
  display: flex;
  gap: 6px;
}

.reset-btn {
  padding: 6px 12px;
  border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
  border-radius: 6px;
  background: var(--vp-c-bg, #ffffff);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--vp-c-text-2, #666);
}

.reset-btn:hover {
  background: var(--vp-c-bg-alt, #f6f6f7);
}

.save-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  background: var(--vp-c-brand, #3eaf7c);
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:hover:not(:disabled) {
  background: #2d825c;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Security Note */
.security-note {
  padding: 0 16px 16px;
  border-top: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.04));
}

.security-note details {
  font-size: 11px;
  color: var(--vp-c-text-3, #999);
}

.security-note summary {
  cursor: pointer;
  font-weight: 600;
  padding: 4px 0;
  outline: none;
}

.security-note ul {
  margin: 6px 0 0;
  padding-left: 16px;
}

.security-note li {
  margin-bottom: 2px;
  line-height: 1.4;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 1.5px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.language-select-dropdown {
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider, #e2e2e3);
  background-color: var(--vp-c-bg-elv, #f6f6f7);
  color: var(--vp-c-text-1, #2c3e50);
  font-size: 14px;
  margin-top: 4px;
  cursor: pointer;
  outline: none;
  transition: border-color 0.15s;
}
.language-select-dropdown:focus {
  border-color: var(--vp-c-brand, #3eaf7c);
}
</style>
