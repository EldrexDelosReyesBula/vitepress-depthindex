<template>
  <div class="di-loading">
    <!-- Stage row -->
    <div class="di-loading-row">
      <!-- SVG icon (no emoji) -->
      <span class="di-icon" aria-hidden="true">
        <!-- thinking -->
        <svg v-if="stage === 'thinking'" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L15 21H9l-.3-5.7A7 7 0 0 1 12 2z"/>
          <line x1="9" y1="21" x2="15" y2="21"/>
        </svg>
        <!-- searching -->
        <svg v-else-if="stage === 'searching'" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="7"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <!-- analyzing -->
        <svg v-else-if="stage === 'analyzing'" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <!-- generating -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
        </svg>
      </span>

      <!-- Text with typewriter effect -->
      <span class="di-loading-text">
        <span class="di-typed">{{ displayedText }}</span><span class="di-cursor" :class="{ blink: cursorBlink }">▎</span>
      </span>
    </div>

    <!-- Inline progress bar for searching stage -->
    <div v-if="stage === 'searching'" class="di-progress-wrap">
      <div class="di-progress-bar">
        <div class="di-progress-fill" :style="{ width: Math.min(progress, 100) + '%' }"></div>
      </div>
      <span class="di-progress-label">{{ scannedPages }} pages · {{ Math.round(Math.min(progress, 100)) }}%</span>
    </div>

    <!-- Shimmer dots for other stages -->
    <div v-else class="di-dots">
      <span class="di-dot" style="animation-delay:0s"></span>
      <span class="di-dot" style="animation-delay:0.18s"></span>
      <span class="di-dot" style="animation-delay:0.36s"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';

const props = withDefaults(defineProps<{
  stage?: 'thinking' | 'searching' | 'analyzing' | 'generating';
  progress?: number;
  scannedPages?: number;
}>(), {
  stage: 'thinking',
  progress: 0,
  scannedPages: 0,
});

const STAGE_MESSAGES: Record<string, string[]> = {
  thinking: [
    'Understanding your question',
    'Processing query intent',
    'Identifying key concepts',
    'Mapping documentation topics',
    'Breaking down the problem',
  ],
  searching: ['Scanning documentation'],
  analyzing: ['Ranking results by relevance', 'Extracting key context', 'Weighting sources'],
  generating: ['Composing your answer', 'Synthesizing a response', 'Formatting output'],
};

const displayedText = ref('');
const cursorBlink = ref(true);
const messageIndex = ref(0);

let typeTimer: any = null;
let cycleTimer: any = null;
let charIndex = 0;

function getCurrentMessage(): string {
  const msgs = STAGE_MESSAGES[props.stage] || STAGE_MESSAGES.thinking;
  return msgs[messageIndex.value % msgs.length];
}

function typeMessage(msg: string) {
  clearTimeout(typeTimer);
  displayedText.value = '';
  charIndex = 0;

  function tick() {
    if (charIndex < msg.length) {
      displayedText.value += msg[charIndex++];
      typeTimer = setTimeout(tick, 14 + Math.random() * 8);
    }
  }
  tick();
}

function startCycle() {
  clearInterval(cycleTimer);
  typeMessage(getCurrentMessage());
  const msgs = STAGE_MESSAGES[props.stage] || [];
  if (msgs.length > 1) {
    cycleTimer = setInterval(() => {
      messageIndex.value = (messageIndex.value + 1) % msgs.length;
      typeMessage(getCurrentMessage());
    }, 2800);
  }
}

watch(() => props.stage, () => {
  messageIndex.value = 0;
  startCycle();
}, { immediate: false });

onMounted(startCycle);

onUnmounted(() => {
  clearTimeout(typeTimer);
  clearInterval(cycleTimer);
});
</script>

<style scoped>
.di-loading {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 4px 8px;
}

.di-loading-row {
  display: flex;
  align-items: center;
  gap: 9px;
}

.di-icon {
  flex-shrink: 0;
  color: var(--vp-c-brand, #3eaf7c);
  display: flex;
  animation: di-icon-spin 2.4s ease-in-out infinite;
}

.di-icon svg {
  display: block;
}

@keyframes di-icon-spin {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.88); }
}

.di-loading-text {
  font-size: 13px;
  color: var(--vp-c-text-2, #555);
  letter-spacing: 0.01em;
  min-height: 1.4em;
  display: flex;
  align-items: center;
}

.di-cursor {
  color: var(--vp-c-brand, #3eaf7c);
  font-weight: 100;
  margin-left: 1px;
  opacity: 1;
}

.di-cursor.blink {
  animation: cur-blink 1.1s step-end infinite;
}

@keyframes cur-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Progress bar */
.di-progress-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.di-progress-bar {
  flex: 1;
  height: 3px;
  background: var(--vp-c-divider, rgba(60,60,60,0.12));
  border-radius: 99px;
  overflow: hidden;
}

.di-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--vp-c-brand, #3eaf7c), #00bcd4);
  border-radius: 99px;
  transition: width 0.25s ease;
}

.di-progress-label {
  font-size: 11px;
  color: var(--vp-c-text-3, #999);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* Shimmer dots */
.di-dots {
  display: flex;
  align-items: center;
  gap: 5px;
  padding-left: 24px;
}

.di-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--vp-c-brand, #3eaf7c);
  animation: di-dot-bounce 1.2s ease-in-out infinite;
  opacity: 0.7;
}

@keyframes di-dot-bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40% { transform: translateY(-5px); opacity: 1; }
}
</style>
