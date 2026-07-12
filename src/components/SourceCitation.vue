<template>
  <div class="depthindex-citations">
    <span class="citations-label">Sources:</span>
    <div class="citations-list">
      <a 
        v-for="(source, index) in sources" 
        :key="index"
        :href="source.url"
        class="citation-pill"
        :class="{ 'high-conf': source.confidence > 0.7, 'med-conf': source.confidence <= 0.7 && source.confidence > 0.4 }"
        :title="`${source.title} (${Math.round(source.confidence * 100)}% match)`"
      >
        <span class="citation-index">{{ index + 1 }}</span>
        <span class="citation-title">{{ source.title }}</span>
        <span class="citation-score">{{ Math.round(source.confidence * 100) }}%</span>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  sources: {
    url: string;
    title: string;
    confidence: number;
  }[];
}>();
</script>

<style scoped>
.depthindex-citations {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
}

.citations-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-2, #666);
}

.citations-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.citation-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  background-color: var(--vp-c-bg-alt, #f6f6f7);
  border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-1, #3c3c3c);
  text-decoration: none;
  transition: all 0.2s ease;
  max-width: 240px;
  overflow: hidden;
}

.citation-pill:hover {
  border-color: var(--vp-c-brand, #3eaf7c);
  background-color: var(--vp-c-brand-dimm, rgba(62, 175, 124, 0.1));
  color: var(--vp-c-brand, #3eaf7c);
  transform: translateY(-1px);
}

.citation-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: var(--vp-c-divider, rgba(60, 60, 60, 0.15));
  font-size: 10px;
  font-weight: 700;
  color: var(--vp-c-text-2, #3c3c3c);
}

.citation-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.citation-score {
  font-size: 10px;
  opacity: 0.75;
  padding-left: 4px;
  border-left: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.15));
}

/* Confidence indicator colors */
.citation-pill.high-conf {
  border-left: 3px solid #10b981;
}

.citation-pill.med-conf {
  border-left: 3px solid #f59e0b;
}

.citation-pill:not(.high-conf):not(.med-conf) {
  border-left: 3px solid #6b7280;
}
</style>
