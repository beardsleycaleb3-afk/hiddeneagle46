/**
 * RENDERER MODULE
 * Tile rendering, viewport culling, sprite batching, camera system
 * Canvas2D only - optimized for Android Chrome
 */

class Renderer {
  constructor(canvas, tileSize = 32) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tileSize = tileSize;

    this.width = canvas.width;
    this.height = canvas.height;

    // Camera position in pixels
    this.cameraX = 0;
    this.cameraY = 0;

    // Camera lerp speed
    this.lerpSpeed = 0.18;

    // Camera target
    this.targetCamX = 0;
    this.targetCamY = 0;

    // Scanline effect frame counter
    this.frame = 0;

    // DPR for sharp rendering
    this.dpr = window.devicePixelRatio || 1;

    this.resize();
  }

  /**
   * Resize canvas to match device screen
   */
  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.scale(this.dpr, this.dpr);
  }

  /**
   * Clear canvas with background color
   */
  clear(color = '#000500') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Render a single emoji tile at world coordinates
   */
  renderTile(worldX, worldY, emoji) {
    const screenX = Math.floor((worldX * this.tileSize) - this.cameraX);
    const screenY = Math.floor((worldY * this.tileSize) - this.cameraY);

    // Viewport culling - skip offscreen tiles
    if (
      screenX < -this.tileSize || screenX > this.width ||
      screenY < -this.tileSize || screenY > this.height
    ) return;

    this.ctx.font = `${this.tileSize}px system-ui, -apple-system, sans-serif`;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'alphabetic';
    this.ctx.fillText(emoji, screenX + 2, screenY + this.tileSize - 2);
  }

  /**
   * Render grid (2D array) with optional world offset
   */
  renderGrid(grid, offsetX = 0, offsetY = 0) {
    // Calculate visible tile range for culling
    const startX = Math.max(0, Math.floor(this.cameraX / this.tileSize) - 1);
    const startY = Math.max(0, Math.floor(this.cameraY / this.tileSize) - 1);
    const endX = Math.min(
      grid[0]?.length || 0,
      Math.ceil((this.cameraX + this.width) / this.tileSize) + 1
    );
    const endY = Math.min(
      grid.length,
      Math.ceil((this.cameraY + this.height) / this.tileSize) + 1
    );

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const tile = grid[y]?.[x];
        if (!tile) continue;
        this.renderTile(offsetX + x, offsetY + y, tile);
      }
    }
  }

  /**
   * Render grid lines overlay (for editor)
   */
  renderGrid_lines(color = 'rgba(0, 255, 0, 0.08)') {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 0.5;

    const startX = Math.floor(this.cameraX / this.tileSize) * this.tileSize - this.cameraX;
    const startY = Math.floor(this.cameraY / this.tileSize) * this.tileSize - this.cameraY;

    for (let x = startX; x <= this.width; x += this.tileSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(Math.floor(x), 0);
      this.ctx.lineTo(Math.floor(x), this.height);
      this.ctx.stroke();
    }

    for (let y = startY; y <= this.height; y += this.tileSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, Math.floor(y));
      this.ctx.lineTo(this.width, Math.floor(y));
      this.ctx.stroke();
    }
  }

  /**
   * Render player sprite with glow
   */
  renderPlayer(worldX, worldY, emoji, glowColor = '#0f0') {
    const screenX = Math.floor((worldX * this.tileSize) - this.cameraX);
    const screenY = Math.floor((worldY * this.tileSize) - this.cameraY);

    const glowPulse = 8 + 4 * Math.sin(this.frame * 0.08);
    this.ctx.shadowColor = glowColor;
    this.ctx.shadowBlur = glowPulse;

    this.ctx.font = `${this.tileSize}px system-ui, -apple-system, sans-serif`;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'alphabetic';
    this.ctx.fillText(emoji, screenX + 2, screenY + this.tileSize - 2);

    this.ctx.shadowBlur = 0;
  }

  /**
   * Render scanlines overlay (CRT effect)
   */
  renderScanlines() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    for (let y = 0; y < this.height; y += 2) {
      this.ctx.fillRect(0, y, this.width, 1);
    }

    // Moving scan line
    const scanY = (this.frame * 3) % this.height;
    this.ctx.fillStyle = 'rgba(0, 255, 0, 0.04)';
    this.ctx.fillRect(0, scanY, this.width, 2);
  }

  /**
   * Render text on screen
   */
  renderText(text, x, y, options = {}) {
    const {
      color = '#0f0',
      size = 12,
      align = 'left',
      baseline = 'top',
      glow = false,
    } = options;

    this.ctx.fillStyle = color;
    this.ctx.font = `${size}px 'Courier New', monospace`;
    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;

    if (glow) {
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 8;
    }

    this.ctx.fillText(text, x, y);

    if (glow) {
      this.ctx.shadowBlur = 0;
    }
  }

  /**
   * Render rectangle outline
   */
  renderRect(x, y, w, h, color = '#0f0', lineWidth = 1) {
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeRect(x, y, w, h);
  }

  /**
   * Render filled rectangle
   */
  renderFillRect(x, y, w, h, color = '#0f0') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  /**
   * Set camera to target position (instant)
   */
  setCameraPosition(x, y) {
    this.cameraX = x;
    this.cameraY = y;
    this.targetCamX = x;
    this.targetCamY = y;
  }

  /**
   * Set camera target for lerp
   */
  setCameraTarget(x, y) {
    this.targetCamX = x;
    this.targetCamY = y;
  }

  /**
   * Center camera on a world tile
   */
  centerCameraOn(tileX, tileY) {
    this.targetCamX = (tileX * this.tileSize) - (this.width / 2) + (this.tileSize / 2);
    this.targetCamY = (tileY * this.tileSize) - (this.height / 2) + (this.tileSize / 2);
  }

  /**
   * Update camera lerp
   */
  updateCamera() {
    this.cameraX += (this.targetCamX - this.cameraX) * this.lerpSpeed;
    this.cameraY += (this.targetCamY - this.cameraY) * this.lerpSpeed;
    this.frame++;
  }

  /**
   * Convert screen coordinates to world tile
   */
  screenToWorld(screenX, screenY) {
    return {
      x: Math.floor((screenX + this.cameraX) / this.tileSize),
      y: Math.floor((screenY + this.cameraY) / this.tileSize),
    };
  }

  /**
   * Get canvas 2D context
   */
  getContext() {
    return this.ctx;
  }
}
