/**
 * LEVEL ROM MODULE
 * Level loading, tile encoding, theme management, save/load
 * The "cartridge" system for Sultan-47
 */

const LEVEL_THEMES = {
  1:  { name: 'Chromatic',  walls: ['⬜','⬛','🟥'], floors: ['🟪','⬛','⬜'], desc: 'Classic monochrome' },
  2:  { name: 'Crimson',    walls: ['⬛','🟥','🟧'], floors: ['⬜','🟦','🟪'], desc: 'Red and blue contrast' },
  3:  { name: 'Sunset',     walls: ['🟧','🟨','🟩'], floors: ['⬜','🟦','⬛'], desc: 'Warm and verdant' },
  4:  { name: 'Tundra',     walls: ['🟦','⬜','⬛'], floors: ['🟧','🟩','🟨'], desc: 'Ice and earth' },
  5:  { name: 'Twilight',   walls: ['🟦','🟪','⬜'], floors: ['⬛','🟥','🟧'], desc: 'Purple night' },
  6:  { name: 'Void',       walls: ['🟪','⬛','⬜'], floors: ['⬜','🟥','⬛'], desc: 'Dark and stark' },
  7:  { name: 'Synth',      walls: ['🎚️','🎹','🎞️'], floors: ['🏜️','🌄','🌅'], desc: 'Retro vibes' },
  8:  { name: 'Traffic',    walls: ['🚥','🚦','🥅'], floors: ['🌫️','🌠','🌌'], desc: 'Signal and signal' },
  9:  { name: 'Elemental',  walls: ['🔥','❄️','🌀'], floors: ['🛣️','🗾','🌇'], desc: 'Forces of nature' },
  10: { name: 'Celestial',  walls: ['⭐','🪨','🍀'], floors: ['🎆','🎇','🎑'], desc: 'Stars and earth' },
};

const WORLD_WIDTH  = 32;
const WORLD_HEIGHT = 24;
const STORAGE_KEY  = 'hiddeneagle46_levels_v1';

class LevelROM {
  /**
   * Get theme config for a level number
   */
  static getTheme(levelNum) {
    return LEVEL_THEMES[levelNum] || LEVEL_THEMES[1];
  }

  /**
   * Get all themes
   */
  static getAllThemes() {
    return LEVEL_THEMES;
  }

  /**
   * Create a blank level grid filled with the first floor tile
   */
  static createBlankLevel(levelNum) {
    const theme = this.getTheme(levelNum);
    return Array(WORLD_HEIGHT)
      .fill(null)
      .map(() => Array(WORLD_WIDTH).fill(theme.floors[0]));
  }

  /**
   * Load a level from localStorage (falls back to blank)
   */
  static loadLevel(levelNum) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return this.createBlankLevel(levelNum);

      const all = JSON.parse(stored);
      if (all[levelNum]) return all[levelNum];
    } catch (e) {
      console.warn('LevelROM.loadLevel failed:', e);
    }
    return this.createBlankLevel(levelNum);
  }

  /**
   * Save a level to localStorage
   */
  static saveLevel(levelNum, grid) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const all = stored ? JSON.parse(stored) : {};
      all[levelNum] = grid;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      return true;
    } catch (e) {
      console.warn('LevelROM.saveLevel failed:', e);
      return false;
    }
  }

  /**
   * Delete a saved level
   */
  static deleteLevel(levelNum) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const all = JSON.parse(stored);
      delete all[levelNum];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch (e) {
      console.warn('LevelROM.deleteLevel failed:', e);
    }
  }

  /**
   * Check if a level has been saved
   */
  static hasSavedLevel(levelNum) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return false;
      const all = JSON.parse(stored);
      return !!all[levelNum];
    } catch (e) {
      return false;
    }
  }

  /**
   * Export all levels as JSON blob
   */
  static exportAll() {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? stored : '{}';
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hiddeneagle46_levels_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Import levels from JSON string
   */
  static importAll(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('LevelROM.importAll failed:', e);
      return false;
    }
  }

  /**
   * Get tile at world coordinates
   */
  static getTile(grid, x, y) {
    if (x < 0 || y < 0 || x >= WORLD_WIDTH || y >= WORLD_HEIGHT) return null;
    return grid[y]?.[x] || null;
  }

  /**
   * Set tile at world coordinates
   */
  static setTile(grid, x, y, tile) {
    if (x < 0 || y < 0 || x >= WORLD_WIDTH || y >= WORLD_HEIGHT) return false;
    grid[y][x] = tile;
    return true;
  }

  /**
   * Check if a tile is a wall (blocks movement)
   */
  static isWall(levelNum, tile) {
    const theme = this.getTheme(levelNum);
    return theme.walls.includes(tile);
  }

  /**
   * Check if a tile is a floor (walkable)
   */
  static isFloor(levelNum, tile) {
    const theme = this.getTheme(levelNum);
    return theme.floors.includes(tile);
  }

  /**
   * Seed a level procedurally using cascade algebra
   * Uses cascadeValue to determine wall/floor pattern
   */
  static seedLevel(levelNum, seed) {
    const theme = this.getTheme(levelNum);
    const grid = this.createBlankLevel(levelNum);

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let x = 0; x < WORLD_WIDTH; x++) {
        const cascadeResult = CascadeAlgebra.cascade(seed, x, y);
        const stable = CascadeAlgebra.fold(cascadeResult);
        const isWall = stable % 3 === 0;

        if (isWall) {
          const wallIdx = stable % theme.walls.length;
          grid[y][x] = theme.walls[wallIdx];
        } else {
          const floorIdx = stable % theme.floors.length;
          grid[y][x] = theme.floors[floorIdx];
        }
      }
    }

    // Always clear a spawn area
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        grid[1 + dy][1 + dx] = theme.floors[0];
      }
    }

    return grid;
  }
}
