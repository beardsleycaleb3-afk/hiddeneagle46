/**
 * ORCHESTRATOR MODULE
 * Composes all subsystems, routes events, manages lifecycle
 */

class Orchestrator {
  constructor(canvas) {
    // Instantiate all subsystems
    this.canvas      = canvas;
    this.engine      = new GameEngine();
    this.clock       = new Clock();
    this.vm          = new GameVM();
    this.accumulator = new Accumulator(0);
    this.translator  = Translator;
    this.acceptor    = new Acceptor();
    this.renderer    = new Renderer(canvas);
    this.ui          = new UI();
    this.game        = new Game(this.vm, LevelROM, this);

    // App state
    this.mode        = 'build'; // build | play
    this.currentLevel = 1;
    this.currentTile  = null;
    this.currentGrid  = null;

    this.initialized = false;
  }

  /**
   * Initialize the full system
   */
  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Load first level
    this.currentGrid = LevelROM.loadLevel(this.currentLevel);
    this.currentTile = LevelROM.getTheme(this.currentLevel).walls[0];

    // Build initial UI
    this.ui.buildLevelThemeSelector(
      'levelThemesContainer',
      LevelROM.getAllThemes(),
      this.currentLevel,
      (num) => this.switchLevel(num)
    );

    this.ui.buildTilePalette(
      'tileWallsContainer',
      LevelROM.getTheme(this.currentLevel).walls,
      this.currentTile,
      (tile) => { this.currentTile = tile; }
    );

    // Wire acceptor to D-pad
    this.acceptor.bindDpad({
      up:    'upBtn',
      down:  'downBtn',
      left:  'leftBtn',
      right: 'rightBtn',
    });

    // Listen to move events
    this.acceptor.on('move', ({ dx, dy }) => {
      if (this.mode === 'play') {
        const result = this.game.tryMove(dx, dy);
        this.updateHUD();
        if (!result.moved && result.event === 'wall') {
          this.ui.showToast('🚫 WALL');
        }
      }
    });

    // Listen to tap events (for editor painting)
    this.acceptor.on('tap', ({ x, y }) => {
      if (this.mode === 'build') {
        const world = this.renderer.screenToWorld(x, y);
        if (this.currentTile) {
          LevelROM.setTile(this.currentGrid, world.x, world.y, this.currentTile);
        }
      }
    });

    // Bind canvas for tap paint
    this.acceptor.bind(this.canvas);

    // Wire toolbar buttons
    this.wireButtons();

    // Register engine systems
    this.engine.register({
      name: 'orchestrator',
      update: (dt) => this.update(dt),
      render: () => this.render(),
    });

    // Handle window resize
    window.addEventListener('resize', () => this.renderer.resize());

    // Start engine
    this.engine.start();
  }

  /**
   * Wire up all toolbar and UI buttons
   */
  wireButtons() {
    // Mode tabs
    document.querySelectorAll('[data-mode]').forEach(btn => {
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.switchMode(btn.dataset.mode);
      });
    });

    // Center/reset button
    const centerBtn = document.getElementById('centerBtn');
    if (centerBtn) {
      centerBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.game.spawnPlayer();
        this.renderer.setCameraPosition(0, 0);
        this.ui.showToast('🔄 RESET');
      });
    }

    // Save button
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
      saveBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const ok = LevelROM.saveLevel(this.currentLevel, this.currentGrid);
        this.ui.showToast(ok ? '💾 SAVED' : '❌ SAVE FAILED');
      });
    }

    // Clear button
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.ui.showModal(
          '🗑️ CLEAR LEVEL',
          `Erase Level ${this.currentLevel}?\nCannot be undone.`,
          [
            { label: 'CLEAR', primary: true, fn: () => {
              this.currentGrid = LevelROM.createBlankLevel(this.currentLevel);
              this.ui.showToast('🗑️ CLEARED');
            }},
            { label: 'CANCEL' },
          ]
        );
      });
    }

    // Pause/Exit in play mode
    const pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) {
      pauseBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (this.engine.paused) {
          this.engine.resume();
          this.ui.showToast('▶ RESUMED');
        } else {
          this.engine.pause();
          this.ui.showToast('⏸ PAUSED');
        }
      });
    }

    const exitBtn = document.getElementById('exitBtn');
    if (exitBtn) {
      exitBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.switchMode('build');
      });
    }
  }

  /**
   * Switch between build and play modes
   */
  switchMode(mode) {
    this.mode = mode;
    this.ui.setMode(mode);
    this.ui.updateModeLabel(mode);

    if (mode === 'play') {
      this.game.loadLevel(this.currentLevel);
      this.renderer.centerCameraOn(1, 1);
    }

    if (mode === 'build') {
      this.renderer.setCameraPosition(0, 0);
      this.engine.resume();
    }
  }

  /**
   * Switch to a different level
   */
  switchLevel(levelNum) {
    this.currentLevel = levelNum;
    this.currentGrid = LevelROM.loadLevel(levelNum);
    const theme = LevelROM.getTheme(levelNum);
    this.currentTile = theme.walls[0];

    this.ui.buildTilePalette(
      'tileWallsContainer',
      theme.walls,
      this.currentTile,
      (tile) => { this.currentTile = tile; }
    );

    this.vm.setState('currentLevel', levelNum);
    this.updateHUD();
    this.ui.showToast(`LEVEL ${levelNum}: ${theme.name.toUpperCase()}`);
  }

  /**
   * Update HUD with current game state
   */
  updateHUD() {
    this.ui.updateHUD({
      fps: this.clock.getFPS(),
      xp: this.vm.getState('playerXP'),
      level: this.currentLevel,
    });
  }

  /**
   * Main update - called by engine each frame
   */
  update(dt) {
    this.clock.tick(dt);
    this.vm.validateState();
    this.game.update(dt);

    if (this.mode === 'play') {
      const pos = this.game.getPlayerPosition();
      this.renderer.centerCameraOn(pos.x, pos.y);
    }

    this.renderer.updateCamera();
    this.updateHUD();
  }

  /**
   * Main render - called by engine each frame
   */
  render() {
    this.renderer.clear();

    // Render grid
    if (this.currentGrid) {
      this.renderer.renderGrid(this.currentGrid);
    }

    // Render grid lines in build mode
    if (this.mode === 'build') {
      this.renderer.renderGrid_lines();
    }

    // Render player in play mode
    if (this.mode === 'play') {
      const pos = this.game.getPlayerPosition();
      this.renderer.renderPlayer(pos.x, pos.y, '🧑');
    }

    // CRT scanlines
    this.renderer.renderScanlines();
  }
}
