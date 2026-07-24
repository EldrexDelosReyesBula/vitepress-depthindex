<template>
  <!-- Analytics consent banner — only shown when no decision has been stored -->
  <Transition name="di-consent">
    <div
      v-if="showBanner"
      class="di-consent-banner"
      role="dialog"
      aria-label="Analytics consent"
      aria-live="polite"
    >
      <div class="di-consent-inner">
        <div class="di-consent-text">
          <span class="di-consent-icon">📊</span>
          <span>
            This site uses <strong>Vercel Analytics</strong> to understand how the docs are used.
            No personal data is collected.
            <a
              href="https://vercel.com/docs/analytics/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >Learn more</a>
          </span>
        </div>
        <div class="di-consent-actions">
          <button class="di-consent-btn di-consent-accept" @click="accept">
            Accept
          </button>
          <button class="di-consent-btn di-consent-decline" @click="decline">
            Decline
          </button>
        </div>
      </div>
    </div>
  </Transition>

</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { inject } from '@vercel/analytics'

const STORAGE_KEY = 'depthindex-analytics-consent'

const showBanner = ref(false)
const decided = ref(false)
const consented = ref(false)

const currentLabel = computed(() =>
  consented.value ? 'Analytics: On (click to opt out)' : 'Analytics: Off (click to opt in)'
)

function injectAnalytics() {
  if (typeof window !== 'undefined') {
    inject({ mode: 'auto' })
  }
}

function accept() {
  localStorage.setItem(STORAGE_KEY, 'true')
  consented.value = true
  decided.value = true
  showBanner.value = false
  injectAnalytics()
}

function decline() {
  localStorage.setItem(STORAGE_KEY, 'false')
  consented.value = false
  decided.value = true
  showBanner.value = false
}

function revoke() {
  if (consented.value) {
    localStorage.setItem(STORAGE_KEY, 'false')
    consented.value = false
    showBanner.value = true
  } else {
    accept()
  }
}

onMounted(() => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === null) {
    showBanner.value = true
    decided.value = false
  } else if (stored === 'true') {
    consented.value = true
    decided.value = true
    injectAnalytics()
  } else {
    consented.value = false
    decided.value = true
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('depthindex:analytics-consent-changed', ((e: CustomEvent) => {
      const isConsented = e.detail?.consented
      consented.value = isConsented
      decided.value = true
      showBanner.value = false
      if (isConsented) {
        injectAnalytics()
      }
    }) as EventListener)
  }
})
</script>

<style scoped>
/* ── Consent Banner ── */
.di-consent-banner {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  width: min(560px, calc(100vw - 2rem));
  background: var(--vp-c-bg-elv, #ffffff);
  border: 1px solid var(--vp-c-divider, #e2e8f0);
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 1rem 1.25rem;
  backdrop-filter: blur(12px);
}

.dark .di-consent-banner {
  background: rgba(30, 30, 46, 0.95);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.di-consent-inner {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.di-consent-text {
  flex: 1;
  min-width: 200px;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--vp-c-text-1, #213547);
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.dark .di-consent-text {
  color: var(--vp-c-text-1, #e2e8f0);
}

.di-consent-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
  margin-top: 1px;
}

.di-consent-text a {
  color: var(--vp-c-brand-1, #6366f1);
  text-decoration: underline;
  margin-left: 0.25rem;
}

.di-consent-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.di-consent-btn {
  padding: 0.45rem 1rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.18s ease;
}

.di-consent-accept {
  background: var(--vp-c-brand-1, #6366f1);
  color: #ffffff;
}

.di-consent-accept:hover {
  background: var(--vp-c-brand-2, #4f46e5);
  transform: translateY(-1px);
}

.di-consent-decline {
  background: var(--vp-c-bg-soft, #f1f5f9);
  color: var(--vp-c-text-1, #213547);
  border: 1px solid var(--vp-c-divider, #e2e8f0);
}

.dark .di-consent-decline {
  background: rgba(255, 255, 255, 0.06);
  color: var(--vp-c-text-1, #e2e8f0);
  border-color: rgba(255, 255, 255, 0.1);
}

.di-consent-decline:hover {
  background: var(--vp-c-bg-elv, #e8ecf1);
  transform: translateY(-1px);
}

/* ── Revoke / Settings Toggle ── */
.di-consent-revoke {
  position: fixed;
  bottom: 1rem;
  right: 1.25rem;
  z-index: 9998;
}

.di-consent-revoke-btn {
  font-size: 0.75rem;
  color: var(--vp-c-text-3, #94a3b8);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  transition: color 0.18s, background 0.18s;
}

.di-consent-revoke-btn:hover {
  color: var(--vp-c-text-2, #476582);
  background: var(--vp-c-bg-soft, #f1f5f9);
}

.dark .di-consent-revoke-btn:hover {
  background: rgba(255, 255, 255, 0.06);
}

/* ── Transition ── */
.di-consent-enter-active,
.di-consent-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.di-consent-enter-from,
.di-consent-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(1rem);
}
</style>
