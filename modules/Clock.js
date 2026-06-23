/**
 * CLOCK MODULE
 * Frame timing, FPS tracking, performance metrics
 */

class Clock {
  constructor() {
    this.frameCount = 0;
    this.fps = 60;
    this.lastFpsUpdate = performance.now();
    this.elapsedTime = 0;
    this.deltaTime = 0;
  }

  tick(deltaTime) {
    this.frameCount++;
    this.elapsedTime += deltaTime;
    this.deltaTime = deltaTime;

    const now = performance.now();
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  getFPS() {
    return this.fps;
  }

  getDeltaTime() {
    return this.deltaTime;
  }

  getElapsedSeconds() {
    return this.elapsedTime;
  }

  getFrameCount() {
    return this.frameCount;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
