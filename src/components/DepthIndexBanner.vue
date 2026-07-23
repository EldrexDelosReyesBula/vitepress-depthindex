<template>
  <div v-if="visible" class="depth-index-banner" :class="[banner.type, banner.position || 'top', banner.customClass]">
    <div class="banner-content">
      <span v-if="banner.icon" class="banner-icon">{{ banner.icon }}</span>
      <div class="banner-text">
        <h4 v-if="banner.title" class="banner-title">{{ banner.title }}</h4>
        <p class="banner-body">{{ banner.content }}</p>
      </div>
    </div>
    <div class="banner-actions">
      <a
        v-if="banner.primaryAction"
        :href="banner.primaryAction.url || '#'"
        class="banner-btn primary"
        :class="banner.primaryAction.style"
        @click="handlePrimary"
      >
        {{ banner.primaryAction.text }}
      </a>
      <button
        v-if="banner.secondaryAction"
        class="banner-btn secondary"
        @click="handleSecondary"
      >
        {{ banner.secondaryAction.text }}
      </button>
      <button v-if="banner.dismissible !== false" class="dismiss-btn" @click="handleDismiss" aria-label="Dismiss">
        ✕
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { BannerConfig } from '../types/banner.js';

const props = defineProps<{
  banner: BannerConfig;
}>();

const emit = defineEmits(['dismiss', 'action']);
const visible = ref(true);

const handlePrimary = (e: MouseEvent) => {
  if (props.banner.primaryAction?.onClick) {
    e.preventDefault();
    props.banner.primaryAction.onClick();
  }
  emit('action', { type: 'primary', banner: props.banner });
};

const handleSecondary = () => {
  if (props.banner.secondaryAction?.onClick) {
    props.banner.secondaryAction.onClick();
  }
  emit('action', { type: 'secondary', banner: props.banner });
};

const handleDismiss = () => {
  visible.value = false;
  emit('dismiss', props.banner.id);
};
</script>

<style scoped>
.depth-index-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--di-banner-bg, #1e293b);
  color: var(--di-banner-text, #f8fafc);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin: 8px 0;
}
.banner-content {
  display: flex;
  align-items: center;
  gap: 12px;
}
.banner-title {
  margin: 0 0 2px 0;
  font-size: 15px;
  font-weight: 600;
}
.banner-body {
  margin: 0;
  font-size: 13px;
  opacity: 0.9;
}
.banner-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.banner-btn {
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  border: none;
}
.banner-btn.primary {
  background: var(--di-primary, #6366f1);
  color: #ffffff;
}
.banner-btn.secondary {
  background: transparent;
  color: inherit;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.dismiss-btn {
  background: none;
  border: none;
  color: inherit;
  font-size: 16px;
  cursor: pointer;
  opacity: 0.7;
}
.dismiss-btn:hover { opacity: 1; }
</style>
