export function registerServiceWorker(enabled: boolean = true): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Skip in Vite dev mode — SW script isn't served; the error is expected and not actionable
  const isDev = (import.meta as any).env?.DEV === true || (import.meta as any).env?.MODE === 'development';
  if (isDev) {
    return;
  }

  if (!enabled) {
    // Unregister existing service worker if disabled
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (const registration of registrations) {
        if (registration.active && registration.active.scriptURL.includes('depthindex-sw.js')) {
          registration.unregister();
          console.log('[depthindex] Service worker unregistered.');
        }
      }
    });
    return;
  }

  window.addEventListener('load', () => {
    const base = (import.meta as any).env?.BASE_URL || '/';
    const cleanBase = base.endsWith('/') ? base : base + '/';
    navigator.serviceWorker
      .register(`${cleanBase}depthindex-sw.js`)
      .then(registration => {
        console.log('[depthindex] Service worker registered successfully:', registration.scope);
      })
      .catch(error => {
        // MIME type / SecurityError = SW script not yet generated (normal before first build)
        const isMimeError = error?.message?.includes('MIME') || error?.name === 'SecurityError';
        if (isMimeError) {
          console.info('[depthindex] Service worker not available (build required to enable offline mode).');
        } else {
          console.warn('[depthindex] Service worker registration failed:', error);
        }
      });
  });
}
