<template>
  <div class="depthindex-container" :class="themeClass">
    <!-- Floating launcher button -->
    <button 
      v-if="options.ui.showFloatingButton"
      class="depthindex-trigger-btn"
      :class="positionClass"
      @click="toggleChat"
      aria-label="Toggle AI Documentation Assistant"
      title="Ask AI Assistant (Ctrl+K)"
    >
      <i :class="triggerIconClass" class="trigger-icon"></i>
      <span class="trigger-pulse"></span>
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
    engine.setIndex(indexData);
  } catch (err) {
    console.error('[depthindex] Failed to load search index:', err);
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
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
  justify-content: center;
  gap: 0;
  width: 52px;
  height: 52px;
  border-radius: 9999px;
  background: linear-gradient(135deg, var(--vp-c-brand, #3eaf7c), #2d825c);
  border: 2px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 18px rgba(62, 175, 124, 0.45), 0 2px 6px rgba(0, 0, 0, 0.12);
  color: #ffffff;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: fixed;
}

.depthindex-trigger-btn:hover {
  transform: translateY(-3px) scale(1.06);
  box-shadow: 0 8px 24px rgba(62, 175, 124, 0.55), 0 3px 10px rgba(0, 0, 0, 0.16);
  background: linear-gradient(135deg, #4ac38e, var(--vp-c-brand, #3eaf7c));
}

.depthindex-trigger-btn:active {
  transform: translateY(1px) scale(0.97);
}

.trigger-icon {
  font-size: 18px;
  line-height: 1;
}

.trigger-pulse {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #4ade80;
  border: 2px solid #fff;
  border-radius: 50%;
  top: 6px;
  right: 6px;
  animation: di-pulse 2s infinite;
}

@keyframes di-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.2); }
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
</style>
