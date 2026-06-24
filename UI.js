/**
 * UI MODULE
 * HUD management, modals, overlays, status displays
 * Touch-only, Android Chrome oriented
 */

class UI {
  constructor() {
    this.elements = {};
    this.modals = [];
    this.toasts = [];
    this.currentMode = 'editor'; // editor | play | menu
  }

  /**
   * Cache a DOM element by ID
   */
  cache(id) {
    if (!this.elements[id]) {
      this.elements[id] = document.getElementById(id);
    }
    return this.elements[id];
  }

  /**
   * Update the text content of a cached element
   */
  setText(id, text) {
    const el = this.cache(id);
    if (el) el.textContent = text;
  }

  /**
   * Update the inner HTML of a cached element
   */
  setHTML(id, html) {
    const el = this.cache(id);
    if (el) el.innerHTML = html;
  }

  /**
   * Show element
   */
  show(id) {
    const el = this.cache(id);
    if (el) el.style.display = '';
  }

  /**
   * Hide element
   */
  hide(id) {
    const el = this.cache(id);
    if (el) el.style.display = 'none';
  }

  /**
   * Toggle element visibility
   */
  toggle(id) {
    const el = this.cache(id);
    if (!el) return;
    el.style.display = el.style.display === 'none' ? '' : 'none';
  }

  /**
   * Update the HUD with player stats
   */
  updateHUD(stats) {
    this.setText('fpsDisplay', stats.fps || '60');
    this.setText('playerXP', stats.xp || '0');
    this.setText('levelDisplay', stats.level || '1');
    this.setText('modeDisplay', (this.currentMode || 'EDITOR').toUpperCase());
  }

  /**
   * Show a modal dialog
   * @param {string} title
   * @param {string} content
   * @param {Array} buttons - [{label, fn, primary}]
   */
  showModal(title, content, buttons = []) {
    const modal = document.getElementById('modal');
    if (!modal) return;

    this.setText('modalTitle', title);
    this.setText('modalContent', content);

    const btnContainer = document.getElementById('modalButtons');
    if (btnContainer) {
      btnContainer.innerHTML = '';
      buttons.forEach(b => {
        const btn = document.createElement('button');
        btn.className = 'btn' + (b.primary ? '' : ' secondary');
        btn.textContent = b.label;
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          b.fn && b.fn();
          this.hideModal();
        });
        btnContainer.appendChild(btn);
      });
    }

    modal.classList.remove('hidden');
    this.modals.push(modal);
  }

  /**
   * Hide active modal
   */
  hideModal() {
    const modal = document.getElementById('modal');
    if (modal) modal.classList.add('hidden');
    this.modals.pop();
  }

  /**
   * Show a toast notification
   */
  showToast(message, duration = 2000) {
    const existing = document.getElementById('toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 200px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 20, 0, 0.95);
      border: 1px solid #0f0;
      color: #0f0;
      padding: 8px 20px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      text-shadow: 0 0 8px rgba(0,255,0,0.5);
      z-index: 500;
      pointer-events: none;
      white-space: nowrap;
      letter-spacing: 1px;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * Build level theme selector buttons
   */
  buildLevelThemeSelector(containerId, themes, currentLevel, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    Object.entries(themes).forEach(([num, theme]) => {
      const btn = document.createElement('button');
      btn.className = 'btn' + (parseInt(num) === currentLevel ? '' : ' secondary');
      btn.textContent = num;
      btn.style.cssText = 'min-width: 100%; min-height: 44px; font-size: 14px;';
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        onSelect(parseInt(num));
        this.buildLevelThemeSelector(containerId, themes, parseInt(num), onSelect);
      });
      container.appendChild(btn);
    });
  }

  /**
   * Build tile palette buttons
   */
  buildTilePalette(containerId, tiles, currentTile, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    tiles.forEach(tile => {
      const btn = document.createElement('button');
      btn.className = 'btn' + (tile === currentTile ? '' : ' secondary');
      btn.textContent = tile;
      btn.style.cssText = 'min-height: 52px; font-size: 28px;';
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        onSelect(tile);
        this.buildTilePalette(containerId, tiles, tile, onSelect);
      });
      container.appendChild(btn);
    });
  }

  /**
   * Switch UI mode (editor / play / menu)
   */
  setMode(mode) {
    this.currentMode = mode;

    // Show/hide UI sections
    const editorUI = document.getElementById('editorUI');
    const playUI = document.getElementById('playUI');

    if (editorUI) editorUI.style.display = mode === 'build' ? 'block' : 'none';
    if (playUI) playUI.style.display = mode === 'play' ? 'block' : 'none';

    // Update tab styles
    document.querySelectorAll('[data-mode]').forEach(btn => {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle('active', active);
    });
  }

  /**
   * Update mode display label
   */
  updateModeLabel(mode) {
    const labels = {
      editor: 'EDITOR',
      build: 'BUILD',
      play: 'PLAY',
      menu: 'MENU',
    };
    this.setText('modeDisplay', labels[mode] || mode.toUpperCase());
  }
}
