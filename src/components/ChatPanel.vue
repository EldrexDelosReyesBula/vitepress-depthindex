<template>
  <Transition name="panel-slide">
    <div 
      v-if="isOpen" 
      class="depthindex-chat-panel" 
      :class="{ 'fullscreen': isFullscreen }"
    >
      <!-- Header -->
      <div class="panel-header">
        <div class="header-title">
          <span class="header-icon">✦</span>
          <div>
            <h3>Documentation Assistant</h3>
            <span class="header-subtitle">Offline-First AI Search</span>
          </div>
        </div>
        <div class="header-actions">
          <button 
            class="action-btn" 
            title="Configure Cloud Provider / API Keys"
            aria-label="Configure Cloud Provider and API Keys"
            @click="showSettings = !showSettings"
          >
            ⚙️
          </button>
          <button 
            v-if="options.ui.enableFullscreen"
            class="action-btn" 
            aria-label="Toggle Fullscreen"
            @click="isFullscreen = !isFullscreen"
          >
            {{ isFullscreen ? '🗗' : '🗖' }}
          </button>
          <button 
            class="action-btn close-btn" 
            aria-label="Close Chat Panel"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Settings Panel Overlaid -->
      <div v-if="showSettings" class="settings-overlay">
        <div class="settings-header">
          <h4>Configure Cloud LLM (Optional)</h4>
          <button @click="showSettings = false">✕</button>
        </div>
        <div class="settings-body">
          <p class="settings-desc">
            Enable hybrid cloud mode to answer questions using GPT-4, Gemini, or Claude using your own API key. Keys are saved in your local browser storage.
          </p>
          <div class="form-group">
            <label>Search Mode</label>
            <select v-model="localSearchMode" class="form-input">
              <option value="on-device">On-Device Only (No API Keys)</option>
              <option value="hybrid">Hybrid (Local search + Cloud reasoning)</option>
            </select>
          </div>
          
          <div v-if="localSearchMode === 'hybrid'" class="cloud-settings-section">
            <div class="form-group">
              <label>API Provider</label>
              <select v-model="cloudProvider" class="form-input">
                <option value="gemini">Google Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic Claude</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>API Key</label>
              <input 
                v-model="apiKey"
                type="password"
                class="form-input"
                placeholder="Enter your API key..."
              />
            </div>

            <div class="form-group">
              <label>Model Name (Optional)</label>
              <input 
                v-model="modelName"
                type="text"
                class="form-input"
                :placeholder="defaultModelPlaceholder"
              />
            </div>
          </div>
        </div>
        <div class="settings-footer">
          <button class="save-settings-btn" @click="saveSettings">Save Settings</button>
        </div>
      </div>

      <!-- Message Container -->
      <div class="messages-container" ref="messagesContainerRef">
        <div v-if="messages.length === 0" class="chat-intro">
          <div class="intro-logo">✦</div>
          <h2>Ask the Docs</h2>
          <p>
            Search and query information directly. Type a question or choose a suggestion below to begin.
          </p>
        </div>

        <div 
          v-for="msg in messages" 
          :key="msg.id"
          class="message-wrapper"
          :class="msg.role"
        >
          <div class="message-bubble">
            <div class="message-sender-name">
              {{ msg.role === 'user' ? 'You' : 'Assistant' }}
              <span v-if="msg.offlineFallback" class="offline-pill">Offline Fallback</span>
            </div>
            
            <div class="message-content" v-html="formatMarkdown(msg.content)"></div>

            <SourceCitation 
              v-if="msg.sources && msg.sources.length > 0" 
              :sources="msg.sources" 
            />
          </div>
        </div>

        <!-- Loading / Typing indicator -->
        <div v-if="loading" class="message-wrapper assistant">
          <div class="message-bubble loading-bubble">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>

      <!-- Suggestion Box -->
      <div class="suggestions-container" v-if="!loading && suggestions.length > 0">
        <SuggestedQuestions 
          :questions="suggestions"
          @select="submitQuestion"
        />
      </div>

      <!-- Input Footer -->
      <div class="panel-input-area">
        <textarea
          ref="textareaRef"
          v-model="query"
          rows="1"
          class="chat-textarea"
          placeholder="Ask anything about the documentation... (Ctrl+Enter to send)"
          aria-label="Ask anything about the documentation"
          @keydown.enter.exact.prevent="submitQuery"
        ></textarea>
        <button 
          class="send-btn"
          :disabled="!query.trim() || loading"
          @click="submitQuery"
        >
          Send
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted } from 'vue';
import { DepthIndexEngine } from '../client/search-engine.js';
import { PersonalizationEngine } from '../client/personalization.js';
import { queryCloudAPI } from '../client/cloud-adapter.js';
import SourceCitation from './SourceCitation.vue';
import SuggestedQuestions from './SuggestedQuestions.vue';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { url: string; title: string; confidence: number }[];
  offlineFallback?: boolean;
}

const props = defineProps<{
  isOpen: boolean;
  engine: DepthIndexEngine;
  personalization: PersonalizationEngine;
  options: any;
  initialQuery?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const messages = ref<Message[]>([]);
const query = ref('');
const loading = ref(false);
const isFullscreen = ref(false);
const showSettings = ref(false);
const messagesContainerRef = ref<HTMLDivElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

// Settings state
const localSearchMode = ref('on-device');
const cloudProvider = ref<'openai' | 'gemini' | 'anthropic'>('gemini');
const apiKey = ref('');
const modelName = ref('');

const defaultModelPlaceholder = computed(() => {
  if (cloudProvider.value === 'gemini') return 'gemini-1.5-flash';
  if (cloudProvider.value === 'openai') return 'gpt-4o-mini';
  return 'claude-3-5-sonnet-20241022';
});

// Load settings from local storage
onMounted(() => {
  if (typeof window !== 'undefined') {
    localSearchMode.value = window.localStorage.getItem('depthindex_search_mode') || props.options.searchMode || 'on-device';
    cloudProvider.value = (window.localStorage.getItem('depthindex_cloud_provider') as any) || props.options.cloudAPI?.provider || 'gemini';
    apiKey.value = window.localStorage.getItem(`depthindex_api_key_${cloudProvider.value}`) || '';
    modelName.value = window.localStorage.getItem(`depthindex_model_${cloudProvider.value}`) || '';
  }
});

// Watch open state to scroll or focus
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.initialQuery) {
      query.value = props.initialQuery;
    }
    nextTick(() => {
      textareaRef.value?.focus();
      scrollToBottom();
    });
  }
});

// Watch for initialQuery updates directly
watch(() => props.initialQuery, (newVal) => {
  if (newVal) {
    query.value = newVal;
    submitQuery();
  }
});

// Watch cloud provider changes in settings
watch(cloudProvider, (newVal) => {
  if (typeof window !== 'undefined') {
    apiKey.value = window.localStorage.getItem(`depthindex_api_key_${newVal}`) || '';
    modelName.value = window.localStorage.getItem(`depthindex_model_${newVal}`) || '';
  }
});

const suggestions = computed(() => {
  if (messages.value.length > 0) return [];
  const defaults = [
    'How do I get started?',
    'What features are supported?',
    'How to customize the styling?'
  ];
  return props.personalization 
    ? props.personalization.generateSuggestions(defaults)
    : defaults;
});

function saveSettings() {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('depthindex_search_mode', localSearchMode.value);
    window.localStorage.setItem('depthindex_cloud_provider', cloudProvider.value);
    if (apiKey.value.trim()) {
      window.localStorage.setItem(`depthindex_api_key_${cloudProvider.value}`, apiKey.value);
    }
    if (modelName.value.trim()) {
      window.localStorage.setItem(`depthindex_model_${cloudProvider.value}`, modelName.value);
    }
  }
  showSettings.value = false;
}

function submitQuestion(q: string) {
  query.value = q;
  submitQuery();
}

async function submitQuery() {
  const currentQuery = query.value.trim();
  if (!currentQuery || loading.value) return;

  query.value = '';
  loading.value = true;

  // 1. Add user message
  messages.value.push({
    id: String(Date.now()),
    role: 'user',
    content: currentQuery
  });

  await nextTick();
  scrollToBottom();

  try {
    // 2. Perform search retrieval
    const searchResults = props.engine.search(currentQuery, 5);
    const sources = searchResults.map(res => ({
      url: res.chunk.url,
      title: `${res.chunk.pageTitle} > ${res.chunk.heading}`,
      confidence: res.score
    }));

    let answer = '';
    let isFallback = false;

    // 3. Answer logic
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    if (localSearchMode.value === 'hybrid' && isOnline) {
      try {
        const cloudConfig = {
          provider: cloudProvider.value,
          apiKey: apiKey.value,
          model: modelName.value || undefined
        };
        answer = await queryCloudAPI(currentQuery, searchResults, cloudConfig);
      } catch (err) {
        console.warn('[depthindex] Cloud API failed, falling back to local indexing:', err);
        answer = generateLocalResponse(searchResults);
        isFallback = true;
      }
    } else {
      // Local mode
      answer = generateLocalResponse(searchResults);
      if (localSearchMode.value === 'hybrid' && !isOnline) {
        isFallback = true;
      }
    }

    // 4. Add assistant message
    messages.value.push({
      id: String(Date.now() + 1),
      role: 'assistant',
      content: answer,
      sources: sources,
      offlineFallback: isFallback
    });

    // 5. Update personalization
    if (props.personalization) {
      props.personalization.recordQuery(currentQuery, searchResults);
    }
  } catch (err: any) {
    messages.value.push({
      id: String(Date.now() + 1),
      role: 'assistant',
      content: `❌ **Error handling query:** ${err.message || err}`
    });
  } finally {
    loading.value = false;
    await nextTick();
    scrollToBottom();
  }
}

function generateLocalResponse(results: any[]): string {
  if (results.length === 0) {
    return "I couldn't find any relevant sections in the documentation for your query. Try rephrasing or searching for key terms.";
  }
  
  let response = `Here are the most relevant matches I found in the documentation:\n\n`;
  results.slice(0, 3).forEach((res, i) => {
    response += `### ${i + 1}. [${res.chunk.pageTitle} > ${res.chunk.heading}](${res.chunk.url})\n`;
    response += `${res.chunk.content}\n\n`;
    if (res.chunk.codeBlocks && res.chunk.codeBlocks.length > 0) {
      response += `**Code Example:**\n`;
      res.chunk.codeBlocks.forEach((cb: any) => {
        response += `\`\`\`${cb.language}\n${cb.code}\n\`\`\`\n`;
      });
      response += `\n`;
    }
  });
  return response;
}

async function scrollToBottom() {
  if (messagesContainerRef.value) {
    messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight;
  }
}

function formatMarkdown(text: string): string {
  if (!text) return '';

  let html = text;
  
  // Code block format: ```lang ... ```
  html = html.replace(/```(\w*)\r?\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="code-block language-${lang}"><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code format: `code`
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Heading format: ### Title
  html = html.replace(/^### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2>$1</h2>');

  // Bold format: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Link format: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="markdown-link">$1</a>');

  // Newlines to breaks (for sections not structured as html blocks)
  html = html.replace(/\n/g, '<br>');

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
</script>

<style scoped>
.depthindex-chat-panel {
  position: fixed;
  bottom: 80px;
  right: 24px;
  width: 420px;
  height: 600px;
  max-height: calc(100vh - 120px);
  border-radius: 16px;
  background-color: var(--vp-c-bg, #ffffff);
  border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
  box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 199;
  animation: panelSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  transition: all 0.3s ease;
}

.depthindex-chat-panel.fullscreen {
  bottom: 20px;
  right: 20px;
  width: calc(100vw - 40px);
  height: calc(100vh - 40px);
  max-height: none;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background-color: var(--vp-c-bg-alt, #f6f6f7);
  border-bottom: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 20px;
  color: var(--vp-c-brand, #3eaf7c);
}

.header-title h3 {
  font-size: 15px;
  font-weight: 700;
  margin: 0;
}

.header-subtitle {
  font-size: 10.5px;
  color: var(--vp-c-text-2, #666);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn {
  background: none;
  border: none;
  font-size: 14px;
  color: var(--vp-c-text-2, #666);
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background-color: var(--vp-c-divider, rgba(60, 60, 60, 0.08));
}

.close-btn {
  font-size: 12px;
}

/* Settings Overlay */
.settings-overlay {
  position: absolute;
  inset: 0;
  background-color: var(--vp-c-bg, #ffffff);
  z-index: 10;
  display: flex;
  flex-direction: column;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
}

.settings-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}

.settings-header button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--vp-c-text-2, #666);
}

.settings-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-desc {
  font-size: 12px;
  color: var(--vp-c-text-2, #666);
  line-height: 1.5;
  margin: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--vp-c-text-2, #666);
}

.form-input {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
  background-color: var(--vp-c-bg-alt, #f6f6f7);
  color: var(--vp-c-text-1, #3c3c3c);
  font-size: 13px;
  outline: none;
}

.form-input:focus {
  border-color: var(--vp-c-brand, #3eaf7c);
}

.cloud-settings-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.08));
}

.settings-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
  display: flex;
  justify-content: flex-end;
}

.save-settings-btn {
  padding: 8px 16px;
  border-radius: 8px;
  background-color: var(--vp-c-brand, #3eaf7c);
  border: none;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

/* Chat Messages */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 40px 20px;
  color: var(--vp-c-text-2, #666);
}

.intro-logo {
  font-size: 40px;
  margin-bottom: 12px;
  color: var(--vp-c-brand, #3eaf7c);
  animation: pulse 2s infinite;
}

.chat-intro h2 {
  font-size: 18px;
  font-weight: 700;
  color: var(--vp-c-text-1, #3c3c3c);
  margin-bottom: 8px;
}

.chat-intro p {
  font-size: 13px;
  line-height: 1.5;
  max-width: 280px;
}

.message-wrapper {
  display: flex;
  width: 100%;
}

.message-wrapper.user {
  justify-content: flex-end;
}

.message-wrapper.assistant {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 13.5px;
  line-height: 1.5;
}

.message-wrapper.user .message-bubble {
  background-color: var(--vp-c-brand, #3eaf7c);
  color: #ffffff;
  border-bottom-right-radius: 2px;
}

.message-wrapper.assistant .message-bubble {
  background-color: var(--vp-c-bg-alt, #f6f6f7);
  color: var(--vp-c-text-1, #3c3c3c);
  border-bottom-left-radius: 2px;
  border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.08));
}

.message-sender-name {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 4px;
  opacity: 0.8;
  display: flex;
  align-items: center;
  gap: 6px;
}

.offline-pill {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
  background-color: var(--vp-c-divider, rgba(60, 60, 60, 0.15));
  color: var(--vp-c-text-2, #666);
}

.message-content {
  word-break: break-word;
}

.message-content :deep(pre.code-block) {
  margin: 10px 0;
  padding: 10px;
  border-radius: 6px;
  background-color: #1e1e1e !important;
  color: #d4d4d4 !important;
  font-family: monospace;
  font-size: 12px;
  overflow-x: auto;
}

.message-content :deep(code.inline-code) {
  font-family: monospace;
  font-size: 12px;
  padding: 2px 4px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.06);
  color: var(--vp-c-brand, #3eaf7c);
}

.message-wrapper.user .message-content :deep(code.inline-code) {
  background-color: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.message-content :deep(.markdown-link) {
  color: var(--vp-c-brand, #3eaf7c);
  text-decoration: underline;
}

.message-wrapper.user .message-content :deep(.markdown-link) {
  color: #fff;
}

/* Typing Loading */
.loading-bubble {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 12px 20px;
}

.dot {
  width: 6px;
  height: 6px;
  background-color: var(--vp-c-text-3, #999);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1.0); }
}

/* Suggestions Area */
.suggestions-container {
  padding: 0 20px 10px 20px;
  background-color: transparent;
}

/* Input Area */
.panel-input-area {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
  background-color: var(--vp-c-bg, #ffffff);
}

.chat-textarea {
  flex: 1;
  font-size: 13.5px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider, rgba(60, 60, 60, 0.12));
  background-color: var(--vp-c-bg-alt, #f6f6f7);
  color: var(--vp-c-text-1, #3c3c3c);
  resize: none;
  max-height: 100px;
  outline: none;
  font-family: inherit;
}

.chat-textarea:focus {
  border-color: var(--vp-c-brand, #3eaf7c);
  background-color: var(--vp-c-bg, #ffffff);
}

.send-btn {
  padding: 8px 16px;
  border-radius: 8px;
  background-color: var(--vp-c-brand, #3eaf7c);
  border: none;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  height: 36px;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Panel Animations */
@keyframes panelSlide {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.panel-slide-enter-active,
.panel-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.panel-slide-enter-from,
.panel-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.97);
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@media (max-width: 480px) {
  .depthindex-chat-panel {
    bottom: 0 !important;
    right: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    max-height: 100vh !important;
    border-radius: 0 !important;
    border: none !important;
  }

  .depthindex-chat-panel.fullscreen {
    bottom: 0 !important;
    right: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    max-height: 100vh !important;
    border-radius: 0 !important;
    border: none !important;
  }

  .message-bubble {
    max-width: 92% !important;
  }

  .panel-header {
    border-radius: 0 !important;
  }
}
</style>
