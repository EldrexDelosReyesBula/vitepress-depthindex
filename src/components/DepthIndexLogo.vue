<template>
  <div class="depth-index-logo">
    <img v-if="src" :src="src" :alt="alt || 'Logo'" class="logo-img" />
    <svg v-else class="logo-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
    </svg>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  src?: string;
  alt?: string;
}>();
</script>

<style scoped>
.depth-index-logo { display: inline-flex; align-items: center; justify-content: center; }
.logo-img { height: 28px; width: auto; }
.logo-svg { width: 28px; height: 28px; color: var(--di-primary, #6366f1); }
</style>
