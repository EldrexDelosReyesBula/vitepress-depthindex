<template>
  <div class="depthindex-suggestions" v-if="questions.length > 0">
    <div class="suggestions-header">Suggested Questions</div>
    <div class="suggestions-grid">
      <button 
        v-for="(q, idx) in questions" 
        :key="idx"
        class="suggestion-btn"
        @click="$emit('select', q)"
      >
        <span class="suggestion-icon">✦</span>
        <span class="suggestion-text">{{ q }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  questions: string[];
}>();

defineEmits<{
  (e: 'select', question: string): void;
}>();
</script>

<style scoped>
.depthindex-suggestions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
  animation: fadeIn 0.3s ease;
}

.suggestions-header {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-2, #666);
}

.suggestions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

@media (min-width: 640px) {
  .suggestions-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.suggestion-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft, #f9f9fa);
  border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
  font-size: 12.5px;
  color: var(--vp-c-text-1, #3c3c3c);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.suggestion-btn:hover {
  background-color: var(--vp-c-brand-dimm, rgba(62, 175, 124, 0.08));
  border-color: var(--vp-c-brand, #3eaf7c);
  color: var(--vp-c-brand, #3eaf7c);
  transform: translateX(2px);
}

.suggestion-icon {
  font-size: 12px;
  color: var(--vp-c-brand, #3eaf7c);
}

.suggestion-text {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
