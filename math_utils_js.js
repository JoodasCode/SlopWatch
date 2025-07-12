/**
 * Math Utilities for Geometry Calculations
 * File: math-utils.js
 */

class MathUtils {
  /**
   * Calculate the area of a rectangle
   * @param {number} width - Width of the rectangle
   * @param {number} height - Height of the rectangle
   * @returns {number} - Area of the rectangle
   */
  static rectangleArea(width, height) {
    if (typeof width !== 'number' || typeof height !== 'number') {
      throw new Error('Width and height must be numbers');
    }
    if (width <= 0 || height <= 0) {
      throw new Error('Width and height must be positive numbers');
    }
    return width * height;
  }

  /**
   * Calculate the perimeter of a rectangle
   * @param {number} width - Width of the rectangle
   * @param {number} height - Height of the rectangle
   * @returns {number} - Perimeter of the rectangle
   */
  static rectanglePerimeter(width, height) {
    if (typeof width !== 'number' || typeof height !== 'number') {
      throw new Error('Width and height must be numbers');
    }
    if (width <= 0 || height <= 0) {
      throw new Error('Width and height must be positive numbers');
    }
    return 2 * (width + height);
  }

  /**
   * Calculate the area of a circle
   * @param {number} radius - Radius of the circle
   * @returns {number} - Area of the circle
   */
  static circleArea(radius) {
    if (typeof radius !== 'number') {
      throw new Error('Radius must be a number');
    }
    if (radius <= 0) {
      throw new Error('Radius must be a positive number');
    }
    return Math.PI * radius * radius;
  }

  /**
   * Calculate the perimeter (circumference) of a circle
   * @param {number} radius - Radius of the circle
   * @returns {number} - Perimeter of the circle
   */
  static circlePerimeter(radius) {
    if (typeof radius !== 'number') {
      throw new Error('Radius must be a number');
    }
    if (radius <= 0) {
      throw new Error('Radius must be a positive number');
    }
    return 2 * Math.PI * radius;
  }

  /**
   * Calculate the area of a triangle using base and height
   * @param {number} base - Base of the triangle
   * @param {number} height - Height of the triangle
   * @returns {number} - Area of the triangle
   */
  static triangleArea(base, height) {
    if (typeof base !== 'number' || typeof height !== 'number') {
      throw new Error('Base and height must be numbers');
    }
    if (base <= 0 || height <= 0) {
      throw new Error('Base and height must be positive numbers');
    }
    return 0.5 * base * height;
  }

  /**
   * Calculate the perimeter of a triangle
   * @param {number} side1 - First side of the triangle
   * @param {number} side2 - Second side of the triangle
   * @param {number} side3 - Third side of the triangle
   * @returns {number} - Perimeter of the triangle
   */
  static trianglePerimeter(side1, side2, side3) {
    if (typeof side1 !== 'number' || typeof side2 !== 'number' || typeof side3 !== 'number') {
      throw new Error('All sides must be numbers');
    }
    if (side1 <= 0 || side2 <= 0 || side3 <= 0) {
      throw new Error('All sides must be positive numbers');
    }
    // Check triangle inequality
    if (side1 + side2 <= side3 || side1 + side3 <= side2 || side2 + side3 <= side1) {
      throw new Error('Invalid triangle: sides do not satisfy triangle inequality');
    }
    return side1 + side2 + side3;
  }

  /**
   * Calculate distance between two points
   * @param {number} x1 - X coordinate of first point
   * @param {number} y1 - Y coordinate of first point
   * @param {number} x2 - X coordinate of second point
   * @param {number} y2 - Y coordinate of second point
   * @returns {number} - Distance between the points
   */
  static distance(x1, y1, x2, y2) {
    if (typeof x1 !== 'number' || typeof y1 !== 'number' || 
        typeof x2 !== 'number' || typeof y2 !== 'number') {
      throw new Error('All coordinates must be numbers');
    }
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MathUtils;
}

// For browser environments
if (typeof window !== 'undefined') {
  window.MathUtils = MathUtils;
}

// Example usage and testing
if (typeof require === 'undefined' || require.main === module) {
  console.log('Math Utils Test Results:');
  console.log('=======================');
  
  try {
    console.log('Rectangle (5x3) - Area:', MathUtils.rectangleArea(5, 3));
    console.log('Rectangle (5x3) - Perimeter:', MathUtils.rectanglePerimeter(5, 3));
    console.log('Circle (r=4) - Area:', MathUtils.circleArea(4).toFixed(2));
    console.log('Circle (r=4) - Perimeter:', MathUtils.circlePerimeter(4).toFixed(2));
    console.log('Triangle (base=6, height=4) - Area:', MathUtils.triangleArea(6, 4));
    console.log('Triangle (3,4,5) - Perimeter:', MathUtils.trianglePerimeter(3, 4, 5));
    console.log('Distance (0,0) to (3,4):', MathUtils.distance(0, 0, 3, 4));
  } catch (error) {
    console.error('Error:', error.message);
  }
}