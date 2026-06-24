/**
 * ACCEPTOR MODULE
 * Touch input parsing, D-pad state, gesture recognition
 * Android Chrome only - no mouse, no keyboard, no desktop fallbacks
 */

class Acceptor {
  constructor() {
    this.touchState = {
      active: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      dx: 0,
      dy: 0,
      startTime: 0,
      duration: 0,
    };

    this.buttons = {
      up: false,
      down: false,
      left: false,
      right: false,
      a: false,
      b: false,
      start: false,
      select: false,
    };

    this.listeners = {};
    this.holdTimers = {};
    this.holdInterval = null;
    this.HOLD_DELAY = 280;     // ms before hold repeat starts
    this.HOLD_REPEAT = 110;    // ms between hold repeats
    this.TAP_THRESHOLD = 200;  // ms max for a tap
    this.SWIPE_THRESHOLD = 30; // px min for a swipe
  }

  /**
   * Bind to canvas and buttons
   */
  bind(canvas) {
    canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    canvas.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: false });
    canvas.addEventListener('touchcancel', (e) => this.onTouchCancel(e), { passive: false });
  }

  /**
   * Bind D-pad button elements
   */
  bindDpad(ids) {
    const map = {
      up: [0, -1],
      down: [0, 1],
      left: [-1, 0],
      right: [1, 0],
    };

    Object.entries(ids).forEach(([direction, elementId]) => {
      const el = document.getElementById(elementId);
      if (!el || !map[direction]) return;

      const [dx, dy] = map[direction];

      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.buttons[direction] = true;
        this.emit('button', { button: direction, pressed: true });

        // First move immediately
        this.emit('move', { dx, dy });

        // Hold repeat
        this.holdTimers[direction] = setTimeout(() => {
          this.holdInterval = setInterval(() => {
            this.emit('move', { dx, dy });
          }, this.HOLD_REPEAT);
        }, this.HOLD_DELAY);
      });

      const release = (e) => {
        e.preventDefault();
        this.buttons[direction] = false;
        this.emit('button', { button: direction, pressed: false });
        clearTimeout(this.holdTimers[direction]);
        clearInterval(this.holdInterval);
      };

      el.addEventListener('touchend', release);
      el.addEventListener('touchcancel', release);
      el.addEventListener('touchleave', release);
    });
  }

  /**
   * Bind action buttons (A, B, Start, Select)
   */
  bindAction(ids) {
    Object.entries(ids).forEach(([action, elementId]) => {
      const el = document.getElementById(elementId);
      if (!el) return;

      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.buttons[action] = true;
        this.emit('action', { button: action, pressed: true });
      });

      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.buttons[action] = false;
        this.emit('action', { button: action, pressed: false });
      });
    });
  }

  /**
   * Touch start handler
   */
  onTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.touchState.active = true;
    this.touchState.startX = touch.clientX;
    this.touchState.startY = touch.clientY;
    this.touchState.currentX = touch.clientX;
    this.touchState.currentY = touch.clientY;
    this.touchState.dx = 0;
    this.touchState.dy = 0;
    this.touchState.startTime = Date.now();
    this.emit('touchstart', this.touchState);
  }

  /**
   * Touch move handler
   */
  onTouchMove(e) {
    if (!this.touchState.active) return;
    e.preventDefault();
    const touch = e.touches[0];
    this.touchState.dx = touch.clientX - this.touchState.currentX;
    this.touchState.dy = touch.clientY - this.touchState.currentY;
    this.touchState.currentX = touch.clientX;
    this.touchState.currentY = touch.clientY;
    this.emit('touchmove', this.touchState);
  }

  /**
   * Touch end handler
   */
  onTouchEnd(e) {
    e.preventDefault();
    this.touchState.duration = Date.now() - this.touchState.startTime;

    // Detect tap vs swipe
    const totalDX = this.touchState.currentX - this.touchState.startX;
    const totalDY = this.touchState.currentY - this.touchState.startY;
    const distance = Math.sqrt(totalDX * totalDX + totalDY * totalDY);

    if (distance < this.SWIPE_THRESHOLD && this.touchState.duration < this.TAP_THRESHOLD) {
      this.emit('tap', {
        x: this.touchState.startX,
        y: this.touchState.startY,
      });
    } else if (distance >= this.SWIPE_THRESHOLD) {
      const angle = Math.atan2(totalDY, totalDX) * 180 / Math.PI;
      const direction = this.angleToDirection(angle);
      this.emit('swipe', { direction, distance, dx: totalDX, dy: totalDY });
    }

    this.touchState.active = false;
    this.emit('touchend', this.touchState);
  }

  /**
   * Touch cancel handler
   */
  onTouchCancel(e) {
    this.touchState.active = false;
    this.emit('touchcancel', this.touchState);
  }

  /**
   * Convert angle to compass direction
   */
  angleToDirection(angle) {
    if (angle >= -45 && angle < 45)  return 'right';
    if (angle >= 45 && angle < 135)  return 'down';
    if (angle >= 135 || angle < -135) return 'left';
    return 'up';
  }

  /**
   * Get current button state
   */
  getButtonState(button) {
    return this.buttons[button] || false;
  }

  /**
   * Get current touch state
   */
  getTouchState() {
    return { ...this.touchState };
  }

  /**
   * Register event listener
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(cb => cb(data));
  }

  /**
   * Destroy and clean up
   */
  destroy() {
    this.listeners = {};
    Object.values(this.holdTimers).forEach(t => clearTimeout(t));
    clearInterval(this.holdInterval);
  }
}
