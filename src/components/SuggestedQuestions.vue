<template>
  <div class="di-suggestions" v-if="questions.length > 0">
    <div class="di-suggestions-label">
      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      Suggested Questions
    </div>
    <div class="di-suggestions-grid">
      <button
        v-for="(q, idx) in questions"
        :key="idx"
        class="di-suggestion"
        @click="$emit('select', q)"
      >
        <svg class="di-suggestion-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        <span>{{ q }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ questions: string[] }>();
defineEmits<{ (e: 'select', question: string): void }>();
</script>

<style scoped>
.di-suggestions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: di-fadein 0.25s ease;
}

@keyframes di-fadein {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.di-suggestions-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--vp-c-text-3, #999);
}

.di-suggestions-grid {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.di-suggestion {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 11px;
  border-radius: 8px;
  background: var(--vp-c-bg-soft, #f6f6f7);
  border: 1px solid var(--vp-c-divider, rgba(60,60,60,0.1));
  font-size: 12.5px;
  color: var(--vp-c-text-1, #3c3c3c);
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
              background 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
              border-color 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
              color 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  line-height: 1.4;
}

.di-suggestion:hover {
  background: var(--vp-c-brand-dimm, rgba(62,175,124,0.07));
  border-color: var(--vp-c-brand, #3eaf7c);
  color: var(--vp-c-brand, #3eaf7c);
  transform: translateY(-1px) scale(1.015);
}

.di-suggestion:active {
  transform: translateY(0) scale(0.985);
}

.di-suggestion-icon {
  flex-shrink: 0;
  color: var(--vp-c-brand, #3eaf7c);
  transition: transform 0.15s;
}

.di-suggestion:hover .di-suggestion-icon {
  transform: translateX(2px);
}
</style>
