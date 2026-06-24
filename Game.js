/**
 * GAME MODULE
 * Game rules, cascade-based collision, XP/progression, win/lose
 */

class Game {
  constructor(vm, rom, manager) {
    this.vm = vm;
    this.rom = rom;
    this.manager = manager;
    this.currentGrid = null;
    this.currentLevel = 1;
    this.playerEmoji = '🧑';
    this.paused = false;

    // Cascade accumulators for player stats
    this.xpAccumulator = new Accumulator(0);
    this.healthAccumulator = new Accumulator(100);
  }

  /**
   * Load a level into the game
   */
  loadLevel(levelNum) {
    this.currentLevel = levelNum;
    this.currentGrid = LevelROM.loadLevel(levelNum);
    this.vm.setState('currentLevel', levelNum);
    this.spawnPlayer();
  }

  /**
   * Spawn player at default start position
   */
  spawnPlayer() {
    this.vm.setState('playerX', 1);
    this.vm.setState('playerY', 1);
    this.vm.setState('playerHealth', 100);
    this.healthAccumulator.reset(100);
    this.xpAccumulator.reset(0);
  }

  /**
   * Try to move player in direction dx, dy
   * Returns { moved, tile, event }
   */
  tryMove(dx, dy) {
    const x = this.vm.getState('playerX') + dx;
    const y = this.vm.getState('playerY') + dy;

    // Bounds check
    if (x < 0 || y < 0 || x >= WORLD_WIDTH || y >= WORLD_HEIGHT) {
      return { moved: false, tile: null, event: 'bounds' };
    }

    const tile = LevelROM.getTile(this.currentGrid, x, y);

    // Wall collision
    if (LevelROM.isWall(this.currentLevel, tile)) {
      // Cascade collision: player XP ⊗ wall value (0 = preservation)
      const collisionResult = CascadeAlgebra.collide(
        this.vm.getState('playerXP'), 0
      );
      return { moved: false, tile, event: 'wall', collisionResult };
    }

    // Move player
    this.vm.setState('playerX', x);
    this.vm.setState('playerY', y);

    // XP gain per step using cascade
    const currentXP = this.xpAccumulator.getValue();
    const newXP = this.xpAccumulator.cascadeAndFold(1);
    this.vm.setState('playerXP', newXP);

    return { moved: true, tile, event: 'move', xpGained: newXP - currentXP };
  }

  /**
   * Apply cascade-based damage to player
   */
  applyDamage(amount) {
    const current = this.healthAccumulator.getValue();
    const newHealth = Math.max(0, current - amount);
    this.healthAccumulator.reset(newHealth);
    this.vm.setState('playerHealth', CascadeAlgebra.fold(newHealth));

    if (newHealth <= 0) {
      return { alive: false, health: 0 };
    }

    return { alive: true, health: newHealth };
  }

  /**
   * Apply cascade-based healing to player
   */
  applyHeal(amount) {
    const current = this.healthAccumulator.getValue();
    const newHealth = Math.min(100, current + amount);
    this.healthAccumulator.reset(newHealth);
    this.vm.setState('playerHealth', CascadeAlgebra.fold(newHealth));
    return { health: newHealth };
  }

  /**
   * Award XP using cascade
   */
  awardXP(amount) {
    const newXP = this.xpAccumulator.cascadeAndFold(amount);
    this.vm.setState('playerXP', newXP);
    return newXP;
  }

  /**
   * Get player world position
   */
  getPlayerPosition() {
    return {
      x: this.vm.getState('playerX'),
      y: this.vm.getState('playerY'),
    };
  }

  /**
   * Get player stats
   */
  getPlayerStats() {
    return {
      xp: this.vm.getState('playerXP'),
      health: this.vm.getState('playerHealth'),
      level: this.currentLevel,
      position: this.getPlayerPosition(),
      cascadeReport: Translator.report(this.vm.getState('playerXP')),
    };
  }

  /**
   * Is the player alive?
   */
  isAlive() {
    return this.vm.getState('playerHealth') > 0;
  }

  /**
   * Update game state (called each frame)
   */
  update(dt) {
    if (this.paused) return;
    this.vm.validateState();
  }

  /**
   * Reset game to initial state
   */
  reset() {
    this.vm.reset();
    this.xpAccumulator.reset(0);
    this.healthAccumulator.reset(100);
    this.spawnPlayer();
  }
}
