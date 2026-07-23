<template>
  <div class="depth-index-settings-panel">
    <h3>DepthIndex Settings</h3>
    <div class="setting-group">
      <label>Search Mode</label>
      <select v-model="mode" @change="$emit('update:searchMode', mode)">
        <option value="on-device">On-Device (Local)</option>
        <option value="hybrid">Hybrid</option>
        <option value="cloud">Cloud AI</option>
      </select>
    </div>
    <div class="setting-group">
      <label>GPU Acceleration</label>
      <input type="checkbox" v-model="gpuEnabled" @change="$emit('update:gpuEnabled', gpuEnabled)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  searchMode?: string;
  gpuEnabled?: boolean;
}>();

defineEmits(['update:searchMode', 'update:gpuEnabled']);

const mode = ref(props.searchMode || 'on-device');
const gpuEnabled = ref(props.gpuEnabled ?? true);
</script>

<style scoped>
.depth-index-settings-panel { padding: 16px; background: var(--di-bg, #ffffff); border-radius: 8px; }
.setting-group { margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
</style>
