<template>
  <div v-if="isOpen" class="depth-index-bottom-sheet-overlay" @click.self="close">
    <div class="depth-index-bottom-sheet" :class="customClass">
      <div class="sheet-handle"></div>
      <div class="sheet-header" v-if="title || $slots.header">
        <slot name="header">
          <h3>{{ title }}</h3>
        </slot>
      </div>
      <div class="sheet-body">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    isOpen?: boolean;
    title?: string;
    customClass?: string;
  }>(),
  {
    isOpen: true,
  }
);

const emit = defineEmits(['close']);
const close = () => emit('close');
</script>

<style scoped>
.depth-index-bottom-sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
}
.depth-index-bottom-sheet {
  width: 100%;
  max-height: 80vh;
  background: var(--di-bg, #ffffff);
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  padding: 16px 20px 32px 20px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease-out;
}
.sheet-handle {
  width: 36px;
  height: 4px;
  background: var(--di-muted, #cbd5e1);
  border-radius: 2px;
  margin: 0 auto 12px auto;
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
</style>
