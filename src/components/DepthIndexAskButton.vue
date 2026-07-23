<template>
  <button class="depth-index-ask-button" @click="$emit('click')" :class="customClass">
    <slot name="icon">
      <span class="ask-icon">✨</span>
    </slot>
    <span class="ask-text">{{ text || 'Ask AI' }}</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  text?: string;
  customClass?: string;
}>();

defineEmits(['click']);
</script>

<style scoped>
.depth-index-ask-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 6px;
  background: var(--di-primary, #6366f1);
  color: #ffffff;
  border: none;
  font-weight: 500;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.2s;
}
.depth-index-ask-button:hover { opacity: 0.9; }
</style>
