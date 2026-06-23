# HIDDENEAGLE46 • CUSTOM CASCADE ALGEBRA

## Core Thesis
Standard multiplication is commutative and distributive. **Cascade Algebra is directional and state-preserving.** Order matters. The first operand is identity; subsequent operations *add iteratively*. Asymmetric zero-rules create left-annihilation and right-preservation.

---

## The Grammar

### Cascade Multiplication `⊗`

**Standard math:**
```
4 × 4 × 4 = 64
```

**Cascade Algebra:**
```
4 ⊗ 4 ⊗ 4 = 100

Step 1: First 4 is identity → 4
Step 2: 4 ⊗ 4 → "add 4 to itself 4 times" → 4 + 4 + 4 + 4 = 20
Step 3: 20 ⊗ 4 → "add 20 to itself 4 times" → 20 + 20 + 20 + 20 = 100
```

### General Formula

```
a ⊗ b ⊗ c ⊗ ... ⊗ z

1. accumulator = a (first operand passes through)
2. FOR each subsequent operand (b, c, ..., z):
     accumulator = accumulator × operand (standard multiply by the multiplier count)
     THEN sum the accumulator with itself that many times
     → accumulator += accumulator × (operand - 1)
     OR equivalently: accumulator = accumulator × operand

SIMPLIFIED:
accumulator = a
FOR each b in [subsequent operands]:
  accumulator = accumulator × b  (but interpreted as additive iteration)
```

### Asymmetric Zero Rules

```
x ⊗ 0 = x       (RIGHT zero: state persists)
0 ⊗ x = 0       (LEFT zero: annihilation)
```

**Game logic interpretation:**
- Player with 100 XP + tile marked (⊗ 0) = 100 XP preserved (inert collision)
- Poison tile (0 ⊗) + player state = 0 (obliteration from left)

---

## Parity Equilibrium

Every cascade result must satisfy **even parity** (even number of 1-bits in binary).

```
2 ⊗ 2 ⊗ 2 = 18
Binary: 00010010 (two 1-bits) ✓ PASS

4 ⊗ 4 ⊗ 4 = 100
Binary: 01100100 (three 1-bits) ✗ FAIL (odd parity)
```

**Validation rule:**
- If result has odd parity, fold it:
  - Complement strand (flip all bits): `~result`
  - Take lower half: `result & 0x0F`
  - XOR with original: `result ^ folded`
  - Return stable strand

---

## Examples

### Example 1: 2 ⊗ 2 ⊗ 2
```
Step 1: accumulator = 2
Step 2: 2 ⊗ 2 → 2 × 2 = 4, then "add 2 to itself 2 times" → 2+2 = 4, accumulator = 2+4 = 6
Step 3: 6 ⊗ 2 → 6 × 2 = 12, then "add 6 to itself 2 times" → 6+6 = 12, accumulator = 6+12 = 18

Result: 18
Binary: 00010010 (parity: even ✓)
```

### Example 2: 4 ⊗ 4 ⊗ 4
```
Step 1: accumulator = 4
Step 2: 4 ⊗ 4 → 4 × 4 = 16, then "add 4 to itself 4 times" → 4+4+4+4 = 20, accumulator = 4+20 = 24
         (WAIT: let me recalculate) 
         Actually: 4 → add 4 times → 4+4+4+4 = 16? Or 4 + (4+4+4+4)?
         
Interpretation A: accumulator = prev ⊗ operand = (prev × operand) interpreted as sum
  4 ⊗ 4 = 4 + 4 + 4 + 4 = 16? No, that's 4×4.
  4 ⊗ 4 = "take 4, add it to itself 4 times" = 4 + 4 + 4 + 4 = 16? Still 4×4.
  
Re-reading Prophet's explanation:
  "4 added to itself 4 times is 20 added to itself 4 times is 100"
  
So: 4 + 4 + 4 + 4 + 4 = 20 (that's 5 instances of 4, or "4 added to itself 4 times" = 4×5)
    No wait: "added to itself N times" = original + (N additions) = original × (N+1)
    
    4 added to itself 4 times = 4 + (4+4+4+4) = 4 + 16 = 20 ✓
    
So cascade is: accumulator = accumulator + (accumulator × operand)

Step 1: accumulator = 4
Step 2: accumulator = 4 + (4 × 4) = 4 + 16 = 20
Step 3: accumulator = 20 + (20 × 4) = 20 + 80 = 100

Result: 100
Binary: 01100100 (parity: odd ✗ → folds to stable state)
```

---

## Integration with Sultan-47

### Tile State Computation
Every tile in the game carries state: `(type, value, flags)`.

When a player collides with a tile:
```javascript
playerState ⊗ tileState = resultState
```

If result fails parity, fold it back to equilibrium before applying.

### Level ROM Seeding
Level layouts are generated from cascade seeds:
```
levelSeed = theme ⊗ difficulty ⊗ playerXP
valid = validateParity(levelSeed)
```

### Collision Resolution
```
playerXP ⊗ tileValue = newXP
  (if playerPos.x ⊗ 0 → playerXP preserved if tile is inert)
  (if 0 ⊗ tileValue → obliteration if player enters from wrong side)
```

---

## Implementation Goals

1. **Core Engine** (`CascadeAlgebra.js`): Pure cascade multiply, parity validation, fold logic
2. **Game Integration** (`Sultan47Cascade.js`): Tie collision, item pickup, XP gains to cascade ops
3. **Reference Tests** (`tests/`): Validate 2⊗2⊗2=18, 4⊗4⊗4=100, parity equilibrium
4. **Live Demo** (`demo_cascade.html`): Touch-only Android Chrome interface showing cascade live

---

## Repo Structure

```
hiddeneagle46/
├── README.md (this spec + quickstart)
├── CascadeAlgebra.js (core engine, no dependencies)
├── Sultan47Cascade.js (integration module)
├── demo_cascade.html (single-file reference implementation)
├── tests/
│   └── cascade_tests.js (validation suite)
└── examples/
    └── level_rom_seeding.html (example: procedural levels via cascade)
```

---

## Author Notes

- **Prophet Of Truth**: Invented cascade algebra as a directional, parity-enforcing alternative to standard multiplication.
- **Motivation**: Game state should be stable, predictable, and mathematically coherent.
- **Asymmetry**: Directional operations allow for "obliteration vs. preservation" mechanics in collision resolution.
- **Parity**: Even bit-count ensures feedback loops don't spiral unpredictably.

---

## Status

- **Phase 1**: Spec locked (this document)
- **Phase 2**: JavaScript reference implementation (in progress)
- **Phase 3**: Sultan-47 integration (pending Phase 2)
- **Phase 4**: Live demo on Android Chrome (pending Phase 3)

---

*018810 MIRROR ALGEBRA EXTENDED • HIDDENEAGLE46 FOUNDATION*
