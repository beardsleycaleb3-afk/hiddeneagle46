/**
 * APP.JS - ENTRY POINT
 * Bootstrap, service worker registration, initialization
 */

class Application {
  constructor() {
    this.orchestrator = null;
    this.isOnline = navigator.onLine;
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('[SW] Registered:', registration.scope);
    } catch (error) {
      console.warn('[SW] Registration failed:', error.message);
    }
  }

  /**
   * Initialize the application
   */
  async init() {
    // Register service worker
    await this.registerServiceWorker();

    // Get canvas
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
      console.error('[App] No canvas element found');
      return;
    }

    // Create and initialize orchestrator
    this.orchestrator = new Orchestrator(canvas);
    this.orchestrator.init();

    // Online/offline listeners
    window.addEventListener('online', () => {
      this.isOnline = true;
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Prevent rubber-band scroll on iOS (not needed but harmless on Android)
    document.addEventListener('touchmove', (e) => {
      if (e.target === canvas) e.preventDefault();
    }, { passive: false });

    console.log('[App] HIDDENEAGLE46 initialized');
  }
}

// Bootstrap on load
window.addEventListener('load', () => {
  const app = new Application();
  app.init();
});
