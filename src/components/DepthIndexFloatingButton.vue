<template>
  <button
    class="depth-index-floating-button"
    :class="[positionClass, { pulse: pulse }]"
    @click="$emit('click')"
    :aria-label="label || 'Ask AI'"
  >
    <slot name="icon">
      <span class="btn-icon">💬</span>
    </slot>
    <span v-if="label" class="btn-label">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    pulse?: boolean;
    label?: string;
  }>(),
  {
    position: 'bottom-right',
    pulse: true,
  }
);

defineEmits(['click']);

const positionClass = computed(() => `pos-${props.position}`);
</script>

<style scoped>
.depth-index-floating-button {
  position: fixed;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 9999px;
  background: var(--di-primary, #6366f1);
  color: #ffffff;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.depth-index-floating-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35);
}
.pos-bottom-right { bottom: 24px; right: 24px; }
.pos-bottom-left { bottom: 24px; left: 24px; }
.pos-top-right { top: 24px; right: 24px; }
.pos-top-left { top: 24px; left: 24px; }
</style>
