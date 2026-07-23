<template>
  <div class="depth-index-code-block">
    <div class="code-header">
      <span class="code-lang">{{ language || 'code' }}</span>
      <button class="copy-btn" @click="copyCode">{{ copied ? 'Copied!' : 'Copy' }}</button>
    </div>
    <pre><code :class="`language-${language}`">{{ code }}</code></pre>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  code: string;
  language?: string;
}>();

const copied = ref(false);

const copyCode = async () => {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(props.code);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  }
};
</script>

<style scoped>
.depth-index-code-block {
  background: var(--di-code-bg, #0f172a);
  color: var(--di-code-text, #f8fafc);
  border-radius: 8px;
  overflow: hidden;
  margin: 12px 0;
  font-family: monospace;
}
.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  font-size: 12px;
}
pre { margin: 0; padding: 12px; overflow-x: auto; font-size: 13px; }
.copy-btn { background: none; border: 1px solid rgba(255,255,255,0.2); color: inherit; border-radius: 4px; padding: 2px 8px; cursor: pointer; }
</style>
