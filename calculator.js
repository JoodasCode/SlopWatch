// Simple calculator utility
function multiply(a, b) {
  // Input validation
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  
  // Handle special cases
  if (isNaN(a) || isNaN(b)) {
    throw new Error('Arguments cannot be NaN');
  }
  
  return a * b;
}

// Export the function
export { multiply };

// Test cases
console.log('multiply(5, 3):', multiply(5, 3));
console.log('multiply(-2, 4):', multiply(-2, 4));
console.log('multiply(0, 100):', multiply(0, 100)); 