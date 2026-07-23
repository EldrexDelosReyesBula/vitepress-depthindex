<template>
  <div class="depth-index-chat-message" :class="message.sender">
    <div class="message-avatar">
      <slot name="avatar">
        <span>{{ message.sender === 'user' ? '👤' : '🤖' }}</span>
      </slot>
    </div>
    <div class="message-bubble">
      <div class="message-content">{{ message.content }}</div>
      <div v-if="message.results && message.results.length > 0" class="message-citations">
        <span class="citations-header">Sources:</span>
        <div v-for="res in message.results" :key="res.chunk.id" class="citation-item">
          <a :href="res.chunk.url" target="_blank">{{ res.chunk.pageTitle || res.chunk.heading }}</a>
        </div>
      </div>
      <div v-if="message.sender === 'assistant'" class="message-actions">
        <button class="feedback-btn" @click="$emit('feedback', message.id, 'positive')">👍</button>
        <button class="feedback-btn" @click="$emit('feedback', message.id, 'negative')">👎</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChatMessage } from '../client/headless.js';

defineProps<{
  message: ChatMessage;
}>();

defineEmits(['feedback']);
</script>

<style scoped>
.depth-index-chat-message {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.depth-index-chat-message.user { flex-direction: row-reverse; }
.message-bubble {
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--di-bubble-bg, #f1f5f9);
  color: var(--di-bubble-text, #0f172a);
}
.depth-index-chat-message.user .message-bubble {
  background: var(--di-primary, #6366f1);
  color: #ffffff;
}
.message-citations { margin-top: 8px; font-size: 12px; opacity: 0.9; }
.message-actions { display: flex; gap: 4px; margin-top: 6px; }
.feedback-btn { background: none; border: none; cursor: pointer; font-size: 14px; opacity: 0.6; }
.feedback-btn:hover { opacity: 1; }
</style>
