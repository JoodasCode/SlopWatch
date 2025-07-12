// Calculator with comprehensive operations and error handling
class Calculator {
  constructor() {
    this.history = [];
  }

  // Add function with error handling
  add(a, b) {
    try {
      if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('Both arguments must be numbers');
      }
      const result = a + b;
      this.history.push(`${a} + ${b} = ${result}`);
      return result;
    } catch (error) {
      this.history.push(`Error: ${error.message}`);
      throw error;
    }
  }

  // Subtract function with validation
  subtract(a, b) {
    try {
      if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('Both arguments must be numbers');
      }
      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        throw new Error('Arguments must be finite numbers');
      }
      const result = a - b;
      this.history.push(`${a} - ${b} = ${result}`);
      return result;
    } catch (error) {
      this.history.push(`Error: ${error.message}`);
      throw error;
    }
  }

  // Multiply function with type checking
  multiply(a, b) {
    try {
      if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('Both arguments must be numbers');
      }
      if (Number.isNaN(a) || Number.isNaN(b)) {
        throw new Error('Arguments cannot be NaN');
      }
      const result = a * b;
      this.history.push(`${a} * ${b} = ${result}`);
      return result;
    } catch (error) {
      this.history.push(`Error: ${error.message}`);
      throw error;
    }
  }

  // Divide function with zero-division protection
  divide(a, b) {
    try {
      if (typeof a !== 'number' || typeof b !== 'number') {
        throw new Error('Both arguments must be numbers');
      }
      if (b === 0) {
        throw new Error('Division by zero is not allowed');
      }
      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        throw new Error('Arguments must be finite numbers');
      }
      const result = a / b;
      this.history.push(`${a} / ${b} = ${result}`);
      return result;
    } catch (error) {
      this.history.push(`Error: ${error.message}`);
      throw error;
    }
  }

  // History tracking and error handling
  getHistory() {
    return [...this.history];
  }

  clearHistory() {
    this.history = [];
    return 'History cleared';
  }

  getLastOperation() {
    if (this.history.length === 0) {
      return 'No operations performed yet';
    }
    return this.history[this.history.length - 1];
  }
}

// Export for use in other modules
export default Calculator;

// Example usage and testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const calc = new Calculator();
  
  console.log('Testing Calculator Operations:');
  console.log('Add: 5 + 3 =', calc.add(5, 3));
  console.log('Subtract: 10 - 4 =', calc.subtract(10, 4));
  console.log('Multiply: 6 * 7 =', calc.multiply(6, 7));
  console.log('Divide: 20 / 4 =', calc.divide(20, 4));
  
  console.log('\nHistory:');
  calc.getHistory().forEach(entry => console.log(entry));
  
  // Test error handling
  try {
    calc.divide(10, 0);
  } catch (error) {
    console.log('\nError handling test:', error.message);
  }
} 