/**
 * CASCADE ALGEBRA TEST SUITE
 * Tests for: cascade(), fold(), parity, quaterbase4i
 * Run: node tests/cascade.test.js
 */

// Inline CascadeAlgebra for Node.js testing
class CascadeAlgebra {
  static cascade(...operands) {
    if (operands.length === 0) return 0;
    if (operands.length === 1) return operands[0];
    let accumulator = operands[0];
    for (let i = 1; i < operands.length; i++) {
      const operand = operands[i];
      if (operand === 0) continue;
      if (accumulator === 0 && i > 1) return 0;
      accumulator = accumulator + (accumulator * operand);
    }
    return accumulator;
  }
  static parityBits(n) {
    let count = 0, val = Math.abs(n) >>> 0;
    while (val) { count += val & 1; val >>>= 1; }
    return count;
  }
  static isEvenParity(n) { return this.parityBits(n) % 2 === 0; }
  static fold(n) {
    if (n < 0) return this.fold(-n);
    if (this.isEvenParity(n)) return n;
    const complement = (~n) & 0xFF;
    const candidates = [n ^ complement, n ^ (n & 0x0F), (n + complement) & 0xFF];
    for (const c of candidates) { if (this.isEvenParity(c)) return c; }
    const rotated = ((n << 1) | (n >> 7)) & 0xFF;
    return this.isEvenParity(rotated) ? rotated : rotated ^ 1;
  }
  static toQuaterbase4i(n) {
    const binary = (n & 0xFF).toString(2).padStart(8, '0');
    const pairs = [binary.slice(0,2),binary.slice(2,4),binary.slice(4,6),binary.slice(6,8)];
    const map = { '00':'p','01':'d','10':'b','11':'q' };
    return pairs.map(p => map[p]).join('');
  }
  static collide(a, b) { return this.fold(this.cascade(a, b)); }
}

// ── MINI TEST RUNNER ──────────────────────────────────────────

let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    Expected: ${e.expected}`);
    console.error(`    Got:      ${e.actual}`);
    failed++;
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        const err = new Error('assertion failed');
        err.expected = expected;
        err.actual = actual;
        throw err;
      }
    },
    toBeTrue() {
      if (actual !== true) {
        const err = new Error('assertion failed');
        err.expected = true;
        err.actual = actual;
        throw err;
      }
    },
    toBeFalse() {
      if (actual !== false) {
        const err = new Error('assertion failed');
        err.expected = false;
        err.actual = actual;
        throw err;
      }
    },
    toBeGreaterThan(n) {
      if (actual <= n) {
        const err = new Error('assertion failed');
        err.expected = `> ${n}`;
        err.actual = actual;
        throw err;
      }
    },
  };
}

// ── CASCADE TESTS ─────────────────────────────────────────────

console.log('\nCascade Operations:');

test('2 ⊗ 2 ⊗ 2 = 18', () => {
  expect(CascadeAlgebra.cascade(2, 2, 2)).toBe(18);
});

test('4 ⊗ 4 ⊗ 4 = 100', () => {
  expect(CascadeAlgebra.cascade(4, 4, 4)).toBe(100);
});

test('Identity: single operand returns itself', () => {
  expect(CascadeAlgebra.cascade(7)).toBe(7);
});

test('Empty operands returns 0', () => {
  expect(CascadeAlgebra.cascade()).toBe(0);
});

test('Right-zero preservation: x ⊗ 0 = x', () => {
  expect(CascadeAlgebra.cascade(5, 0)).toBe(5);
});

test('Right-zero chain: 3 ⊗ 2 ⊗ 0 = 3 ⊗ 2', () => {
  expect(CascadeAlgebra.cascade(3, 2, 0)).toBe(CascadeAlgebra.cascade(3, 2));
});

test('1 ⊗ 1 = 2', () => {
  expect(CascadeAlgebra.cascade(1, 1)).toBe(2);
});

test('2 ⊗ 3 = 2 + (2×3) = 8', () => {
  expect(CascadeAlgebra.cascade(2, 3)).toBe(8);
});

// ── PARITY TESTS ──────────────────────────────────────────────

console.log('\nParity Checks:');

test('18 has even parity (two 1-bits)', () => {
  expect(CascadeAlgebra.isEvenParity(18)).toBeTrue();
});

test('100 has odd parity (three 1-bits)', () => {
  expect(CascadeAlgebra.isEvenParity(100)).toBeFalse();
});

test('64 has odd parity (one 1-bit)', () => {
  expect(CascadeAlgebra.isEvenParity(64)).toBeFalse();
});

test('0 has even parity (zero 1-bits)', () => {
  expect(CascadeAlgebra.isEvenParity(0)).toBeTrue();
});

test('255 has even parity (eight 1-bits)', () => {
  expect(CascadeAlgebra.isEvenParity(255)).toBeTrue();
});

test('parityBits(18) = 2', () => {
  expect(CascadeAlgebra.parityBits(18)).toBe(2);
});

test('parityBits(100) = 3', () => {
  expect(CascadeAlgebra.parityBits(100)).toBe(3);
});

// ── FOLD TESTS ────────────────────────────────────────────────

console.log('\nFold / Stability:');

test('fold(18) = 18 (already even)', () => {
  expect(CascadeAlgebra.fold(18)).toBe(18);
});

test('fold(100) produces even-parity result', () => {
  const folded = CascadeAlgebra.fold(100);
  expect(CascadeAlgebra.isEvenParity(folded)).toBeTrue();
});

test('fold(64) produces even-parity result', () => {
  const folded = CascadeAlgebra.fold(64);
  expect(CascadeAlgebra.isEvenParity(folded)).toBeTrue();
});

test('fold of even-parity number is identity (51 = 110011 = 4 ones)', () => {
  // 51 = 00110011 → four 1-bits → even parity → fold returns 51 unchanged
  expect(CascadeAlgebra.fold(51)).toBe(51);
});

test('42 has odd parity (101010 = three 1-bits), fold stabilises it', () => {
  const folded = CascadeAlgebra.fold(42);
  expect(CascadeAlgebra.isEvenParity(folded)).toBeTrue();
});

// ── QUATERBASE4I TESTS ────────────────────────────────────────

console.log('\nQuaterbase4i Encoding:');

test('0 encodes to pppp', () => {
  expect(CascadeAlgebra.toQuaterbase4i(0)).toBe('pppp');
});

test('255 encodes to qqqq', () => {
  expect(CascadeAlgebra.toQuaterbase4i(255)).toBe('qqqq');
});

test('18 encodes to pdpb', () => {
  // 18 = 00010010 → (00)(01)(00)(10) → p d p b
  expect(CascadeAlgebra.toQuaterbase4i(18)).toBe('pdpb');
});

test('Encoding length is always 4', () => {
  const enc = CascadeAlgebra.toQuaterbase4i(42);
  expect(enc.length).toBe(4);
});

// ── COLLISION TESTS ───────────────────────────────────────────

console.log('\nCollision (Game State):');

test('collide result is always even parity', () => {
  const pairs = [[50, 10], [100, 5], [20, 20], [1, 1], [255, 3]];
  pairs.forEach(([a, b]) => {
    const result = CascadeAlgebra.collide(a, b);
    if (!CascadeAlgebra.isEvenParity(result)) {
      const err = new Error('collision not even parity');
      err.expected = 'even parity';
      err.actual = `${result} (${result.toString(2)})`;
      throw err;
    }
  });
});

test('collide(0, x) = 0 for second operand', () => {
  // 0 as accumulator with any operand
  const result = CascadeAlgebra.cascade(0, 5);
  expect(result).toBe(0);
});

// ── RESULTS ───────────────────────────────────────────────────

console.log(`\n${'─'.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('All tests passed ✓\n');
} else {
  console.error(`${failed} test(s) failed ✗\n`);
  process.exit(1);
}
