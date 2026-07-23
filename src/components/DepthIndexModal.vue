<template>
  <div v-if="isOpen" class="depth-index-modal-overlay" @click.self="handleOverlayClick">
    <div class="depth-index-modal-container" :class="customClass">
      <div class="modal-header">
        <slot name="header">
          <h3 v-if="title" class="modal-title">{{ title }}</h3>
        </slot>
        <button class="close-btn" @click="close">✕</button>
      </div>
      <div class="modal-body">
        <slot></slot>
      </div>
      <div v-if="$slots.footer" class="modal-footer">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    isOpen?: boolean;
    title?: string;
    closeOnOverlay?: boolean;
    customClass?: string;
  }>(),
  {
    isOpen: true,
    closeOnOverlay: true,
  }
);

const emit = defineEmits(['close']);

const close = () => {
  emit('close');
};

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    close();
  }
};
</script>

<style scoped>
.depth-index-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}
.depth-index-modal-container {
  width: 90%;
  max-width: 540px;
  background: var(--di-bg, #ffffff);
  color: var(--di-text, #0f172a);
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--di-border, #e2e8f0);
}
.modal-title { margin: 0; font-size: 18px; font-weight: 600; }
.close-btn { background: none; border: none; font-size: 18px; cursor: pointer; }
.modal-body { padding: 20px; }
.modal-footer { padding: 12px 20px; border-top: 1px solid var(--di-border, #e2e8f0); display: flex; justify-content: flex-end; gap: 8px; }
</style>
