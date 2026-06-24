/**
 * CASCADE ALGEBRA ENGINE
 * Directional, parity-enforcing multiplication for game state
 * 
 * Core math operations: cascade(a, b, c) = a ⊗ b ⊗ c
 */

class CascadeAlgebra {
  /**
   * Cascade multiplication: a ⊗ b ⊗ c ⊗ ...
   * First operand is identity; subsequent operations add iteratively
   * 
   * Formula: accumulator = accumulator + (accumulator × operand)
   */
  static cascade(...operands) {
    if (operands.length === 0) return 0;
    if (operands.length === 1) return operands[0];

    let accumulator = operands[0]; // First is identity

    for (let i = 1; i < operands.length; i++) {
      const operand = operands[i];

      // Asymmetric zero rules
      if (operand === 0) {
        // x ⊗ 0 = x (right-zero preservation)
        continue;
      }
      if (accumulator === 0 && i > 1) {
        // 0 ⊗ x = 0 (left-zero annihilation)
        return 0;
      }

      // Cascade: accumulator + (accumulator × operand)
      accumulator = accumulator + (accumulator * operand);
    }

    return accumulator;
  }

  /**
   * Count 1-bits in binary representation (Hamming weight)
   */
  static parityBits(n) {
    let count = 0;
    let val = Math.abs(n) >>> 0; // Unsigned 32-bit
    while (val) {
      count += val & 1;
      val >>>= 1;
    }
    return count;
  }

  /**
   * Check if number has even parity (even number of 1-bits)
   */
  static isEvenParity(n) {
    return this.parityBits(n) % 2 === 0;
  }

  /**
   * Fold to parity equilibrium
   * If odd parity, apply transformations until even
   */
  static fold(n) {
    if (n < 0) return this.fold(-n);

    if (this.isEvenParity(n)) {
      return n; // Already stable
    }

    // Odd parity: apply folding transformations
    const complement = (~n) & 0xFF;
    const fold1 = n ^ complement;
    const fold2 = n ^ (n & 0x0F);
    const fold3 = (n + complement) & 0xFF;

    // Find first even-parity result
    const candidates = [fold1, fold2, fold3];
    for (const candidate of candidates) {
      if (this.isEvenParity(candidate)) {
        return candidate;
      }
    }

    // Fallback: bitwise rotation
    const rotated = ((n << 1) | (n >> 7)) & 0xFF;
    return this.isEvenParity(rotated) ? rotated : rotated ^ 1;
  }

  /**
   * Encode as quaterbase4i (p, d, b, q)
   * p=00, d=01, b=10, q=11
   */
  static toQuaterbase4i(n) {
    const binary = (n & 0xFF).toString(2).padStart(8, '0');
    const pairs = [
      binary.substring(0, 2),
      binary.substring(2, 4),
      binary.substring(4, 6),
      binary.substring(6, 8),
    ];

    const map = { '00': 'p', '01': 'd', '10': 'b', '11': 'q' };
    return pairs.map(pair => map[pair]).join('');
  }

  /**
   * Decode quaterbase4i string to decimal
   */
  static fromQuaterbase4i(strand) {
    const map = { p: '00', d: '01', b: '10', q: '11' };
    const binary = strand.split('').map(c => map[c] || '00').join('');
    return parseInt(binary, 2);
  }

  /**
   * Full validation: compute, fold, return report
   */
  static validate(...operands) {
    const raw = this.cascade(...operands);
    const stable = this.fold(raw);
    return {
      raw,
      stable,
      parity: this.isEvenParity(stable) ? 'even' : 'odd',
      binary: (stable & 0xFF).toString(2).padStart(8, '0'),
      quaterbase4i: this.toQuaterbase4i(stable),
      valid: this.isEvenParity(stable),
    };
  }

  /**
   * Game collision: playerState ⊗ tileState
   */
  static collide(playerState, tileState) {
    const result = this.cascade(playerState, tileState);
    const stable = this.fold(result);
    return stable;
  }

  /**
   * Obliteration check: did left-zero annihilate?
   */
  static checkObliteration(tileValue, playerState) {
    if (tileValue === 0 && playerState !== 0) {
      return true; // Obliteration triggered
    }
    return false;
  }

  /**
   * Debug string representation
   */
  static describe(n) {
    const quater = this.toQuaterbase4i(n);
    const parity = this.isEvenParity(n) ? '✓ EVEN' : '✗ ODD';
    return `[${n}] ${parity} | QBase4i: ${quater} | Binary: ${(n & 0xFF).toString(2).padStart(8, '0')}`;
  }
}

// Export for CommonJS/Node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CascadeAlgebra;
}
