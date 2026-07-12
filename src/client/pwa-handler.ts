export function registerServiceWorker(enabled: boolean = true): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
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
    navigator.serviceWorker
      .register('/depthindex-sw.js')
      .then(registration => {
        console.log('[depthindex] Service worker registered successfully:', registration.scope);
      })
      .catch(error => {
        console.error('[depthindex] Service worker registration failed:', error);
      });
  });
}
