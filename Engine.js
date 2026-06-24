/**
 * ENGINE MODULE
 * Core game loop, delta time, requestAnimationFrame coordination
 */

class GameEngine {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.lastTime = 0;
    this.deltaTime = 0;
    this.maxDelta = 0.05; // Cap delta at 50ms to avoid spiral of death
    this.rafId = null;

    // Subsystems registered to the engine
    this.systems = [];
  }

  /**
   * Register a subsystem with update/render hooks
   * { name, update(dt), render() }
   */
  register(system) {
    this.systems.push(system);
  }

  /**
   * Unregister a subsystem
   */
  unregister(name) {
    this.systems = this.systems.filter(s => s.name !== name);
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }

  /**
   * Stop the game loop
   */
  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Pause the game loop (continues RAF but skips update)
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resume from pause
   */
  resume() {
    this.isPaused = false;
    this.lastTime = performance.now(); // Reset to avoid large delta
  }

  /**
   * Main tick function - called every animation frame
   */
  tick(timestamp) {
    if (!this.isRunning) return;

    this.deltaTime = Math.min((timestamp - this.lastTime) / 1000, this.maxDelta);
    this.lastTime = timestamp;

    if (!this.isPaused) {
      this.update(this.deltaTime);
    }

    this.render();

    this.rafId = requestAnimationFrame(this.tick.bind(this));
  }

  /**
   * Update all registered systems
   */
  update(dt) {
    for (const system of this.systems) {
      if (system.update) {
        system.update(dt);
      }
    }
  }

  /**
   * Render all registered systems
   */
  render() {
    for (const system of this.systems) {
      if (system.render) {
        system.render();
      }
    }
  }

  /**
   * Is the engine currently running?
   */
  get running() {
    return this.isRunning;
  }

  /**
   * Is the engine currently paused?
   */
  get paused() {
    return this.isPaused;
  }

  /**
   * Get current delta time
   */
  getDeltaTime() {
    return this.deltaTime;
  }
}
