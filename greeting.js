// Simple greeting utility function
function createGreeting(name) {
  if (!name || typeof name !== 'string') {
    return 'Hello, stranger!';
  }
  return `Hello, ${name}! Welcome to SlopWatch testing.`;
}

// Export the function
export { createGreeting };

// Test the function
console.log(createGreeting('Alice'));
console.log(createGreeting(''));
console.log(createGreeting(null)); 