/**
 * ACCUMULATOR MODULE
 * Stateful value accumulation with cascade operations
 */

class Accumulator {
  constructor(initialValue = 0) {
    this.value = initialValue;
    this.history = [initialValue];
  }

  /**
   * Get current value
   */
  getValue() {
    return this.value;
  }

  /**
   * Apply cascade operation
   */
  cascade(...operands) {
    this.value = CascadeAlgebra.cascade(this.value, ...operands);
    this.history.push(this.value);
    return this.value;
  }

  /**
   * Apply cascade then fold to parity equilibrium
   */
  cascadeAndFold(...operands) {
    const cascaded = CascadeAlgebra.cascade(this.value, ...operands);
    this.value = CascadeAlgebra.fold(cascaded);
    this.history.push(this.value);
    return this.value;
  }

  /**
   * Fold current value to parity equilibrium
   */
  fold() {
    this.value = CascadeAlgebra.fold(this.value);
    this.history.push(this.value);
    return this.value;
  }

  /**
   * Add operand iteratively (a + a*b)
   */
  add(operand) {
    this.value = this.value + (this.value * operand);
    this.history.push(this.value);
    return this.value;
  }

  /**
   * Reset to initial value
   */
  reset(value = 0) {
    this.value = value;
    this.history = [value];
  }

  /**
   * Get operation history
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Get history length
   */
  getHistoryLength() {
    return this.history.length;
  }

  /**
   * Clear history (keeps value)
   */
  clearHistory() {
    this.history = [this.value];
  }
}
