/**
 * TRANSLATOR MODULE
 * Maps cascade values to game coordinates, entity states, and tile IDs
 */

class Translator {
  /**
   * Cascade result → tile coordinates
   */
  static cascadeToGameCoords(cascadeValue) {
    return {
      tileX: cascadeValue % 32,
      tileY: Math.floor(cascadeValue / 32),
      id: cascadeValue,
    };
  }

  /**
   * Tile coordinates → pixel coordinates
   */
  static gameCoordsToXY(tileX, tileY, tileSize = 32) {
    return {
      x: tileX * tileSize,
      y: tileY * tileSize,
    };
  }

  /**
   * Pixel coordinates → tile coordinates
   */
  static xyToGameCoords(x, y, tileSize = 32) {
    return {
      tileX: Math.floor(x / tileSize),
      tileY: Math.floor(y / tileSize),
    };
  }

  /**
   * Cascade value → entity state breakdown
   * High nibble = health, low nibble = xp
   */
  static cascadeToState(cascadeValue) {
    return {
      health: (cascadeValue & 0xF0) >> 4,
      xp: cascadeValue & 0x0F,
      level: Math.floor(cascadeValue / 16),
      strand: CascadeAlgebra.toQuaterbase4i(cascadeValue),
    };
  }

  /**
   * Entity state → cascade value
   */
  static stateToCascade(state) {
    const combined = ((state.health & 0x0F) << 4) | (state.xp & 0x0F);
    return CascadeAlgebra.fold(combined);
  }

  /**
   * Decimal → 8-bit binary string
   */
  static toBinaryStrand(n) {
    return (n & 0xFF).toString(2).padStart(8, '0');
  }

  /**
   * 8-bit binary string → decimal
   */
  static fromBinaryStrand(strand) {
    return parseInt(strand, 2);
  }

  /**
   * Decimal → hex string
   */
  static toHex(n) {
    return '0x' + (n & 0xFF).toString(16).toUpperCase().padStart(2, '0');
  }

  /**
   * Decimal → ASCII character (if printable)
   */
  static toASCII(n) {
    if (n >= 32 && n <= 126) return String.fromCharCode(n);
    return `[${n}]`;
  }

  /**
   * Full number report
   */
  static report(n) {
    return {
      decimal: n,
      binary: this.toBinaryStrand(n),
      hex: this.toHex(n),
      ascii: this.toASCII(n),
      quaterbase4i: CascadeAlgebra.toQuaterbase4i(n),
      parity: CascadeAlgebra.isEvenParity(n) ? 'EVEN ✓' : 'ODD ✗',
      parityBits: CascadeAlgebra.parityBits(n),
    };
  }
}
