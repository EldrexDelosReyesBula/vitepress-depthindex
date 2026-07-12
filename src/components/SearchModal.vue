<template>
  <Transition name="modal-fade">
    <div v-if="isOpen" class="depthindex-modal-overlay" @click.self="close">
      <div class="depthindex-modal" role="dialog" aria-modal="true">
        <!-- Search Input Bar -->
        <div class="search-input-wrapper">
          <span class="search-icon">🔍</span>
          <input 
            ref="inputRef"
            v-model="query"
            type="text"
            class="search-input"
            placeholder="Search documentation (type to start)..."
            aria-label="Search documentation"
            @keydown.down.prevent="navigateResults(1)"
            @keydown.up.prevent="navigateResults(-1)"
            @keydown.enter.prevent="selectActive"
            @keydown.esc="close"
          />
          <button class="close-btn" aria-label="Close search modal" @click="close">ESC</button>
        </div>

        <!-- Search Results / Suggestions -->
        <div class="search-body">
          <!-- Loading index state -->
          <div v-if="!isEngineLoaded" class="search-status">
            <span class="spinner"></span> Loading search index...
          </div>

          <!-- Empty search query history & default suggestions -->
          <div v-else-if="!query.trim()" class="search-initial">
            <div v-if="history.length > 0" class="search-history-section">
              <div class="section-title">Recent Searches</div>
              <div class="history-list">
                <div 
                  v-for="(item, idx) in history" 
                  :key="idx" 
                  class="history-item"
                  @click="useSuggestion(item.query)"
                >
                  <span class="item-icon">🕒</span>
                  <span class="item-text">{{ item.query }}</span>
                  <span v-if="item.clickedTitle" class="item-link">→ {{ item.clickedTitle }}</span>
                </div>
              </div>
            </div>

            <div class="suggestions-section">
              <SuggestedQuestions 
                :questions="suggestedQuestions"
                @select="useSuggestion"
              />
            </div>
          </div>

          <!-- Results -->
          <div v-else-if="results.length > 0" class="search-results">
            <a 
              v-for="(res, idx) in results" 
              :key="res.chunk.id"
              :href="res.chunk.url"
              class="result-item"
              :class="{ 'active': idx === activeIndex }"
              @mouseenter="activeIndex = idx"
              @click="recordClick(res)"
            >
              <div class="result-meta">
                <span class="result-category">{{ res.chunk.pageTitle }}</span>
                <span class="result-divider">›</span>
                <span class="result-heading">{{ res.chunk.heading }}</span>
                <span class="result-score">{{ Math.round(res.score * 100) }}% match</span>
              </div>
              <p class="result-snippet" v-html="highlightText(res.chunk.content)"></p>
            </a>
          </div>

          <!-- No results found -->
          <div v-else class="search-empty">
            <span class="empty-icon">🤷</span>
            <div class="empty-text">No results found for "{{ query }}"</div>
            <button class="empty-action" @click="emit('openChat', query)">
              Ask our AI Documentation Assistant
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="search-footer">
          <span class="footer-key">↑↓</span> Navigate
          <span class="footer-key">↵</span> Select
          <span class="footer-key">ESC</span> Close
          <span class="footer-brand">DepthIndex AI</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import { DepthIndexEngine } from '../client/search-engine.js';
import { PersonalizationEngine, SearchHistoryItem } from '../client/personalization.js';
import SuggestedQuestions from './SuggestedQuestions.vue';

const props = defineProps<{
  isOpen: boolean;
  engine: DepthIndexEngine;
  personalization: PersonalizationEngine;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'openChat', initialQuery?: string): void;
}>();

const query = ref('');
const results = ref<any[]>([]);
const activeIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);

const isEngineLoaded = computed(() => props.engine.isLoaded());

const history = computed<SearchHistoryItem[]>(() => 
  props.personalization ? props.personalization.getHistory() : []
);

const suggestedQuestions = computed(() => {
  const defaults = [
    'How do I get started?',
    'What features are supported?',
    'API Configuration options'
  ];
  return props.personalization 
    ? props.personalization.generateSuggestions(defaults) 
    : defaults;
});

// Watch open state to auto-focus search input
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    activeIndex.value = 0;
    query.value = '';
    results.value = [];
    nextTick(() => {
      inputRef.value?.focus();
    });
  }
});

// Watch query string and execute search
watch(query, (newVal) => {
  if (!newVal.trim()) {
    results.value = [];
    activeIndex.value = 0;
    return;
  }

  // De-bounce search or search directly
  const searchResults = props.engine.search(newVal, 8);
  results.value = searchResults;
  activeIndex.value = 0;
});

function close() {
  emit('close');
}

function useSuggestion(suggestedQuery: string) {
  query.value = suggestedQuery;
}

function navigateResults(direction: number) {
  if (results.value.length === 0) return;
  const newIndex = activeIndex.value + direction;
  if (newIndex >= 0 && newIndex < results.value.length) {
    activeIndex.value = newIndex;
    // Scroll item into view if needed
    const el = document.querySelectorAll('.result-item')[newIndex];
    el?.scrollIntoView({ block: 'nearest' });
  }
}

function selectActive() {
  if (results.value.length > 0 && activeIndex.value < results.value.length) {
    const activeResult = results.value[activeIndex.value];
    recordClick(activeResult);
    window.location.href = activeResult.chunk.url;
    close();
  }
}

function recordClick(res: any) {
  if (props.personalization) {
    props.personalization.recordQuery(query.value, results.value);
    props.personalization.recordClick(query.value, res.chunk.url, `${res.chunk.pageTitle} > ${res.chunk.heading}`);
  }
}

function highlightText(text: string): string {
  if (!query.value.trim() || !text) return text;
  
  // Extract word tokens from query
  const searchTerms = query.value
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 1);

  if (searchTerms.length === 0) return text;

  let snippet = text;
  // Get snippet around the first matching term to keep it brief
  let earliestMatch = -1;
  searchTerms.forEach(term => {
    const matchIdx = text.toLowerCase().indexOf(term);
    if (matchIdx !== -1 && (earliestMatch === -1 || matchIdx < earliestMatch)) {
      earliestMatch = matchIdx;
    }
  });

  if (earliestMatch !== -1) {
    const start = Math.max(0, earliestMatch - 60);
    const end = Math.min(text.length, earliestMatch + 140);
    snippet = (start > 0 ? '...' : '') + text.substring(start, end) + (end < text.length ? '...' : '');
  } else {
    // Return first 180 chars if no match found
    snippet = text.length > 180 ? text.substring(0, 180) + '...' : text;
  }

  // Highlight matches
  searchTerms.forEach(term => {
    // Escape regex chars
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    snippet = snippet.replace(regex, '<mark class="highlight">$1</mark>');
  });

  return snippet;
}
</script>

<style scoped>
.depthindex-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 15vh;
  background-color: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
}

.depthindex-modal {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 680px;
  max-height: 70vh;
  border-radius: 16px;
  background-color: var(--vp-c-bg, #ffffff);
  border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  animation: modalSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
}

.search-icon {
  font-size: 20px;
}

.search-input {
  flex: 1;
  font-size: 16px;
  border: none;
  background: transparent;
  color: var(--vp-c-text-1, #3c3c3c);
  outline: none;
}

.search-input::placeholder {
  color: var(--vp-c-text-3, #999);
}

.close-btn {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: var(--vp-c-bg-alt, #f6f6f7);
  border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
  color: var(--vp-c-text-2, #666);
  cursor: pointer;
}

.search-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.search-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 0;
  color: var(--vp-c-text-2, #666);
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
  border-top-color: var(--vp-c-brand, #3eaf7c);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-2, #666);
  margin-bottom: 8px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 20px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 13.5px;
}

.history-item:hover {
  background-color: var(--vp-c-bg-alt, #f6f6f7);
}

.item-icon {
  opacity: 0.6;
}

.item-text {
  color: var(--vp-c-text-1, #3c3c3c);
  font-weight: 500;
}

.item-link {
  font-size: 11.5px;
  color: var(--vp-c-text-2, #666);
  margin-left: auto;
  opacity: 0.8;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid transparent;
  text-decoration: none;
  background-color: transparent;
  transition: all 0.2s;
}

.result-item.active {
  background-color: var(--vp-c-bg-alt, #f6f6f7);
  border-color: var(--vp-c-divider, rgba(60, 60, 60, 0.12));
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
}

.result-category {
  color: var(--vp-c-brand, #3eaf7c);
}

.result-divider {
  color: var(--vp-c-text-3, #999);
}

.result-heading {
  color: var(--vp-c-text-2, #666);
}

.result-score {
  margin-left: auto;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background-color: var(--vp-c-brand-dimm, rgba(62, 175, 124, 0.08));
  color: var(--vp-c-brand, #3eaf7c);
}

.result-snippet {
  font-size: 13px;
  color: var(--vp-c-text-1, #3c3c3c);
  margin: 0;
  line-height: 1.5;
}

:deep(.highlight) {
  background-color: var(--vp-c-brand-dimm, rgba(62, 175, 124, 0.2));
  color: var(--vp-c-brand, #3eaf7c);
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 600;
}

.search-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
}

.empty-icon {
  font-size: 32px;
}

.empty-text {
  font-size: 14px;
  color: var(--vp-c-text-2, #666);
}

.empty-action {
  padding: 8px 16px;
  border-radius: 8px;
  background-color: var(--vp-c-brand, #3eaf7c);
  border: none;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.empty-action:hover {
  opacity: 0.9;
}

.search-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  border-top: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
  font-size: 11px;
  color: var(--vp-c-text-3, #999);
  background-color: var(--vp-c-bg-alt, #f6f6f7);
}

.footer-key {
  font-family: monospace;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 3px;
  background-color: var(--vp-c-bg, #ffffff);
  border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.15));
  color: var(--vp-c-text-1, #3c3c3c);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.08);
}

.footer-brand {
  margin-left: auto;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--vp-c-brand, #3eaf7c);
}

/* Animations */
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes modalSlide {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .depthindex-modal-overlay {
    padding-top: 10px !important;
    padding: 10px !important;
  }

  .depthindex-modal {
    max-height: calc(100vh - 20px) !important;
    border-radius: 12px !important;
  }

  .search-footer {
    display: none !important;
  }
}
</style>
