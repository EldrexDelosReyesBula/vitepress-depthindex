<template>
  <div class="depthindex-container" :class="themeClass">
    <!-- Floating launcher button -->
    <button 
      v-if="options.floatingButton?.enabled !== false && (options.placement?.mode === 'all' || options.placement?.mode === 'cta' || options.placement?.mode === 'both')"
      class="depthindex-trigger-btn"
      :class="positionClass"
      @click="toggleChat"
      aria-label="Toggle AI Documentation Assistant"
      title="Ask AI Assistant (Ctrl+K)"
    >
      <svg class="trigger-sparkle" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L14.85 9.15L22 12L14.85 14.85L12 22L9.15 14.85L2 12L9.15 9.15L12 2Z" />
      </svg>
      <span class="trigger-text">Ask AI</span>
    </button>

    <!-- Search Modal overlay -->
    <SearchModal
      v-if="options.ui.enableModal"
      :is-open="isSearchOpen"
      :engine="engine"
      :personalization="personalization"
      @close="isSearchOpen = false"
      @open-chat="openChatFromSearch"
    />

    <!-- AI Chat Panel -->
    <DepthIndexPanel
      v-if="isChatOpen"
      :is-open="isChatOpen"
      :engine="engine"
      :personalization="personalization"
      :options="options"
      :initial-query="chatQuery"
      @close="isChatOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { DepthIndexEngine } from '../client/search-engine.js';
import { PersonalizationEngine } from '../client/personalization.js';
import { fetchAndDecompressIndex } from '../client/index-loader.js';
import { registerServiceWorker } from '../client/pwa-handler.js';
import { SearchBarIntegration } from '../client/search-bar-integration.js';
import SearchModal from './SearchModal.vue';
import DepthIndexPanel from './DepthIndexPanel.vue';

const props = defineProps<{
  options: any;
}>();

const isSearchOpen = ref(false);
const isChatOpen = ref(false);
const chatQuery = ref('');

// Instantiate engines
const engine = new DepthIndexEngine();
const personalization = new PersonalizationEngine(props.options.personalization?.enabled);
let searchBarIntegration: SearchBarIntegration | null = null;

const openPanelHandler = (e: any) => {
  openChatFromSearch(e.detail?.query || '');
};

const themeClass = computed(() => `theme-${props.options.ui.theme || 'auto'}`);
const positionClass = computed(() => `pos-${props.options.ui.position || 'bottom-right'}`);
const triggerIconClass = computed(() => props.options.ui?.triggerIcon || 'fa-solid fa-comment-dots');

function toggleChat() {
  isChatOpen.value = !isChatOpen.value;
  if (isChatOpen.value) {
    isSearchOpen.value = false;
    chatQuery.value = ''; // clear query when toggling directly
  }
}

function openChatFromSearch(initialQuery: string = '') {
  isSearchOpen.value = false;
  chatQuery.value = initialQuery;
  isChatOpen.value = true;
}

// Global Key Listeners for Ctrl+K/Cmd+K or "/"
function handleKeyDown(e: KeyboardEvent) {
  // Prevent shortcut firing inside input/textarea unless it is ctrl+k
  const target = e.target as HTMLElement;
  const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

  // Toggle search modal with Ctrl+K or Cmd+K
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    isSearchOpen.value = !isSearchOpen.value;
    if (isSearchOpen.value) {
      isChatOpen.value = false;
    }
    return;
  }

  // Open search modal with "/" key when not in an input
  if (e.key === '/' && !isInput && props.options.ui.enableModal) {
    e.preventDefault();
    isSearchOpen.value = true;
    isChatOpen.value = false;
  }
}

onMounted(async () => {
  // 1. Register Service Worker for PWA offline support
  registerServiceWorker(props.options.offline?.enabled);

  // 2. Add keyboard event listeners
  window.addEventListener('keydown', handleKeyDown);

  // 3. Lazily load the documentation index
  try {
    const indexData = await fetchAndDecompressIndex();
    if (indexData && Array.isArray((indexData as any).vocabulary)) {
      engine.setIndex(indexData);
    }
  } catch (err) {
    console.info('[depthindex] Search index unavailable (normal in dev mode without a build).');
  }

  // 4. Initialize Search Bar Integration
  const mode = props.options.placement?.mode || 'all';
  if (mode === 'all' || mode === 'search-bar' || mode === 'both') {
    if (props.options.searchBar?.enabled !== false) {
      searchBarIntegration = new SearchBarIntegration(props.options.searchBar, engine);
      searchBarIntegration.init();
    }
  }

  window.addEventListener('depthindex:open-panel', openPanelHandler);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('depthindex:open-panel', openPanelHandler);
  if (searchBarIntegration) {
    searchBarIntegration.destroy();
  }
});
</script>

<style scoped>
.depthindex-container {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
}

/* Launcher Floating Button styling */
.depthindex-trigger-btn {
  position: fixed;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  height: 42px;
  border-radius: 9999px;
  background: linear-gradient(135deg, #8fa8ea 0%, #4fa682 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35), 0 2px 6px rgba(0, 0, 0, 0.12);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275),
              box-shadow 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275),
              background 0.3s ease;
  /* Entrance: slides up and fades in 0.8s after page load */
  animation: diSlideUpFade 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.8s both;
}

/* One-time pulse ring — draws attention once, then stops */
.depthindex-trigger-btn::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 9999px;
  border: 2px solid rgba(143, 168, 234, 0.6);
  opacity: 0;
  animation: diPulseRing 0.9s ease-out 1.6s 1 forwards;
  pointer-events: none;
}

.depthindex-trigger-btn:hover {
  transform: translateY(-3px) scale(1.04);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.45), 0 3px 10px rgba(0, 0, 0, 0.16);
  background: linear-gradient(135deg, #9bb2f3 0%, #57b38d 100%);
}

.depthindex-trigger-btn:active {
  transform: translateY(1px) scale(0.98);
}

.trigger-sparkle {
  width: 16px;
  height: 16px;
  animation: diFloatSpark 2.5s infinite ease-in-out;
}

.trigger-text {
  font-family: inherit;
  line-height: 1;
}

/* Position mapping */
.pos-bottom-right {
  bottom: 24px;
  right: 24px;
}

.pos-bottom-left {
  bottom: 24px;
  left: 24px;
}

@keyframes diSlideUpFade {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.92);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes diPulseRing {
  0%   { opacity: 0.8; transform: scale(1); }
  100% { opacity: 0;   transform: scale(1.55); }
}

@keyframes diFloatSpark {
  0%, 100% { transform: translateY(0) scale(1); }
  50%       { transform: translateY(-1px) scale(1.15); opacity: 0.9; }
}
</style>

<style>
/* ===== Global styles for DepthIndex search bar integration =====
   Intentionally NOT scoped — applied to dynamically-injected modal DOM. */

/* --- CSS custom properties (light mode defaults) --- */
:root {
  --di-primary: #4f46e5;
  --di-primary-light: #eef2ff;
  --di-surface: #f8fafc;
  --di-surface-alt: #f1f5f9;
  --di-border: #e2e8f0;
  --di-text: #0f172a;
  --di-text-secondary: #64748b;
  --di-text-code: #c7254e;
  --di-bg-code: rgba(0, 0, 0, 0.05);
  --di-font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  --di-radius: 12px;
}

/* Dark mode — VitePress sets html.dark on the root element */
html.dark {
  --di-primary: #818cf8;
  --di-primary-light: rgba(99, 102, 241, 0.15);
  --di-surface: #1e293b;
  --di-surface-alt: #0f172a;
  --di-border: #334155;
  --di-text: #f1f5f9;
  --di-text-secondary: #94a3b8;
  --di-text-code: #f43f5e;
  --di-bg-code: rgba(255, 255, 255, 0.08);
}

/* --- Inline AI Answer Card --- */
.di-inline-answer {
  margin: 12px;
  border: 1px solid var(--di-border);
  border-radius: var(--di-radius);
  background: var(--di-surface);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  animation: diAnswerSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  text-align: left;
}

@keyframes diAnswerSlideIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.di-inline-answer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--di-border);
  background: var(--di-surface-alt);
}

.di-inline-answer-icon {
  color: var(--di-primary);
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.di-inline-answer-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--di-text);
}

.di-inline-answer-badge {
  padding: 2px 8px;
  background: #ecfdf5;
  color: #059669;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 600;
}

html.dark .di-inline-answer-badge {
  background: rgba(5, 150, 105, 0.2);
  color: #34d399;
}

.di-inline-answer-expand {
  margin-left: auto;
  padding: 4px 10px;
  border: 1px solid var(--di-primary);
  border-radius: 6px;
  background: transparent;
  color: var(--di-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.di-inline-answer-expand:hover {
  background: var(--di-primary);
  color: white;
}

/* --- Shimmer loading state --- */
.di-inline-answer-loading {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.di-shimmer-line {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    var(--di-surface-alt) 25%,
    var(--di-border) 50%,
    var(--di-surface-alt) 75%
  );
  background-size: 200% 100%;
  animation: diShimmer 1.4s infinite linear;
  width: 100%;
}

.di-shimmer-short { width: 68%; }

@keyframes diShimmer {
  from { background-position: 200% center; }
  to   { background-position: -200% center; }
}

/* --- Answer content --- */
.di-inline-answer-content {
  padding: 14px;
  font-size: 13px;
  line-height: 1.65;
  color: var(--di-text);
  max-height: 250px;
  overflow-y: auto;
}

.di-inline-answer-content code {
  padding: 2px 5px;
  background: var(--di-bg-code);
  border-radius: 4px;
  font-size: 12px;
  font-family: var(--di-font-mono);
  color: var(--di-text-code);
}

.di-inline-answer-content pre {
  margin: 8px 0;
  padding: 10px;
  background: #1e1e2e;
  border-radius: 8px;
  overflow-x: auto;
}

html.dark .di-inline-answer-content pre { background: #0d1117; }

.di-inline-answer-content pre code {
  background: transparent;
  color: #cdd6f4;
  padding: 0;
}

/* --- Citations row --- */
.di-inline-answer-citations {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 14px 12px;
  border-top: 1px solid var(--di-border);
  background: var(--di-surface-alt);
}

.di-inline-cite {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: var(--di-surface);
  border: 1px solid var(--di-border);
  border-radius: 6px;
  font-size: 11px;
  color: var(--di-text-secondary);
  text-decoration: none;
  transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
}

.di-inline-cite:hover {
  border-color: var(--di-primary);
  color: var(--di-primary);
  background: var(--di-primary-light);
  text-decoration: none;
}

.di-inline-cite-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--di-primary);
  color: white;
  font-size: 10px;
  font-weight: 700;
  flex-shrink: 0;
}

/* --- Mandatory "Powered by DepthIndex" branding (injected into modal footer) --- */
.di-powered-by {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  padding: 7px 14px;
  border-top: 1px solid var(--di-border);
  font-size: 10.5px;
  color: var(--di-text-secondary);
  user-select: none;
}

.di-powered-by-icon {
  color: var(--di-primary);
  opacity: 0.7;
  flex-shrink: 0;
}

.di-powered-by-link {
  color: var(--di-primary);
  text-decoration: none;
  font-weight: 600;
  transition: opacity 150ms ease;
}

.di-powered-by-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}
</style>

