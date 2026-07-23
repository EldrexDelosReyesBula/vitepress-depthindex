<template>
  <div class="depth-index-search-bar" :class="customClass">
    <div class="search-input-wrapper">
      <span class="search-icon">
        <slot name="icon">🔍</slot>
      </span>
      <input
        type="text"
        :value="modelValue || value"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @keydown.enter="$emit('search', (modelValue || value))"
        :placeholder="placeholder || 'Search documentation...'"
        class="search-input"
      />
      <span v-if="shortcut" class="shortcut-hint">{{ shortcut }}</span>
    </div>
    <slot name="suffix"></slot>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: string;
  value?: string;
  placeholder?: string;
  shortcut?: string;
  customClass?: string;
}>();

defineEmits(['update:modelValue', 'search']);
</script>

<style scoped>
.depth-index-search-bar {
  position: relative;
  width: 100%;
}
.search-input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid var(--di-border, #e2e8f0);
  border-radius: 8px;
  padding: 8px 12px;
  background: var(--di-bg, #ffffff);
}
.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding: 0 8px;
  font-size: 14px;
}
.shortcut-hint {
  font-size: 12px;
  color: var(--di-muted, #94a3b8);
  border: 1px solid var(--di-border, #cbd5e1);
  border-radius: 4px;
  padding: 2px 6px;
}
</style>
