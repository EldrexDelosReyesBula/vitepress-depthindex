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
      <span class="trigger-icon">✦</span>
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
    <ChatPanel
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
import ChatPanel from './ChatPanel.vue';

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
  gap: 8px;
  padding: 10px 16px;
  border-radius: 9999px;
  background: linear-gradient(135deg, var(--vp-c-brand, #3eaf7c), #2d825c);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 14px rgba(62, 175, 124, 0.4), 0 2px 6px rgba(0, 0, 0, 0.1);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.depthindex-trigger-btn:hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 6px 20px rgba(62, 175, 124, 0.5), 0 3px 8px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #4ac38e, var(--vp-c-brand, #3eaf7c));
}

.depthindex-trigger-btn:active {
  transform: translateY(1px) scale(0.98);
}

.trigger-icon {
  font-size: 15px;
  animation: float-spark 2.5s infinite ease-in-out;
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

@keyframes float-spark {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-1px) scale(1.15); opacity: 0.9; }
}
</style>
