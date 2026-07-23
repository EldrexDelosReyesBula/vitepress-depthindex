<template>
  <div class="depth-index-citation">
    <a :href="url" class="citation-link" target="_blank" rel="noopener">
      <span class="citation-icon">📄</span>
      <span class="citation-title">{{ title }}</span>
      <span v-if="score" class="citation-score">{{ Math.round(score * 100) }}% match</span>
    </a>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  url: string;
  score?: number;
}>();
</script>

<style scoped>
.depth-index-citation { display: inline-block; margin: 4px; }
.citation-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--di-citation-bg, #e2e8f0);
  color: var(--di-citation-text, #1e293b);
  border-radius: 6px;
  text-decoration: none;
  font-size: 13px;
  transition: background 0.2s;
}
.citation-link:hover { background: var(--di-citation-hover, #cbd5e1); }
.citation-score { font-size: 11px; color: var(--di-muted, #64748b); margin-left: 4px; }
</style>
