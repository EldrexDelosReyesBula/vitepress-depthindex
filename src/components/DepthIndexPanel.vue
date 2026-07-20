<template>
  <Transition name="panel-slide">
    <div
      v-if="isOpen"
      class="depthindex-panel"
      :class="[panelPosition, panelSize]"
    >
      <!-- Header -->
      <div class="panel-header">
        <slot name="header">
          <div class="header-left">
            <slot name="logo">
              <img v-if="logoSrc && (logoPosition === 'header' || logoPosition === 'both')" :src="logoSrc" :alt="logoAlt" :class="['logo-icon', logoSize]" />
              <svg v-else class="logo-icon sparkle-icon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true" style="color: var(--vp-c-brand, #3eaf7c); flex-shrink: 0;">
                <path d="M12 2L14.85 9.15L22 12L14.85 14.85L12 22L9.15 14.85L2 12L9.15 9.15L12 2Z" />
              </svg>
            </slot>
            <slot name="title">
              <div class="header-info">
                <span class="header-title">{{ panelTitle }}</span>
                <span class="badge" :class="searchMode">{{ searchModeLabel }}</span>
              </div>
            </slot>
          </div>
          <div class="header-actions">
            <slot name="header-actions">
              <!-- New chat -->
              <button @click="newSession" :title="t('panel.newChat')" class="hbtn">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
              <!-- History -->
              <button @click="toggleHistory" :title="t('panel.history')" class="hbtn" :class="{ active: showHistory }">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </button>
              <!-- Cloud settings -->
              <button v-if="showSettingsButton" @click="openCloudConfig" :title="t('panel.settings')" class="hbtn">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              </button>
              <!-- Expand -->
              <button @click="toggleSize" :title="t('panel.expand')" class="hbtn">
                <svg v-if="panelSize === 'fullscreen' || panelSize === 'large'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              </button>
              <!-- Close -->
              <button @click="emit('close')" :title="t('panel.close')" class="hbtn hbtn-close">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </slot>
          </div>
        </slot>
      </div>

      <!-- History Sidebar -->
      <Transition name="slide">
        <div v-if="showHistory" class="history-sidebar">
          <div class="history-header">
            <span class="history-title">{{ t('panel.recentChats') }}</span>
            <button @click="clearHistory" class="clear-btn">{{ t('settings.clearHistory') }}</button>
          </div>
          <div class="history-list">
            <div
              v-for="session in sessions"
              :key="session.id"
              :class="['history-item', { active: session.id === currentSessionId }]"
              @click="switchSession(session.id)"
            >
              <div class="session-info">
                <span class="session-title">{{ session.title }}</span>
                <span class="session-date">{{ formatDate(session.updatedAt) }}</span>
              </div>
              <button @click.stop="deleteSession(session.id)" class="delete-btn" :title="t('panel.close')">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
            <div v-if="sessions.length === 0" class="no-history">{{ t('panel.noHistory') }}</div>
          </div>
        </div>
      </Transition>

      <!-- Settings Panel Overlay -->
      <CloudConfigPanel
        v-if="showCloudConfig"
        :options="options"
        @close="showCloudConfig = false"
        @config-updated="handleConfigUpdated"
      />

      <!-- Content Container -->
      <div class="messages-container" ref="messagesContainerRef" @click="handleLinkClick">
        <!-- Page Context Banner -->
        <div v-if="pageContext" class="page-context-banner">
          <svg class="ctx-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color: var(--vp-c-brand, #3eaf7c); flex-shrink: 0;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span class="context-text">
            {{ t('panel.viewing') }}: 
            <a :href="resolveSourceUrl(pageContext.url)" class="context-link">
              <strong>{{ pageContext.title }}</strong>
            </a>
          </span>
          <div class="context-actions">
            <button @click="summarizePage" class="context-action">{{ t('action.summarize') }}</button>
            <button @click="discussPage" class="context-action">{{ t('action.discuss') }}</button>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="messages.length === 0" class="chat-intro">
          <slot name="welcome">
            <div class="intro-logo">
              <slot name="welcome-icon">
                <img v-if="logoSrc && (logoPosition === 'welcome' || logoPosition === 'both')" :src="logoSrc" :alt="logoAlt" :class="['logo-icon-welcome', logoSize]" />
                <svg v-else class="sparkle-icon" viewBox="0 0 24 24" fill="currentColor" width="32" height="32" aria-hidden="true" style="color: var(--vp-c-brand, #3eaf7c); opacity: 0.8; margin-bottom: 12px;">
                  <path d="M12 2L14.85 9.15L22 12L14.85 14.85L12 22L9.15 14.85L2 12L9.15 9.15L12 2Z" />
                </svg>
              </slot>
            </div>
            <slot name="welcome-text">
              <h2>{{ t('panel.subtitle') }}</h2>
              <div class="di-intro-greeting" v-html="siteGreetingHtml"></div>
            </slot>
          </slot>
        </div>

        <!-- Message List -->
        <slot name="messages" :messages="messages">
          <div
            v-for="msg in messages"
            :key="msg.id"
            :class="['message-wrapper', msg.role]"
          >
            <slot name="message" :message="msg">
              <div class="message-bubble">
                <div class="message-sender-name">
                  {{ msg.role === 'user' ? 'You' : 'Assistant' }}
                  <span v-if="msg.offlineFallback" class="offline-pill">Offline</span>
                </div>

                <!-- Loading -->
                <div v-if="msg.loading" class="loading-state-wrapper">
                  <LoadingStates
                    :stage="loadingStage"
                    :progress="loadingProgress"
                    :scanned-pages="loadingScannedPages"
                  />
                </div>

                <!-- Message Content -->
                <template v-if="editingMessageId === msg.id">
                  <div class="message-edit-mode">
                    <textarea 
                      v-model="editingContent" 
                      class="edit-textarea"
                      rows="3"
                      @keydown.enter.exact.prevent="saveEditedMessage(msg.id)"
                      @keydown.esc="cancelEditing"
                    ></textarea>
                    <div class="edit-actions">
                      <button @click="saveEditedMessage(msg.id)" class="edit-btn save-btn-edit">{{ t('action.save') }}</button>
                      <button @click="cancelEditing" class="edit-btn cancel-btn-edit">{{ t('action.cancel') }}</button>
                    </div>
                  </div>
                </template>
                <div v-else class="message-content" v-html="msg.renderedContent || msg.content"></div>

                <!-- Source Citations -->
                <div v-if="msg.sources && msg.sources.length > 0" class="sources-list">
                  <span class="sources-label">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    {{ t('answer.references') }}
                  </span>
                  <div class="sources-pills">
                    <component
                      v-for="(source, idx) in msg.sources"
                      :key="idx"
                      :is="isValidUrl(source.url) ? 'a' : 'span'"
                      v-bind="isValidUrl(source.url) ? { href: resolveSourceUrl(source.url), target: '_blank', rel: 'noopener noreferrer' } : {}"
                      class="source-pill"
                      :title="`${source.title} (${Math.round(source.confidence * 100)}% match)`"
                    >
                      <span class="source-num">{{ Number(idx) + 1 }}</span>
                      <span class="source-name">{{ source.title }}</span>
                    </component>
                  </div>
                </div>

                 <!-- Message Actions -->
                <div v-if="msg.role === 'assistant' && !msg.loading" class="message-actions">
                  <!-- Thumbs up -->
                  <button @click="giveFeedback(msg.id, 'up')" :class="['act-btn', { active: msg.feedback === 'up' }]" :title="t('feedback.helpful')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                  </button>
                  <!-- Thumbs down -->
                  <button @click="giveFeedback(msg.id, 'down')" :class="['act-btn', { active: msg.feedback === 'down' }]" :title="t('feedback.notHelpful')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/></svg>
                  </button>
                  <!-- Copy -->
                  <button @click="copyMessage(msg.content)" class="act-btn" :title="t('feedback.copy')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  </button>
                  <!-- Delete -->
                  <button @click="deleteMessage(msg)" class="act-btn" :title="t('action.delete')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </div>

                <!-- User Edit Actions -->
                <div v-if="msg.role === 'user' && editingMessageId !== msg.id && !loading" class="message-actions user-actions">
                  <!-- Edit -->
                  <button @click="startEditing(msg)" class="act-btn" :title="t('action.edit')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <!-- Resend -->
                  <button @click="resendMessage(msg)" class="act-btn" :title="t('action.resend')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                  </button>
                  <!-- Delete -->
                  <button @click="deleteMessage(msg)" class="act-btn" :title="t('action.delete')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                  </button>
                </div>
              </div>
            </slot>
          </div>
        </slot>
      </div>

      <!-- Error Bar -->
      <Transition name="slide-up">
        <div v-if="currentError" :class="['error-banner', currentError.severity]">
          <svg class="error-icon-svg" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <template v-if="currentError.severity === 'critical' || currentError.severity === 'error'">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </template>
            <template v-else>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </template>
          </svg>
          <div class="error-details">
            <p class="error-msg-text">{{ currentError.message }}</p>
            <p v-if="currentError.userAction" class="error-action-text">{{ currentError.userAction }}</p>
          </div>
          <div class="error-actions">
            <button @click="reportCurrentError" class="err-report-btn">{{ t('action.report') }}</button>
            <button @click="dismissError" class="err-dismiss-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      </Transition>

      <!-- Suggested Questions -->
      <div class="suggestions-area" v-if="messages.length === 0 && suggestions.length > 0">
        <slot name="suggestions">
          <SuggestedQuestions :questions="suggestions" @select="submitQuestion" />
        </slot>
      </div>

      <!-- Input Area -->
      <slot name="footer">
        <div class="panel-input-area">
          <!-- Subscription Gating Block -->
          <div v-if="subscriptionGated" class="subscription-gating-banner" style="padding: 16px; text-align: center; border-top: 1px solid var(--di-border);">
            <svg class="gating-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--di-text-secondary); margin-bottom: 8px; display: inline-block;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <p class="gating-msg" style="font-size: 13px; color: var(--di-text-secondary); margin-bottom: 12px;">{{ props.options?.usageLimits?.subscription?.upgradeMessage || 'Upgrade to Premium for unlimited AI-powered documentation search.' }}</p>
            <a v-if="props.options?.usageLimits?.subscription?.upgradeUrl" :href="props.options?.usageLimits?.subscription?.upgradeUrl" class="gating-btn" target="_blank" style="display: inline-block; padding: 6px 16px; background: var(--di-primary); color: white; border-radius: 6px; font-size: 12px; font-weight: 600; text-decoration: none;">Upgrade Now</a>
          </div>
          
          <template v-else>
            <slot name="input">
              <div class="input-row">
                <textarea
                  ref="textareaRef"
                  v-model="query"
                  rows="1"
                  class="chat-textarea"
                  :placeholder="t('panel.placeholder')"
                  aria-label="Ask anything about the documentation"
                  @keydown.enter.exact.prevent="submitQuery"
                ></textarea>
                <button class="send-btn" :disabled="!query.trim() || loading" @click="submitQuery" :title="t('panel.send')">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="fill: currentColor;"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </div>
            </slot>
            <div class="panel-footer">
              <div class="footer-left">
                <button @click="openCloudConfig" class="cloud-status-btn">
                  <i :class="searchMode === 'on-device' ? 'fa-solid fa-laptop' : 'fa-solid fa-cloud'"></i>
                  <span class="mode-badge">{{ searchMode === 'on-device' ? t('answer.source.local') : t('answer.source.cloud') }}</span>
                </button>
              </div>
              <div class="footer-right">
                <slot name="attribution">
                  <span class="powered-by">
                    <a href="https://depthindex.vercel.app" target="_blank" rel="noopener noreferrer">{{ t('panel.poweredBy') }}</a>
                  </span>
                </slot>
              </div>
            </div>
          </template>
        </div>
      </slot>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { DepthIndexEngine } from '../client/search-engine.js';
import { PersonalizationEngine } from '../client/personalization.js';
import { SessionManager, ChatSession, Message } from '../client/session-manager.js';
import { ConversationHandler } from '../client/conversation-handler.js';
import { PageContextProvider } from '../client/page-context.js';
import { ContentRenderer } from '../client/renderers.js';
import { PageFeatures } from '../client/page-features.js';
import { PerformanceOptimizer } from '../client/performance.js';
import { ErrorHandler, DepthIndexError, ErrorSeverity, ErrorCategory } from '../client/error-handler.js';
import { SecurityManager } from '../client/security.js';
import { PIIDetector } from '../client/pii-detector.js';
import { loadEnvConfig } from '../config/env.js';
import { queryCloudAPI, CloudAdapter } from '../client/cloud-adapter.js';
import { AnswerSynthesizer } from '../client/answer-synthesizer.js';
import { ConversationMemory } from '../client/conversation-memory.js';
import { ICONS } from '../client/icons.js';
import { SiteContextEngine } from '../client/site-context.js';
import { SiteIntelligence } from '../client/site-intelligence.js';
import { IntentEngine } from '../client/intent-engine.js';
import { SuggestionEngine } from '../client/suggestion-engine.js';
import { PluginRegistry, PluginContext } from '../sdk/index.js';
import { I18nAPI } from '../extensions/i18n/index.js';

import LoadingStates from './LoadingStates.vue';
import CloudConfigPanel from './CloudConfigPanel.vue';
import SuggestedQuestions from './SuggestedQuestions.vue';

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

// Refs
const query = ref('');
const messages = ref<any[]>([]);
const loading = ref(false);
const showHistory = ref(false);
const showCloudConfig = ref(false);
const currentSessionId = ref('');
const sessions = ref<ChatSession[]>([]);
const pageContext = ref<any>(null);
const panelSize = ref<'medium' | 'small' | 'large' | 'fullscreen'>('medium');
const currentError = ref<DepthIndexError | null>(null);
const lastQuery = ref('');
const editingMessageId = ref<string | null>(null);
const editingContent = ref('');

// Custom Customization properties
const logoSrc = computed(() => props.options?.ai?.logo?.src || props.options?.ai?.personality?.logo?.src || '');
const logoAlt = computed(() => props.options?.ai?.logo?.alt || props.options?.ai?.personality?.logo?.alt || 'AI Logo');
const logoSize = computed(() => `logo-size-${props.options?.ai?.logo?.size || props.options?.ai?.personality?.logo?.size || 'md'}`);
const logoPosition = computed(() => props.options?.ai?.logo?.position || props.options?.ai?.personality?.logo?.position || 'both');

const subscriptionGated = ref(false);

function showErrorBanner(message: string) {
  currentError.value = {
    id: String(Date.now()),
    message,
    severity: ErrorSeverity.WARNING,
    category: ErrorCategory.VALIDATION,
    timestamp: Date.now(),
    recoverable: true
  } as any;
}

const checkRateLimits = (): boolean => {
  if (!props.options?.usageLimits?.rateLimit) return true;
  
  const now = Date.now();
  const rateLimit = props.options.usageLimits.rateLimit;
  const historyKey = 'depthindex_query_timestamps';
  const timestamps: number[] = JSON.parse(localStorage.getItem(historyKey) || '[]');
  
  const oneHourAgo = now - 3600000;
  let activeTimestamps = timestamps.filter(t => t > oneHourAgo);
  
  if (rateLimit.queriesPerMinute) {
    const oneMinuteAgo = now - 60000;
    const perMinuteCount = activeTimestamps.filter(t => t > oneMinuteAgo).length;
    if (perMinuteCount >= rateLimit.queriesPerMinute) {
      const errorMsg = rateLimit.cooldownMessage || 'Too many requests. Please wait a moment.';
      showErrorBanner(errorMsg);
      return false;
    }
  }
  
  if (rateLimit.queriesPerHour) {
    if (activeTimestamps.length >= rateLimit.queriesPerHour) {
      const errorMsg = rateLimit.cooldownMessage || 'Hourly limit exceeded. Please try again later.';
      showErrorBanner(errorMsg);
      return false;
    }
  }
  
  activeTimestamps.push(now);
  localStorage.setItem(historyKey, JSON.stringify(activeTimestamps));
  return true;
};

const checkTokenLimits = (estimatedRequestTokens: number): boolean => {
  if (!props.options?.usageLimits?.tokens) return true;
  
  const tokens = props.options.usageLimits.tokens;
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7);
  
  if (tokens.maxPerUserPerDay) {
    const dailyKey = 'depthindex_tokens_daily';
    const dailyData = JSON.parse(localStorage.getItem(dailyKey) || '{}');
    if (dailyData.date === today) {
      if (dailyData.count + estimatedRequestTokens > tokens.maxPerUserPerDay) {
        showErrorBanner('Daily token limit reached. Please try again tomorrow.');
        return false;
      }
    }
  }
  
  if (tokens.maxPerUserPerMonth) {
    const monthlyKey = 'depthindex_tokens_monthly';
    const monthlyData = JSON.parse(localStorage.getItem(monthlyKey) || '{}');
    if (monthlyData.month === thisMonth) {
      if (monthlyData.count + estimatedRequestTokens > tokens.maxPerUserPerMonth) {
        showErrorBanner('Monthly token limit reached. Please try again next month.');
        return false;
      }
    }
  }
  
  return true;
};

const recordTokenUsage = (tokensUsed: number) => {
  if (!props.options?.usageLimits?.tokens) return;
  
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7);
  
  const dailyKey = 'depthindex_tokens_daily';
  const dailyData = JSON.parse(localStorage.getItem(dailyKey) || '{}');
  if (dailyData.date === today) {
    dailyData.count += tokensUsed;
  } else {
    dailyData.date = today;
    dailyData.count = tokensUsed;
  }
  localStorage.setItem(dailyKey, JSON.stringify(dailyData));
  
  const monthlyKey = 'depthindex_tokens_monthly';
  const monthlyData = JSON.parse(localStorage.getItem(monthlyKey) || '{}');
  if (monthlyData.month === thisMonth) {
    monthlyData.count += tokensUsed;
  } else {
    monthlyData.month = thisMonth;
    monthlyData.count = tokensUsed;
  }
  localStorage.setItem(monthlyKey, JSON.stringify(monthlyData));
};

const enforceResponseLimits = (content: string, isCloud: boolean): string => {
  if (!props.options?.usageLimits?.response) return content;
  
  const responseLimits = props.options.usageLimits.response;
  const maxChars = isCloud ? responseLimits.cloudMaxChars : responseLimits.localMaxChars;
  
  if (maxChars && content.length > maxChars) {
    const truncated = content.substring(0, maxChars);
    const msg = responseLimits.truncationMessage || '\n\n*[Response truncated due to length limits]*';
    return truncated + msg;
  }
  
  return content;
};

// Loading indicators
const loadingStage = ref<'thinking' | 'searching' | 'analyzing' | 'generating'>('thinking');
const loadingProgress = ref(0);
const loadingScannedPages = ref(0);

// settings loaded from storage
const searchMode = ref('on-device');
const cloudProvider = ref('gemini');
const apiKey = ref('');
const modelName = ref('');

const messagesContainerRef = ref<HTMLDivElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

// Core Modules Instantiation
const sessionManager = new SessionManager();
const conversationHandler = new ConversationHandler();
const pageContextProvider = new PageContextProvider(props.engine);
const cloudAdapter = new CloudAdapter();
const pageFeatures = new PageFeatures(props.engine, cloudAdapter, () => ({
  provider: cloudProvider.value,
  apiKey: apiKey.value,
  model: modelName.value || '',
  personality: props.options?.ai?.personality
}));
const contentRenderer = new ContentRenderer();
const performanceOptimizer = new PerformanceOptimizer(props.engine);
const securityManager = new SecurityManager();
const piiDetector = new PIIDetector();
const errorHandler = new ErrorHandler();
const siteContextEngine = new SiteContextEngine();
const siteIntelligence = new SiteIntelligence();
const intentEngine = new IntentEngine();
const suggestionEngine = new SuggestionEngine();
const conversationMemory = new ConversationMemory({
  maxEntries: props.options?.synthesis?.conversationMemoryDepth || 10,
  sessionTimeout: props.options?.synthesis?.followUpDetection?.sessionTimeout || 300000,
  customEntities: props.options?.synthesis?.customEntities || []
});
if (typeof window !== 'undefined') {
  (window as any).__DEPTHINDEX_MEMORY__ = conversationMemory;
}

// SDK registry & i18n initialization
const registry = (typeof window !== 'undefined' && (window as any).depthIndexRegistry) || new PluginRegistry();
if (typeof window !== 'undefined') {
  (window as any).depthIndexRegistry = registry;
}

const i18n = new I18nAPI();
const currentLang = ref(i18n.getCurrentLanguage());
if (typeof window !== 'undefined') {
  window.addEventListener('depthindex:language-changed', (e: any) => {
    currentLang.value = e.detail.code;
  });
}

const t = (key: string, params?: Record<string, string | number>) => {
  const _ = currentLang.value;
  return i18n.t(key, params);
};

// load env config
const envConfig = loadEnvConfig();

const panelTitle = computed(() => {
  return envConfig.VITE_DEPTHINDEX_PANEL_TITLE || props.options?.ui?.title || t('panel.title');
});

const panelPosition = computed(() => {
  return `pos-${props.options?.ui?.position || 'bottom-right'}`;
});

const searchModeLabel = computed(() => {
  if (searchMode.value === 'on-device') return 'On-Device';
  if (searchMode.value === 'hybrid') return 'Hybrid';
  return 'Cloud';
});

const showSettingsButton = computed(() => {
  const uiShow = props.options?.ui?.showSettingsButton ?? true;
  const featAllow = props.options?.features?.allowUserCloudConfig ?? true;
  return uiShow && featAllow;
});

const siteGreetingHtml = computed(() => {
  // Use compact one-liner greeting from siteContextEngine
  const raw = siteContextEngine.generateGreeting();
  return raw
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
});

const suggestions = computed(() => {
  if (typeof window === 'undefined') return [];

  const profile = siteIntelligence.analyze();

  // Build SuggestionContext from reactive state
  const context = {
    siteProfile: profile,
    currentPage: {
      ...profile.currentPage,
      contentLength: document.querySelector('.VPContent, main')?.textContent?.length ?? 0,
      hasCodeBlocks: document.querySelectorAll('.VPContent pre, main pre').length > 0,
      hasConfig: /config|option|setting/i.test(document.title + (profile.currentPage.title || '')),
      url: window.location.pathname,
    },
    conversationHistory: messages.value as any[],
  };

  const engineSuggestions = suggestionEngine.generate(context, 4);

  // Fallback: use SiteIntelligence suggestions if SuggestionEngine returns nothing
  if (engineSuggestions.length === 0) {
    return siteIntelligence.suggestQuestions().slice(0, 4);
  }

  return engineSuggestions;
});

// Watch open state to focus input & scroll
watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    if (props.initialQuery) {
      query.value = props.initialQuery;
      submitQuery();
    }
    await nextTick();
    textareaRef.value?.focus();
    scrollToBottom();
  }
});

// Watch initialQuery
watch(() => props.initialQuery, (newVal) => {
  if (newVal && props.isOpen) {
    query.value = newVal;
    submitQuery();
  }
});

// Listen for errors
onMounted(async () => {
  // Subscription gating check
  if (props.options?.usageLimits?.subscription?.enabled) {
    if (typeof props.options.usageLimits.subscription.checkAccess === 'function') {
      try {
        const hasAccess = await props.options.usageLimits.subscription.checkAccess();
        subscriptionGated.value = !hasAccess;
      } catch (e) {
        console.error('[DepthIndex] Subscription access check failed:', e);
        subscriptionGated.value = true;
      }
    } else {
      subscriptionGated.value = true;
    }
  }

  errorHandler.onError('*', (err) => {
    currentError.value = err;
    if (err.severity === 'info') {
      setTimeout(() => {
        if (currentError.value?.id === err.id) {
          currentError.value = null;
        }
      }, 5000);
    }
  });

  // Init IndexedDB sessions
  try {
    await sessionManager.init();
    await loadSessions();
  } catch (err: any) {
    errorHandler.handleError(err, ErrorCategory.STORAGE, ErrorSeverity.WARNING);
  }

  // Register static extensions passed from config options
  if (props.options?.extensions && Array.isArray(props.options.extensions)) {
    for (const ext of props.options.extensions) {
      if (ext.type === 'language' && ext.pack) {
        try {
          registry.register({
            id: ext.pack.code,
            name: ext.pack.englishName,
            version: '1.0.0',
            description: `Language pack for ${ext.pack.englishName}`,
            author: ext.pack.author || { name: 'Unknown' },
            permissions: [],
            minDepthIndexVersion: '1.1.0',
            dataDisclosure: { collectsData: false, storageLocation: 'local', thirdPartySharing: false },
            compliance: { gdpr: true, ccpa: true, phDataPrivacy: true, piiHandling: 'none', securityMeasures: [] }
          }, {
            onRegister: (ctx: PluginContext) => {
              ctx.i18n.registerPack(ext.pack);
            }
          });
          registry.activate(ext.pack.code);
        } catch (err) {
          console.error('[DepthIndex SDK] Failed to auto-register language pack:', err);
        }
      }
    }
  }

  // Load cloud configurations from localStorage/env
  loadConfig();

  // Initialize optimizer / search worker
  try {
    const indexUrl = props.options?.indexUrl || '/assets/depth-index.json';
    await performanceOptimizer.init(indexUrl, props.engine);
  } catch (err: any) {
    console.warn('[DepthIndex] Failed to initialize worker performance optimizer, main thread fallback active.');
  }

  // Set up page context detection
  updatePageContext();
  setInterval(updatePageContext, 2000);

  // Listen for transferred queries from search bar when panel is open
  window.addEventListener('depthindex:open-panel', handleTransferredQuery);
});

const handleTransferredQuery = (event: Event) => {
  const customEvent = event as CustomEvent;
  const { query: q, source } = customEvent.detail || {};
  if (q && source === 'search-bar') {
    query.value = q;
    submitQuery();
  }
};

onUnmounted(() => {
  window.removeEventListener('depthindex:open-panel', handleTransferredQuery);
});

// Watch messages for Mermaid renderings
watch(messages, () => {
  nextTick(() => {
    renderAllMermaidDiagrams();
  });
}, { deep: true });

function updatePageContext() {
  const ctx = pageContextProvider.getPageContext();
  if (ctx) {
    const prevTitle = pageContext.value?.title;
    pageContext.value = ctx;
    // Invalidate suggestion cache on page navigation
    if (prevTitle && prevTitle !== ctx.title) {
      suggestionEngine.invalidate();
    }
  }
}

function loadConfig() {
  if (typeof window !== 'undefined') {
    searchMode.value = envConfig.VITE_DEPTHINDEX_DEFAULT_MODE || localStorage.getItem('depthindex_search_mode') || props.options?.searchMode || 'on-device';
    cloudProvider.value = localStorage.getItem('depthindex_cloud_provider') || props.options?.cloudAPI?.provider || 'gemini';
    apiKey.value = envConfig.VITE_DEPTHINDEX_CLOUD_API_KEY || localStorage.getItem(`depthindex_api_key_${cloudProvider.value}`) || props.options?.cloudAPI?.apiKey || '';
    modelName.value = envConfig.VITE_DEPTHINDEX_CLOUD_MODEL || localStorage.getItem(`depthindex_model_${cloudProvider.value}`) || props.options?.cloudAPI?.model || '';
  }
}

async function loadSessions() {
  try {
    sessions.value = await sessionManager.getSessions();
    const lastSessionId = localStorage.getItem('depthindex-last-session');
    if (lastSessionId && sessions.value.some(s => s.id === lastSessionId)) {
      await switchSession(lastSessionId);
    } else if (sessions.value.length > 0) {
      await switchSession(sessions.value[0].id);
    } else {
      await newSession();
    }
  } catch (err: any) {
    errorHandler.handleError(err, ErrorCategory.STORAGE, ErrorSeverity.WARNING);
  }
}

async function newSession() {
  const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
  const session: ChatSession = {
    id,
    title: 'New chat',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pageContext: pageContext.value?.title || undefined
  };

  try {
    await sessionManager.saveSession(session);
    sessions.value.unshift(session);
    await switchSession(id);
    showHistory.value = false;
  } catch (err: any) {
    errorHandler.handleError(err, ErrorCategory.STORAGE, ErrorSeverity.ERROR);
  }
}

async function switchSession(id: string) {
  currentSessionId.value = id;
  localStorage.setItem('depthindex-last-session', id);
  try {
    const msgs = await sessionManager.getMessages(id);
    for (const msg of msgs) {
      if (!msg.renderedContent) {
        msg.renderedContent = await contentRenderer.renderMarkdown(msg.content, msg.citations);
        await sessionManager.saveMessage(msg);
      }
    }
    messages.value = msgs;
    await nextTick();
    scrollToBottom();
  } catch (err: any) {
    errorHandler.handleError(err, ErrorCategory.STORAGE, ErrorSeverity.ERROR);
  }
}

async function deleteSession(id: string) {
  try {
    await sessionManager.deleteSession(id);
    sessions.value = sessions.value.filter(s => s.id !== id);
    if (currentSessionId.value === id) {
      if (sessions.value.length > 0) {
        await switchSession(sessions.value[0].id);
      } else {
        await newSession();
      }
    }
  } catch (err: any) {
    errorHandler.handleError(err, ErrorCategory.STORAGE, ErrorSeverity.ERROR);
  }
}

async function clearHistory() {
  if (confirm('Clear all session history? This cannot be undone.')) {
    try {
      await sessionManager.clearAllData();
      sessions.value = [];
      await newSession();
    } catch (err: any) {
      errorHandler.handleError(err, ErrorCategory.STORAGE, ErrorSeverity.ERROR);
    }
  }
}

function toggleHistory() {
  showHistory.value = !showHistory.value;
}

function openCloudConfig() {
  showCloudConfig.value = true;
}

function handleConfigUpdated() {
  loadConfig();
}

function toggleSize() {
  if (panelSize.value === 'medium') panelSize.value = 'large';
  else if (panelSize.value === 'large') panelSize.value = 'fullscreen';
  else if (panelSize.value === 'fullscreen') panelSize.value = 'small';
  else panelSize.value = 'medium';
}

function submitQuestion(q: string) {
  runQuery(q);
}

async function submitQuery() {
  const currentQuery = query.value.trim();
  if (!currentQuery) return;
  query.value = '';
  await runQuery(currentQuery);
}

async function runQuery(currentQuery: string) {
  if (!currentQuery || loading.value) return;

  // Subscription gating check
  if (subscriptionGated.value) {
    const gatingMsg = props.options?.usageLimits?.subscription?.upgradeMessage || 'Upgrade to Premium for unlimited AI-powered documentation search.';
    showErrorBanner(gatingMsg);
    return;
  }

  // Rate limit check
  if (!checkRateLimits()) {
    return;
  }

  // Token limit check
  const estimatedRequestTokens = Math.ceil(currentQuery.length / 4);
  if (!checkTokenLimits(estimatedRequestTokens)) {
    return;
  }

  loading.value = true;

  // Validate query inputs for security
  const validation = securityManager.validateQuery(currentQuery);
  if (!validation.valid) {
    loading.value = false;
    errorHandler.handleError(
      new Error(validation.error || 'Security check failed.'),
      ErrorCategory.SECURITY,
      ErrorSeverity.WARNING
    );
    return;
  }

  const queryToRun = piiDetector.sanitizePII(validation.sanitized || currentQuery).sanitized;
  lastQuery.value = queryToRun;

  // 1. Add User Message
  const userMsgId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  const userMsg: Message = {
    id: userMsgId,
    sessionId: currentSessionId.value,
    role: 'user',
    content: queryToRun,
    timestamp: Date.now()
  };

  userMsg.renderedContent = await contentRenderer.renderMarkdown(userMsg.content);
  messages.value.push(userMsg);
  await sessionManager.saveMessage(userMsg);
  await nextTick();
  scrollToBottom();

  // Update session title if default
  const session = sessions.value.find(s => s.id === currentSessionId.value);
  if (session && session.title === 'New chat') {
    const titleWords = queryToRun.split(/\s+/).slice(0, 5).join(' ');
    session.title = titleWords + (queryToRun.split(/\s+/).length > 5 ? '...' : '');
    await sessionManager.saveSession(session);
  }

  // 2. Generate Assistant Response
  await generateAssistantResponse(queryToRun);
}

function startEditing(msg: any) {
  editingMessageId.value = msg.id;
  editingContent.value = msg.content;
}

function cancelEditing() {
  editingMessageId.value = null;
  editingContent.value = '';
}

async function saveEditedMessage(id: string) {
  const msgIdx = messages.value.findIndex(m => m.id === id);
  if (msgIdx === -1) return;

  const currentQuery = editingContent.value.trim();
  if (!currentQuery || loading.value) return;

  loading.value = true;
  editingMessageId.value = null;

  // Validate query inputs for security
  const validation = securityManager.validateQuery(currentQuery);
  if (!validation.valid) {
    loading.value = false;
    errorHandler.handleError(
      new Error(validation.error || 'Security check failed.'),
      ErrorCategory.SECURITY,
      ErrorSeverity.WARNING
    );
    return;
  }

  const queryToRun = piiDetector.sanitizePII(validation.sanitized || currentQuery).sanitized;
  lastQuery.value = queryToRun;

  // Update User Message content & rendered markdown
  const userMsg = messages.value[msgIdx];
  userMsg.content = queryToRun;
  userMsg.renderedContent = await contentRenderer.renderMarkdown(queryToRun);

  // Clean subsequent messages from state and IndexedDB
  const subsequent = messages.value.slice(msgIdx + 1);
  for (const m of subsequent) {
    await sessionManager.deleteMessage(m.id);
  }
  
  messages.value = messages.value.slice(0, msgIdx + 1);
  await sessionManager.saveMessage(userMsg);
  await nextTick();
  scrollToBottom();

  // Generate Assistant Response
  await generateAssistantResponse(queryToRun);
}

async function resendMessage(msg: any) {
  const msgIdx = messages.value.findIndex(m => m.id === msg.id);
  if (msgIdx === -1) return;
  
  const subsequent = messages.value.slice(msgIdx);
  for (const m of subsequent) {
    await sessionManager.deleteMessage(m.id);
  }
  messages.value = messages.value.slice(0, msgIdx);
  
  await runQuery(msg.content);
}

async function deleteMessage(msg: any) {
  const msgIdx = messages.value.findIndex(m => m.id === msg.id);
  if (msgIdx === -1) return;
  
  if (msg.role === 'user') {
    const subsequent = messages.value.slice(msgIdx);
    for (const m of subsequent) {
      await sessionManager.deleteMessage(m.id);
    }
    messages.value = messages.value.slice(0, msgIdx);
  } else {
    messages.value.splice(msgIdx, 1);
    await sessionManager.deleteMessage(msg.id);
  }
}

async function generateAssistantResponse(queryToRun: string) {
  // Resolve anaphora
  const resolvedQuery = conversationMemory.resolveAnaphora(queryToRun);
  
  // Add user query to conversation memory
  conversationMemory.add({
    role: 'user',
    content: queryToRun,
    timestamp: Date.now()
  });

  // 1. Intent Detection
  const intentCheck = conversationHandler.detectIntent(resolvedQuery);
  const nluIntent = intentEngine.detectIntent(resolvedQuery, messages.value);
  console.log('[DepthIndex] NLU parsed intent:', nluIntent);
  
  // 2. Add Assistant Placeholder (with Loading State active)
  const assistantMsgId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + 1);
  const assistantMsg = reactive<any>({
    id: assistantMsgId,
    sessionId: currentSessionId.value,
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
    loading: true
  });
  messages.value.push(assistantMsg);
  await nextTick();
  scrollToBottom();

  try {
    if (intentCheck.isConversational) {
      // Conversational responses
      loadingStage.value = 'thinking';
      await sleep(1000);
      const reply = await conversationHandler.handleConversational(intentCheck.intent);
      assistantMsg.content = reply;
      
      // Save assistant response to memory
      conversationMemory.add({
        role: 'assistant',
        content: reply,
        timestamp: Date.now()
      });
    } else {
      // Search engine response
      loadingStage.value = 'searching';
      loadingProgress.value = 0;

      // Simulate scanning pages
      const progressInterval = setInterval(() => {
        if (loadingProgress.value < 90) {
          loadingProgress.value += Math.random() * 20;
          loadingScannedPages.value = Math.floor(loadingProgress.value * 2.5);
        }
      }, 150);

      const searchResults = await performanceOptimizer.search(resolvedQuery, 5);
      
      // Apply memory-aware search boosting
      const currentTopic = conversationMemory.getCurrentTopic();
      if (currentTopic && props.options?.search?.conversationBoost !== false) {
        const boostFactor = props.options?.search?.boostFactor || 1.5;
        for (const res of searchResults) {
          const content = (res.chunk.content || '').toLowerCase();
          const title = (res.chunk.pageTitle || '').toLowerCase();
          const heading = (res.chunk.heading || '').toLowerCase();
          if (content.includes(currentTopic) || title.includes(currentTopic) || heading.includes(currentTopic)) {
            res.score = Math.min(1.0, res.score * boostFactor);
          }
        }
      }

      clearInterval(progressInterval);
      loadingProgress.value = 100;
      loadingScannedPages.value = searchResults.length;

      loadingStage.value = 'analyzing';
      await sleep(800);

      loadingStage.value = 'generating';
      await sleep(300);

      // Map results to the SearchResult interface expected by the Synthesizer
      const mappedResults = searchResults.map(r => ({
        page: {
          url: r.chunk.url || '',
          title: r.chunk.pageTitle || '',
          section: r.chunk.heading || ''
        },
        snippet: r.chunk.content || '',
        score: r.score,
        fullContent: r.chunk.content || '',
        headings: r.chunk.heading ? [r.chunk.heading] : [],
        codeBlocks: (r.chunk.codeBlocks || []).map(cb => ({
          language: cb.language,
          code: cb.code,
          context: r.chunk.heading || ''
        }))
      }));

      // Determine response logic (hybrid cloud vs local)
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      const isCloud = !!(searchMode.value !== 'on-device' && isOnline && apiKey.value);
      
      const synthesizer = new AnswerSynthesizer();
      let synthesizedResponse;
      let isFallback = false;

      const onProgress = (s: any) => {
        loadingProgress.value = s.progress;
        if (s.stage === 'filtering' || s.stage === 'clustering') {
          loadingStage.value = 'analyzing';
        } else if (s.stage === 'extracting' || s.stage === 'building' || s.stage === 'cloud_processing' || s.stage === 'finalizing') {
          loadingStage.value = 'generating';
        }
      };

      if (isCloud) {
        try {
          const systemContext = props.options?.ai?.systemContext || '';
          const cloudConfig = {
            provider: cloudProvider.value as any,
            apiKey: apiKey.value,
            model: modelName.value || '',
            messages: [] as any[],
            personality: props.options?.ai?.personality
          };
          if (systemContext) {
            cloudConfig.messages.push({
              role: 'system',
              content: systemContext
            });
          }
          synthesizedResponse = await synthesizer.synthesize(resolvedQuery, mappedResults, {
            mode: 'cloud',
            cloudAdapter,
            cloudConfig
          }, onProgress);
        } catch (err: any) {
          console.warn('[DepthIndex] Cloud query failed, falling back to local indexing:', err);
          synthesizedResponse = await synthesizer.synthesize(resolvedQuery, mappedResults, { mode: 'local' }, onProgress);
          isFallback = true;
          errorHandler.handleError(err, ErrorCategory.CLOUD_API, ErrorSeverity.WARNING);
        }
      } else {
        synthesizedResponse = await synthesizer.synthesize(resolvedQuery, mappedResults, { mode: 'local' }, onProgress);
        if (searchMode.value !== 'on-device' && !isOnline) {
          isFallback = true;
        }
      }

      let finalContent = synthesizedResponse.content;

      // Enforce response length limits
      finalContent = enforceResponseLimits(finalContent, isCloud);

      // Record token usage
      const estimatedPromptTokens = Math.ceil((resolvedQuery.length + (searchResults.map(r => r.chunk.content).join(' ').length)) / 4);
      const estimatedResponseTokens = Math.ceil(finalContent.length / 4);
      recordTokenUsage(estimatedPromptTokens + estimatedResponseTokens);

      // Generate References footer if there are citations
      if (synthesizedResponse.citations.length > 0) {
        finalContent += synthesizer.generateReferencesSection(synthesizedResponse.citations, synthesizedResponse.requestId);
      }

      // Generate Related Topics footer
      const validRelated = (synthesizedResponse.relatedTopics || []).filter(topic => {
        if (!topic) return false;
        if (typeof topic === 'object') {
          return !!((topic as any).title && (topic as any).title.trim());
        }
        return typeof topic === 'string' && topic.trim().length > 0;
      });

      if (validRelated.length > 0) {
        finalContent += '\n\n### 🔍 Related Topics\n\n';
        finalContent += validRelated
          .map(topic => {
            if (typeof topic === 'object') {
              const tObj = topic as { title: string; url: string };
              return `• [${tObj.title.trim()}](${tObj.url || '#'})`;
            }
            return `• ${topic.trim()}`;
          })
          .join('\n');
      }


      // Append badge indicator
      const sourceBadge = synthesizedResponse.source === 'cloud' 
        ? '<span class="badge cloud">☁️ Cloud AI</span>'
        : '<span class="badge local">💻 On-Device</span>';
      
      finalContent += `\n\n<small>${sourceBadge} • Confidence: ${Math.round(synthesizedResponse.confidence * 100)}%</small>`;

      const sourcesList = synthesizedResponse.citations.map(c => ({
        url: c.url,
        title: c.title + (c.section ? ` > ${c.section}` : ''),
        confidence: synthesizedResponse.confidence
      }));

      assistantMsg.content = finalContent;
      assistantMsg.sources = sourcesList;
      assistantMsg.citations = synthesizedResponse.citations;
      assistantMsg.offlineFallback = isFallback;
      
      // Save assistant response to memory
      conversationMemory.add({
        role: 'assistant',
        content: finalContent,
        timestamp: Date.now()
      });

      if (props.personalization) {
        props.personalization.recordQuery(resolvedQuery, searchResults);
      }
    }
  } catch (err: any) {
    assistantMsg.content = `❌ **Error handling query:** ${err.message || err}`;
    errorHandler.handleError(err, ErrorCategory.SEARCH_EXECUTION, ErrorSeverity.ERROR);
  } finally {
    assistantMsg.loading = false;
    loading.value = false;
    
    assistantMsg.renderedContent = await contentRenderer.renderMarkdown(assistantMsg.content, assistantMsg.citations);

    await sessionManager.saveMessage({
      id: assistantMsg.id,
      sessionId: assistantMsg.sessionId,
      role: 'assistant',
      content: assistantMsg.content,
      renderedContent: assistantMsg.renderedContent,
      sources: assistantMsg.sources,
      citations: assistantMsg.citations,
      timestamp: assistantMsg.timestamp,
      offlineFallback: assistantMsg.offlineFallback
    });
    await nextTick();
    scrollToBottom();
  }
}

function generateLocalResponse(results: any[]): string {
  if (results.length === 0) {
    return "I couldn't find any relevant sections in the documentation for your query. Try rephrasing or checking settings.";
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

// Commands
async function summarizePage() {
  if (loading.value || !pageContext.value) return;
  
  loading.value = true;
  const assistantMsgId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + 1);
  const assistantMsg = reactive<any>({
    id: assistantMsgId,
    sessionId: currentSessionId.value,
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
    loading: true
  });
  messages.value.push(assistantMsg);
  await nextTick();
  scrollToBottom();

  try {
    loadingStage.value = 'thinking';
    loadingProgress.value = 20;
    await sleep(400);

    loadingStage.value = 'analyzing';
    loadingProgress.value = 60;
    await sleep(500);

    loadingStage.value = 'generating';
    loadingProgress.value = 90;
    const modeParam = searchMode.value === 'on-device' ? 'local' : (searchMode.value === 'hybrid' ? 'hybrid' : 'cloud');
    const summary = await pageFeatures.summarizePage(modeParam);
    await sleep(300);

    assistantMsg.content = summary;
  } catch (err: any) {
    assistantMsg.content = `Failed to generate page summary: ${err.message || err}`;
  } finally {
    assistantMsg.loading = false;
    loading.value = false;
    assistantMsg.renderedContent = await contentRenderer.renderMarkdown(assistantMsg.content, assistantMsg.citations);
    await sessionManager.saveMessage({
      id: assistantMsg.id,
      sessionId: assistantMsg.sessionId,
      role: 'assistant',
      content: assistantMsg.content,
      renderedContent: assistantMsg.renderedContent,
      timestamp: assistantMsg.timestamp
    });
    await nextTick();
    scrollToBottom();
  }
}

async function discussPage() {
  if (loading.value || !pageContext.value) return;
  
  // Directly use the page title as the discussion topic, no user prompt required
  const topic = pageContext.value.title;
  if (!topic) return;

  loading.value = true;
  const assistantMsgId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + 1);
  const assistantMsg = reactive<any>({
    id: assistantMsgId,
    sessionId: currentSessionId.value,
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
    loading: true
  });
  messages.value.push(assistantMsg);
  await nextTick();
  scrollToBottom();

  try {
    loadingStage.value = 'analyzing';
    const modeParam = searchMode.value === 'on-device' ? 'local' : (searchMode.value === 'hybrid' ? 'hybrid' : 'cloud');
    const discussion = await pageFeatures.discussPage(topic.trim(), modeParam);
    assistantMsg.content = discussion;
  } catch (err: any) {
    assistantMsg.content = `Failed to generate page discussion: ${err.message || err}`;
  } finally {
    assistantMsg.loading = false;
    loading.value = false;
    assistantMsg.renderedContent = await contentRenderer.renderMarkdown(assistantMsg.content, assistantMsg.citations);
    await sessionManager.saveMessage({
      id: assistantMsg.id,
      sessionId: assistantMsg.sessionId,
      role: 'assistant',
      content: assistantMsg.content,
      renderedContent: assistantMsg.renderedContent,
      timestamp: assistantMsg.timestamp
    });
    await nextTick();
    scrollToBottom();
  }
}

// Helpers
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function reportCurrentError() {
  if (!currentError.value) return;
  const confirmReport = confirm(t('error.confirmReport'));
  if (!confirmReport) return;
  const targetCheck = errorHandler.validateReportTarget();
  const repo = errorHandler.getReportConfig().githubRepo || 'EldrexDelosReyesBula/vitepress-depthindex';
  const preparedError = {
    ...currentError.value,
    context: {
      ...currentError.value.context,
      reportedByUser: true,
      pageUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
      query: lastQuery.value || 'N/A',
    }
  };

  try {
    if (targetCheck.valid && errorHandler.getReportConfig().target === 'github') {
      await errorHandler.openGitHubIssue(preparedError);
    } else {
      const details = errorHandler.formatErrorForReport(preparedError);
      try {
        await navigator.clipboard.writeText(details);
        alert(`Error details copied to clipboard!\n\nOpening issue page for: github.com/${repo}\nPlease paste the details there.`);
      } catch (clipErr) {
        console.warn('[DepthIndex] Clipboard copy failed:', clipErr);
        alert(`Failed to copy to clipboard automatically. Opening issue page for: github.com/${repo}`);
      }
      window.open(`https://github.com/${repo}/issues/new`, '_blank', 'noopener,noreferrer');
    }
  } catch (err) {
    console.error('[DepthIndex] Failed to report error:', err);
  } finally {
    currentError.value = null;
  }
}

async function renderAllMermaidDiagrams() {
  if (typeof document === 'undefined') return;
  const elements = document.querySelectorAll('.mermaid-diagram[data-diagram]');
  if (elements.length === 0) return;

  const loaded = await contentRenderer.ensureMermaid();
  if (!loaded) return;

  const libName = 'mermaid';
  // @ts-ignore
  const m = (window as any).mermaid || (await import(/* @vite-ignore */ libName)).default;

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i] as HTMLElement;
    if (el.classList.contains('rendered')) continue;

    const id = el.id;
    const code = el.getAttribute('data-diagram') || '';

    try {
      // Clear diagram placeholder inside pre/code
      el.innerHTML = '<span class="spinner" style="width:12px;height:12px;"></span> Rendering...';
      const { svg } = await m.render(`${id}-svg`, code.trim());
      el.innerHTML = svg;
      el.classList.add('rendered');
    } catch (err) {
      console.error('[DepthIndex] Mermaid render error:', err);
      el.innerHTML = `<div class="mermaid-error">⚠️ Invalid diagram syntax</div>`;
      el.classList.add('rendered');
    }
  }
}

async function giveFeedback(messageId: string, rating: 'up' | 'down') {
  const msg = messages.value.find(m => m.id === messageId);
  if (msg) {
    msg.feedback = rating;
    await sessionManager.saveMessage({
      id: msg.id,
      sessionId: msg.sessionId,
      role: msg.role,
      content: msg.content,
      sources: msg.sources,
      timestamp: msg.timestamp,
      feedback: rating,
      offlineFallback: msg.offlineFallback
    });
  }
}

function copyMessage(text: string) {
  navigator.clipboard.writeText(text);
}

function dismissError() {
  currentError.value = null;
}

function scrollToBottom() {
  if (messagesContainerRef.value) {
    messagesContainerRef.value.scrollTop = messagesContainerRef.value.scrollHeight;
  }
}

async function handleLinkClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  const anchor = target.closest('a');
  if (!anchor) return;

  const href = anchor.getAttribute('href');
  if (!href || href === '#') {
    event.preventDefault();
    return;
  }

  // Absolute external links — let them open in new tab (they already have target=_blank)
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
    // Don't intercept — browser will handle target=_blank naturally
    return;
  }

  // Internal relative links (doc pages like /guide/installation)
  if (href.startsWith('/') && !href.startsWith('//')) {
    event.preventDefault();
    try {
      const { useRouter } = await import('vitepress');
      const router = useRouter();
      router.go(href);
    } catch (e) {
      window.location.href = href;
    }
    emit('close');
  }
}

/** Returns true if url is a valid absolute or root-relative path (not empty or #) */
function isValidUrl(url: string): boolean {
  if (!url || url === '#' || url.trim() === '') return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
}

function cleanDocumentationUrl(url: string): string {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  let clean = url.trim();
  
  // Extract hash/query
  const hashIdx = clean.indexOf('#');
  let hash = '';
  if (hashIdx !== -1) {
    hash = clean.substring(hashIdx);
    clean = clean.substring(0, hashIdx);
  }
  
  const queryIdx = clean.indexOf('?');
  let query = '';
  if (queryIdx !== -1) {
    query = clean.substring(queryIdx);
    clean = clean.substring(0, queryIdx);
  }
  
  if (clean.endsWith('.md')) {
    clean = clean.substring(0, clean.length - 3);
    
    // Check if we should use .html instead (fallback for non-cleanUrls)
    const useHtml = typeof window !== 'undefined' && window.location.pathname.includes('.html');
    if (useHtml) {
      clean += '.html';
    }
  }
  
  return clean + query + hash;
}

/** Resolves a source URL: absolute URLs pass through, root-relative stay as-is */
function resolveSourceUrl(url: string): string {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return cleanDocumentationUrl(url);
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
</script>

<style scoped>
/* ─── Panel Shell ─────────────────────────────────────────── */
.depthindex-panel {
  /* Decouple panel theme variables and map them to custom di- tokens */
  --vp-c-bg: var(--di-bg);
  --vp-c-divider: var(--di-border);
  --vp-c-text-1: var(--di-text);
  --vp-c-text-2: var(--di-text-secondary);
  --vp-c-text-3: var(--di-text-tertiary);
  --vp-c-brand: var(--di-primary);
  --vp-c-brand-dimm: var(--di-primary-light);
  --vp-c-bg-soft: var(--di-bg-secondary);
  --vp-c-bg-mute: var(--di-bg-tertiary);

  position: fixed;
  bottom: 80px;
  right: 24px;
  width: 420px;
  height: 600px;
  max-height: calc(100vh - 120px);
  border-radius: 14px;
  background: var(--vp-c-bg, #fff);
  border: 1px solid var(--vp-c-divider, rgba(60,60,60,0.12));
  box-shadow: 0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 199;
  transition: width 0.25s ease, height 0.25s ease;
}

/* Explicit list style resets for reliable list formatting */
.message-content :deep(ul) {
  list-style-type: disc !important;
  padding-left: 20px !important;
  margin: 8px 0 !important;
}
.message-content :deep(ol) {
  list-style-type: decimal !important;
  padding-left: 20px !important;
  margin: 8px 0 !important;
}
.depthindex-panel.small  { width: 320px; height: 440px; }
.depthindex-panel.medium { width: 420px; height: 600px; }
.depthindex-panel.large  { width: 580px; height: 750px; max-height: calc(100vh - 100px); }
.depthindex-panel.fullscreen {
  bottom: 16px; right: 16px;
  width: calc(100vw - 32px); height: calc(100vh - 32px);
  max-height: none;
  border-radius: 12px;
}

/* ─── Header ──────────────────────────────────────────────── */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 10px 14px;
  border-bottom: 1px solid var(--vp-c-divider, rgba(60,60,60,0.10));
  gap: 8px;
  flex-shrink: 0;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.logo-icon { color: var(--vp-c-brand, #3eaf7c); flex-shrink: 0; }
.header-info { display: flex; align-items: center; gap: 6px; min-width: 0; }
.header-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--vp-c-text-1, #3c3c3c);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.badge {
  font-size: 9px;
  padding: 2px 5px;
  border-radius: 4px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #fff;
  flex-shrink: 0;
}
.badge.on-device { background: #569cd6; }
.badge.hybrid    { background: #c98e0a; }
.badge.cloud     { background: #3eaf7c; }

.header-actions { display: flex; gap: 2px; flex-shrink: 0; }
.hbtn {
  background: none;
  border: none;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vp-c-text-2, #777);
  transition: background 0.12s, color 0.12s;
}
.hbtn:hover { background: var(--vp-c-bg-soft, #f0f0f0); color: var(--vp-c-text-1, #333); }
.hbtn.active { color: var(--vp-c-brand, #3eaf7c); }
.hbtn-close:hover { background: rgba(239,68,68,0.08); color: #ef4444; }

/* ─── History Sidebar ─────────────────────────────────────── */
.history-sidebar {
  position: absolute;
  top: 49px;
  left: 0;
  bottom: 0;
  width: 230px;
  background: var(--vp-c-bg, #fff);
  border-right: 1px solid var(--vp-c-divider, rgba(60,60,60,0.10));
  z-index: 100;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 16px rgba(0,0,0,0.06);
}
.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  border-bottom: 1px solid var(--vp-c-divider, rgba(60,60,60,0.08));
}
.history-title { font-size: 11px; font-weight: 700; color: var(--vp-c-text-1, #3c3c3c); text-transform: uppercase; letter-spacing: 0.05em; }
.clear-btn { background: none; border: none; color: #ef4444; font-size: 10px; cursor: pointer; opacity: 0.8; }
.clear-btn:hover { opacity: 1; text-decoration: underline; }
.history-list { flex: 1; overflow-y: auto; padding: 6px; display: flex; flex-direction: column; gap: 2px; }
.history-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 7px 8px; border-radius: 6px; cursor: pointer;
  transition: background 0.12s; color: var(--vp-c-text-1, #3c3c3c);
}
.history-item:hover { background: var(--vp-c-bg-soft, #f5f5f5); }
.history-item.active { background: var(--vp-c-brand-dimm, rgba(62,175,124,0.08)); color: var(--vp-c-brand, #3eaf7c); }
.session-info { display: flex; flex-direction: column; overflow: hidden; flex: 1; gap: 1px; }
.session-title { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500; }
.session-date { font-size: 9px; color: var(--vp-c-text-3, #aaa); }
.delete-btn {
  background: none; border: none; cursor: pointer;
  color: var(--vp-c-text-3, #bbb); opacity: 0;
  padding: 3px; border-radius: 4px; display: flex; align-items: center;
  transition: color 0.12s, opacity 0.12s;
}
.history-item:hover .delete-btn { opacity: 1; }
.delete-btn:hover { color: #ef4444; }
.no-history { padding: 24px; text-align: center; font-size: 11px; color: var(--vp-c-text-3, #bbb); }

/* ─── Messages Area ───────────────────────────────────────── */
.messages-container {
  flex: 1; overflow-y: auto;
  padding: 14px; display: flex; flex-direction: column; gap: 12px;
  scroll-behavior: smooth;
}

/* Context Banner */
.page-context-banner {
  display: flex; align-items: center; gap: 7px;
  background: var(--vp-c-brand-dimm, rgba(62,175,124,0.07));
  border: 1px solid rgba(62,175,124,0.18);
  padding: 7px 10px; border-radius: 8px;
  font-size: 11.5px; flex-shrink: 0;
}
.ctx-icon { color: var(--vp-c-brand, #3eaf7c); flex-shrink: 0; }
.context-text { flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--vp-c-text-1, #3c3c3c); }
.context-actions { display: flex; gap: 4px; flex-shrink: 0; }
.context-action {
  padding: 2px 7px; border-radius: 5px; font-size: 10px; cursor: pointer;
  background: var(--vp-c-bg, #fff); border: 1px solid var(--vp-c-divider, rgba(60,60,60,0.14));
  color: var(--vp-c-text-2, #666); transition: border-color 0.12s, color 0.12s;
}
.context-action:hover { border-color: var(--vp-c-brand, #3eaf7c); color: var(--vp-c-brand, #3eaf7c); }

/* Empty State */
.chat-intro {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; text-align: center; padding: 32px 20px; color: var(--vp-c-text-2, #888);
}
.intro-logo { color: var(--vp-c-brand, #3eaf7c); margin-bottom: 12px; opacity: 0.8; }
.chat-intro h2 { font-size: 16px; font-weight: 700; color: var(--vp-c-text-1, #3c3c3c); margin: 0 0 6px; }
.chat-intro p { font-size: 12px; line-height: 1.5; max-width: 240px; margin: 0; }
.di-intro-greeting {
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--vp-c-text-2, #666);
  max-width: 280px;
  margin: 8px auto 0;
  text-align: center;
}
.di-intro-greeting strong {
  color: var(--vp-c-text-1, #3c3c3c);
  font-weight: 600;
}


/* ─── Messages ────────────────────────────────────────────── */
.message-wrapper {
  display: flex;
  width: 100%;
  animation: diMessageSlideIn 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.message-wrapper.user      { justify-content: flex-end; }
.message-wrapper.assistant { justify-content: flex-start; }

@keyframes diMessageSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.message-bubble {
  max-width: 88%; padding: 9px 13px;
  border-radius: 12px; font-size: 13px; line-height: 1.5;
  display: flex; flex-direction: column; gap: 6px;
}
.message-wrapper.user .message-bubble {
  background: var(--vp-c-brand, #3eaf7c);
  color: #fff;
  border-bottom-right-radius: 3px;
}
.message-wrapper.assistant .message-bubble {
  background: var(--vp-c-bg-soft, #f6f6f7);
  color: var(--vp-c-text-1, #3c3c3c);
  border-bottom-left-radius: 3px;
  border: 1px solid var(--vp-c-divider, rgba(60,60,60,0.09));
}
.message-sender-name {
  font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.55;
  display: flex; align-items: center; gap: 5px;
}
.offline-pill {
  font-size: 8px; padding: 1px 4px; border-radius: 3px;
  background: rgba(0,0,0,0.1); font-weight: 500; text-transform: none; letter-spacing: 0;
}

/* ─── Rendered Markdown ───────────────────────────────────── */
.message-content { word-break: break-word; }

.message-content :deep(.md-p)  { margin: 0 0 6px; }
.message-content :deep(.md-p:last-child) { margin-bottom: 0; }
.message-content :deep(.md-h1),
.message-content :deep(.md-h2) { font-size: 14px; font-weight: 700; margin: 10px 0 4px; }
.message-content :deep(.md-h3) { font-size: 13px; font-weight: 700; margin: 8px 0 3px; }
.message-content :deep(.md-h4) { font-size: 12.5px; font-weight: 700; margin: 6px 0 2px; }
.message-content :deep(.md-ul),
.message-content :deep(.md-ol) { margin: 4px 0 6px; padding-left: 18px; }
.message-content :deep(.md-ul li),
.message-content :deep(.md-ol li) { margin-bottom: 2px; }
.message-content :deep(.md-blockquote) {
  margin: 6px 0; padding: 6px 10px;
  border-left: 3px solid var(--vp-c-brand, #3eaf7c);
  background: rgba(62,175,124,0.06);
  border-radius: 0 6px 6px 0;
  font-style: italic;
  font-size: 12.5px;
}
.message-content :deep(.md-hr) { border: none; border-top: 1px solid var(--vp-c-divider, rgba(60,60,60,0.12)); margin: 10px 0; }

.message-content :deep(.md-inline-code) {
  font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
  font-size: 11.5px; padding: 1.5px 4px; border-radius: 4px;
  background: rgba(0,0,0,0.06); color: var(--vp-c-brand, #3eaf7c);
}
.message-wrapper.user .message-content :deep(.md-inline-code) {
  background: rgba(255,255,255,0.18); color: #fff;
}

.message-content :deep(.md-link) {
  color: var(--vp-c-brand, #3eaf7c); text-decoration: underline; text-underline-offset: 2px;
}
.message-wrapper.user .message-content :deep(.md-link) { color: rgba(255,255,255,0.9); }

/* Code blocks */
.message-content :deep(.code-block-wrapper) {
  margin: 8px 0; border-radius: 8px; overflow: hidden;
  border: 1px solid var(--vp-c-divider, rgba(60,60,60,0.14));
}
.message-content :deep(.code-block-header) {
  display: flex; justify-content: space-between; align-items: center;
  padding: 5px 12px; background: #2a2a2a; color: #999;
}
.message-content :deep(.code-language) { font-size: 10px; font-family: monospace; }
.message-content :deep(.copy-button) {
  display: flex; align-items: center; gap: 4px;
  background: none; border: none; cursor: pointer;
  color: #888; font-size: 10.5px; padding: 2px 4px; border-radius: 4px;
  transition: color 0.12s, background 0.12s;
}
.message-content :deep(.copy-button:hover) { color: #fff; background: rgba(255,255,255,0.08); }
.message-content :deep(.copy-button.copied) { color: #4ade80; }
.message-content :deep(.copy-button .copied-btn-content) { display: none; }
.message-content :deep(.copy-button.copied .copy-btn-content) { display: none; }
.message-content :deep(.copy-button.copied .copied-btn-content) { display: flex; align-items: center; gap: 4px; }
.message-content :deep(pre.code-block) {
  margin: 0; padding: 12px;
  background: #1e1e1e !important; color: #d4d4d4 !important;
  font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
  font-size: 11.5px; overflow-x: auto; line-height: 1.55;
}
/* Syntax tokens */
.message-content :deep(.tok-kw)      { color: #569cd6; font-weight: 600; }
.message-content :deep(.tok-bool)    { color: #569cd6; }
.message-content :deep(.tok-str)     { color: #ce9178; }
.message-content :deep(.tok-comment) { color: #6a9955; font-style: italic; }
.message-content :deep(.tok-key)     { color: #9cdcfe; }

/* Math */
.message-content :deep(.math-display) {
  margin: 10px 0; padding: 10px; overflow-x: auto; text-align: center;
  background: var(--vp-c-bg-soft, #f9f9fa); border-radius: 6px;
}
.message-content :deep(.math-error) { color: #ef4444; font-family: monospace; }

/* Tables */
.message-content :deep(.md-table-wrapper) {
  margin: 10px 0; overflow-x: auto; border-radius: 8px;
  border: 1px solid var(--vp-c-divider, rgba(60,60,60,0.12));
}
.message-content :deep(.md-table) {
  width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;
}
.message-content :deep(.md-thead) {
  background: var(--vp-c-bg-soft, #f6f6f7);
  border-bottom: 1px solid var(--vp-c-divider, rgba(60,60,60,0.12));
}
.message-content :deep(.md-th),
.message-content :deep(.md-td) {
  padding: 6px 10px;
}
.message-content :deep(.md-tr:not(:last-child)) {
  border-bottom: 1px solid var(--vp-c-divider, rgba(60,60,60,0.08));
}
.message-content :deep(.md-tr:hover) {
  background: var(--vp-c-bg-soft, rgba(0,0,0,0.02));
}

/* Media / Images */
.message-content :deep(.content-image) {
  margin: 10px 0; display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: zoom-in;
}
.message-content :deep(.content-image img) {
  max-width: 100%; max-height: 200px; border-radius: 6px; object-fit: cover;
  transition: transform 0.2s ease, max-height 0.2s ease;
  border: 1px solid var(--vp-c-divider, rgba(60,60,60,0.12));
}
.message-content :deep(.content-image.expanded) {
  cursor: zoom-out;
}
.message-content :deep(.content-image.expanded img) {
  max-height: 500px; transform: scale(1.02);
}
.message-content :deep(.content-image figcaption) {
  font-size: 11px; color: var(--vp-c-text-3, #999); text-align: center;
}
.message-content :deep(.image-error) {
  display: flex; align-items: center; gap: 6px; padding: 10px;
  border: 1px dashed var(--vp-c-divider, #e2e2e3); border-radius: 6px;
  font-size: 11px; color: var(--vp-c-text-3, #999);
}
.message-content :deep(.md-inline-img) {
  max-width: 100%; height: auto; border-radius: 4px; margin: 2px 0;
}

/* Videos */
.message-content :deep(.content-video) {
  margin: 10px 0; display: flex; flex-direction: column; gap: 6px;
}
.message-content :deep(.video-player) {
  width: 100%; border-radius: 8px; border: 1px solid var(--vp-c-divider, rgba(60,60,60,0.12));
}
.message-content :deep(.video-download) {
  align-self: flex-start; font-size: 11px; color: var(--vp-c-brand, #3eaf7c); text-decoration: none;
}
.message-content :deep(.video-download:hover) {
  text-decoration: underline;
}

/* YouTube */
.message-content :deep(.youtube-embed) {
  margin: 10px 0; position: relative; border-radius: 8px; overflow: hidden;
  border: 1px solid var(--vp-c-divider, rgba(60,60,60,0.12)); background: #000;
}
.message-content :deep(.youtube-embed.youtube-shorts) {
  max-width: 315px; margin: 10px auto;
}
.message-content :deep(.youtube-placeholder) {
  position: relative; cursor: pointer; aspect-ratio: 16 / 9;
}
.message-content :deep(.youtube-shorts .youtube-placeholder) {
  aspect-ratio: 9 / 16;
}
.message-content :deep(.youtube-thumbnail) {
  width: 100%; height: 100%; object-fit: cover; opacity: 0.8; transition: opacity 0.2s ease;
}
.message-content :deep(.youtube-placeholder:hover .youtube-thumbnail) {
  opacity: 1;
}
.message-content :deep(.youtube-play-button) {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 2; transition: transform 0.2s ease;
}
.message-content :deep(.youtube-placeholder:hover .youtube-play-button) {
  transform: translate(-50%, -50%) scale(1.1);
}

/* Mermaid */
.message-content :deep(.mermaid-container) {
  margin: 10px 0; padding: 12px; background: var(--vp-c-bg, #fff);
  border: 1px solid var(--vp-c-divider, rgba(60,60,60,0.12));
  border-radius: 8px; display: flex; flex-direction: column; align-items: center; overflow-x: auto;
}
.message-content :deep(.mermaid-diagram) { width: 100%; }
.message-content :deep(.mermaid-diagram svg) { display: block; margin: 0 auto; max-width: 100%; height: auto; }
.message-content :deep(.mermaid-loading-hint) { font-size: 11px; color: var(--vp-c-text-3, #999); margin: 4px 0 0; }
.message-content :deep(.mermaid-source) { width: 100%; margin-top: 8px; }
.message-content :deep(.mermaid-source summary) { font-size: 11px; color: var(--vp-c-text-3, #999); cursor: pointer; outline: none; }
.message-content :deep(.mermaid-source pre) { margin-top: 4px; padding: 6px; background: var(--vp-c-bg-soft, #f6f6f7); border-radius: 4px; font-size: 10.5px; }
.message-content :deep(.mermaid-error-banner) { color: #ef4444; font-size: 11px; padding: 4px; }
.message-content :deep(.mermaid-fallback) {
  border: 1px solid #fecaca; background: #fff5f5; padding: 10px; border-radius: 6px; margin: 10px 0;
}

/* Syntax Addition */
.message-content :deep(.tok-num) { color: #b5cea8; }
.message-content :deep(.tok-comment) { color: #6a9955; font-style: italic; }


/* ─── Sources ─────────────────────────────────────────────── */
.sources-list {
  display: flex; flex-direction: column; gap: 5px;
  margin-top: 6px; padding-top: 6px;
  border-top: 1px solid rgba(60,60,60,0.08);
}
.sources-label {
  display: flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.05em; color: var(--vp-c-text-3, #aaa);
}
.sources-pills { display: flex; flex-wrap: wrap; gap: 5px; }
.source-pill {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 8px; border-radius: 99px;
  background: var(--vp-c-bg, #fff);
  border: 1px solid var(--vp-c-divider, rgba(60,60,60,0.14));
  font-size: 11px; color: var(--vp-c-text-2, #555);
  text-decoration: none; max-width: 180px;
  transition: border-color 0.12s, color 0.12s;
  cursor: default;
}
a.source-pill { cursor: pointer; }
a.source-pill:hover { border-color: var(--vp-c-brand, #3eaf7c); color: var(--vp-c-brand, #3eaf7c); }
.source-num {
  width: 14px; height: 14px; border-radius: 50%;
  background: var(--vp-c-bg-soft, #eee); display: flex; align-items: center; justify-content: center;
  font-size: 8px; font-weight: 700; flex-shrink: 0;
}
.source-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ─── Message Actions ─────────────────────────────────────── */
.message-actions { display: flex; gap: 2px; align-self: flex-start; margin-top: 2px; }
.act-btn {
  background: none; border: none; cursor: pointer;
  width: 26px; height: 26px; border-radius: 5px;
  display: flex; align-items: center; justify-content: center;
  color: var(--vp-c-text-3, #bbb);
  transition: background 0.12s, color 0.12s;
}
.act-btn:hover { background: var(--vp-c-bg-soft, #eee); color: var(--vp-c-text-1, #3c3c3c); }
.act-btn.active { color: var(--vp-c-brand, #3eaf7c); background: rgba(62,175,124,0.08); }

/* Loading */
.loading-state-wrapper { padding: 2px 0; }

/* ─── Error Banner ────────────────────────────────────────── */
.error-banner {
  position: absolute; bottom: 80px; left: 14px; right: 14px;
  background: #fef2f2; border: 1px solid #fecaca; color: #991b1b;
  padding: 9px 11px; border-radius: 8px;
  display: flex; align-items: flex-start; gap: 8px; z-index: 10;
  box-shadow: 0 4px 14px rgba(0,0,0,0.08);
}
.error-banner.warning { background: #fffbeb; border-color: #fde68a; color: #92400e; }
.error-icon-svg { flex-shrink: 0; margin-top: 1px; }
.error-details { flex: 1; min-width: 0; }
.error-msg-text  { font-size: 12px; font-weight: 600; margin: 0; }
.error-action-text { font-size: 10.5px; margin: 2px 0 0; opacity: 0.85; }
.error-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.err-report-btn {
  background: none; border: none; cursor: pointer;
  font-size: 10.5px; text-decoration: underline; color: currentColor; opacity: 0.8; padding: 0;
}
.err-dismiss-btn {
  background: none; border: none; cursor: pointer; padding: 3px;
  display: flex; align-items: center; color: currentColor; opacity: 0.7; border-radius: 4px;
}
.err-dismiss-btn:hover { opacity: 1; background: rgba(0,0,0,0.06); }

/* ─── Suggestions ─────────────────────────────────────────── */
.suggestions-area { padding: 0 14px 8px; }

/* ─── Input Area ──────────────────────────────────────────── */
.panel-input-area {
  display: flex; flex-direction: column; gap: 6px;
  padding: 10px 12px 10px;
  border-top: 1px solid var(--vp-c-divider, rgba(60,60,60,0.10));
  background: var(--vp-c-bg, #fff); flex-shrink: 0;
}
.input-row { display: flex; align-items: flex-end; gap: 6px; }
.chat-textarea {
  flex: 1; font-size: 13px; padding: 8px 10px; border-radius: 8px;
  border: 1px solid var(--vp-c-divider, rgba(60,60,60,0.14));
  background: var(--vp-c-bg-soft, #f6f6f7);
  color: var(--vp-c-text-1, #3c3c3c);
  resize: none; max-height: 80px; outline: none;
  font-family: inherit; line-height: 1.4;
  transition: border-color 0.15s, background 0.15s;
}
.chat-textarea:focus { border-color: var(--vp-c-brand, #3eaf7c); background: var(--vp-c-bg, #fff); }
.send-btn {
  width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
  background: var(--vp-c-brand, #3eaf7c); border: none; color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: opacity 0.15s, transform 0.1s;
}
.send-btn:hover:not(:disabled) { opacity: 0.9; transform: scale(1.04); }
.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.panel-footer {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 10px; color: var(--vp-c-text-3, #aaa);
}
.footer-left { display: flex; align-items: center; }
.footer-right { display: flex; align-items: center; }
.cloud-status-btn {
  display: flex; align-items: center; gap: 4px;
  background: none; border: none; cursor: pointer; font-size: 10px;
  color: var(--vp-c-text-3, #aaa); padding: 0; transition: color 0.12s;
}
.cloud-status-btn:hover { color: var(--vp-c-brand, #3eaf7c); }
.powered-by a { color: var(--vp-c-brand, #3eaf7c); text-decoration: none; }
.powered-by a:hover { text-decoration: underline; }

/* ─── Transitions ─────────────────────────────────────────── */
.panel-slide-enter-active,
.panel-slide-leave-active { transition: all 0.38s cubic-bezier(0.34, 1.56, 0.64, 1); }
.panel-slide-enter-from,
.panel-slide-leave-to { opacity: 0; transform: translateY(24px) scale(0.96); }

.slide-enter-active,
.slide-leave-active { transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.22s ease; }
.slide-enter-from,
.slide-leave-to { opacity: 0; transform: translateX(-16px); }

.slide-up-enter-active,
.slide-up-leave-active { transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1); }
.slide-up-enter-from,
.slide-up-leave-to { opacity: 0; transform: translateY(12px); }

/* ─── Mobile fullscreen ───────────────────────────────────── */
@media (max-width: 480px) {
  .depthindex-panel {
    bottom: 0 !important; right: 0 !important;
    width: 100vw !important; height: 100dvh !important;
    max-height: none !important; border-radius: 0 !important;
    border: none !important;
  }
}
/* Message Editing Style */
.message-edit-mode {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
.edit-textarea {
  width: 100%;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider, rgba(60,60,60,0.18));
  background: var(--vp-c-bg, #fff);
  color: var(--vp-c-text-1, #2c3e50);
  font-family: inherit;
  font-size: 13px;
  resize: vertical;
  min-height: 50px;
  outline: none;
}
.edit-textarea:focus {
  border-color: var(--vp-c-brand, #3eaf7c);
}
.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}
.edit-btn {
  padding: 4px 10px;
  font-size: 11px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.12s;
}
.edit-btn:hover {
  opacity: 0.9;
}
.save-btn-edit {
  background: var(--vp-c-brand, #3eaf7c);
  color: #fff;
}
.cancel-btn-edit {
  background: var(--vp-c-bg-mute, #e2e2e3);
  color: var(--vp-c-text-2, #3c3c3c);
}
.user-actions {
  margin-top: 4px;
  justify-content: flex-end;
}

/* ─── Citation Links & References Section ─────────────────── */
.citation-link {
  font-weight: 600;
  color: var(--vp-c-brand, #3eaf7c) !important;
  text-decoration: none;
  padding: 0 2px;
  font-size: 0.85em;
  transition: opacity 0.15s ease;
}
.citation-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}
.references-section {
  margin-top: 18px;
  padding-top: 12px;
  border-top: 1px dashed var(--vp-c-divider, rgba(60,60,60,0.12));
}
.references-section h4 {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3, #767676);
  margin: 0 0 8px 0 !important;
}
.references-list {
  margin: 0 !important;
  padding-left: 18px !important;
  list-style-type: decimal !important;
}
.reference-item {
  font-size: 12px;
  color: var(--vp-c-text-2, #4c4c4c);
  margin-bottom: 4px;
}
.ref-link {
  color: var(--vp-c-brand, #3eaf7c) !important;
  text-decoration: none;
  font-weight: 500;
}
.ref-link:hover {
  text-decoration: underline;
}
.ref-section {
  color: var(--vp-c-text-3, #767676);
  font-size: 0.95em;
}
.context-link {
  color: var(--vp-c-brand, #3eaf7c) !important;
  text-decoration: none;
  font-weight: 700;
  transition: opacity 0.15s ease;
}
.context-link:hover {
  text-decoration: underline;
  opacity: 0.8;
}
/* Citation superscript links */
.cite {
  color: var(--vp-c-brand, #3eaf7c);
  text-decoration: none;
  font-size: 0.72em;
  font-weight: 600;
  vertical-align: super;
  line-height: 0;
  padding: 0 1px;
  border-radius: 2px;
  transition: background 0.15s, color 0.15s;
}
.cite:hover {
  background: rgba(62, 175, 124, 0.12);
  text-decoration: underline;
}
/* Reference list at bottom of answer */
.references-section {
  margin-top: 16px;
  padding: 10px 14px;
  background: var(--vp-c-bg-soft, #f6f6f7);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider, #e2e2e3);
}
.references-section h4 {
  font-size: 11px;
  font-weight: 600;
  color: var(--vp-c-text-3, #767676);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 8px 0;
}
.references-list {
  margin: 0;
  padding-left: 18px;
  list-style-type: decimal;
}
.reference-item {
  font-size: 12px;
  color: var(--vp-c-text-2, #4c4c4c);
  margin-bottom: 4px;
  scroll-margin-top: 80px;
}
.reference-item:target {
  background: rgba(62, 175, 124, 0.08);
  border-radius: 4px;
}
.ref-link {
  color: var(--vp-c-brand, #3eaf7c) !important;
  text-decoration: none;
  font-weight: 500;
}
.ref-link:hover {
  text-decoration: underline;
}
.ref-section {
  color: var(--vp-c-text-3, #767676);
  font-size: 0.9em;
  margin-left: 4px;
}
</style>

