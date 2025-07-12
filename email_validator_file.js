/**
 * Comprehensive Email Validation Function
 * File: email-validator.js
 * 
 * This module provides robust email validation with regex patterns,
 * domain validation, and comprehensive error handling.
 */

class EmailValidator {
  constructor() {
    // Comprehensive regex pattern for email validation
    this.emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    // Invalid domains to reject
    this.invalidDomains = [
      'test.com',
      'example.com', 
      'localhost',
      'invalid.com'
    ];
    
    // Valid TLDs for domain validation
    this.validTLDs = [
      'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
      'co', 'io', 'ai', 'app', 'dev', 'tech', 'info'
    ];
  }

  /**
   * Main email validation function with comprehensive checks
   * @param {string} email - Email address to validate
   * @returns {Object} - Detailed validation result
   */
  validateEmail(email) {
    try {
      // Input validation with detailed error handling
      if (!email || typeof email !== 'string') {
        return {
          isValid: false,
          error: 'INVALID_INPUT',
          message: 'Email must be a non-empty string',
          details: { receivedType: typeof email }
        };
      }

      // Trim whitespace and normalize
      email = email.trim().toLowerCase();

      // Length validation with specific limits
      if (email.length > 254) {
        return {
          isValid: false,
          error: 'EMAIL_TOO_LONG',
          message: 'Email address exceeds maximum length of 254 characters',
          details: { 
            actualLength: email.length, 
            maxLength: 254,
            email: email.substring(0, 50) + '...' 
          }
        };
      }

      if (email.length < 3) {
        return {
          isValid: false,
          error: 'EMAIL_TOO_SHORT',
          message: 'Email address must be at least 3 characters long',
          details: { actualLength: email.length, minLength: 3 }
        };
      }

      // Regex pattern validation
      if (!this.emailRegex.test(email)) {
        return {
          isValid: false,
          error: 'INVALID_FORMAT',
          message: 'Email format does not match valid email pattern',
          details: { 
            email,
            reason: 'Failed regex validation',
            pattern: this.emailRegex.toString()
          }
        };
      }

      // Split and validate email parts
      const atIndex = email.lastIndexOf('@');
      if (atIndex === -1) {
        return {
          isValid: false,
          error: 'MISSING_AT_SYMBOL',
          message: 'Email must contain exactly one @ symbol',
          details: { email }
        };
      }

      const localPart = email.substring(0, atIndex);
      const domainPart = email.substring(atIndex + 1);

      // Validate local part (before @)
      const localValidation = this.validateLocalPart(localPart);
      if (!localValidation.isValid) {
        return localValidation;
      }

      // Validate domain part (after @)
      const domainValidation = this.validateDomainPart(domainPart);
      if (!domainValidation.isValid) {
        return domainValidation;
      }

      // All validations passed successfully
      return {
        isValid: true,
        error: null,
        message: 'Email address is valid and properly formatted',
        details: {
          originalEmail: email,
          localPart,
          domainPart,
          topLevelDomain: domainPart.split('.').pop(),
          validationTimestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      // Comprehensive error handling for unexpected issues
      return {
        isValid: false,
        error: 'VALIDATION_EXCEPTION',
        message: 'An unexpected error occurred during email validation',
        details: { 
          originalError: error.message,
          stack: error.stack,
          email: email || 'undefined'
        }
      };
    }
  }

  /**
   * Validates the local part of email (before @ symbol)
   * @param {string} localPart - Local portion of email
   * @returns {Object} - Validation result with detailed error info
   */
  validateLocalPart(localPart) {
    if (!localPart || localPart.length === 0) {
      return {
        isValid: false,
        error: 'EMPTY_LOCAL_PART',
        message: 'Email local part (before @) cannot be empty',
        details: { localPart }
      };
    }

    if (localPart.length > 64) {
      return {
        isValid: false,
        error: 'LOCAL_PART_TOO_LONG',
        message: 'Email local part exceeds maximum length of 64 characters',
        details: { 
          actualLength: localPart.length, 
          maxLength: 64,
          localPart: localPart.substring(0, 20) + '...'
        }
      };
    }

    // Check for consecutive dots (not allowed)
    if (localPart.includes('..')) {
      return {
        isValid: false,
        error: 'CONSECUTIVE_DOTS',
        message: 'Local part cannot contain consecutive dots (..)',
        details: { localPart, invalidPattern: '..' }
      };
    }

    // Check for leading or trailing dots
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return {
        isValid: false,
        error: 'INVALID_DOT_PLACEMENT',
        message: 'Local part cannot start or end with a dot',
        details: { 
          localPart,
          startsWithDot: localPart.startsWith('.'),
          endsWithDot: localPart.endsWith('.')
        }
      };
    }

    return { isValid: true };
  }

  /**
   * Validates the domain part of email (after @ symbol)
   * @param {string} domainPart - Domain portion of email
   * @returns {Object} - Validation result with detailed error info
   */
  validateDomainPart(domainPart) {
    if (!domainPart || domainPart.length === 0) {
      return {
        isValid: false,
        error: 'EMPTY_DOMAIN',
        message: 'Email domain part (after @) cannot be empty',
        details: { domainPart }
      };
    }

    if (domainPart.length > 253) {
      return {
        isValid: false,
        error: 'DOMAIN_TOO_LONG',
        message: 'Domain exceeds maximum length of 253 characters',
        details: { 
          actualLength: domainPart.length, 
          maxLength: 253,
          domain: domainPart.substring(0, 30) + '...'
        }
      };
    }

    // Check against blacklisted invalid domains
    if (this.invalidDomains.includes(domainPart)) {
      return {
        isValid: false,
        error: 'BLACKLISTED_DOMAIN',
        message: 'Domain is not allowed (blacklisted)',
        details: { 
          domain: domainPart, 
          reason: 'Listed in invalid domains',
          blacklist: this.invalidDomains
        }
      };
    }

    // Validate top-level domain (TLD)
    const domainParts = domainPart.split('.');
    if (domainParts.length < 2) {
      return {
        isValid: false,
        error: 'MISSING_TLD',
        message: 'Domain must contain at least one dot and a valid TLD',
        details: { domain: domainPart, parts: domainParts }
      };
    }

    const tld = domainParts[domainParts.length - 1];
    if (!tld || tld.length < 2 || tld.length > 6) {
      return {
        isValid: false,
        error: 'INVALID_TLD_LENGTH',
        message: 'Top-level domain must be 2-6 characters long',
        details: { 
          tld, 
          length: tld ? tld.length : 0,
          domain: domainPart
        }
      };
    }

    return { isValid: true };
  }

  /**
   * Batch validate multiple email addresses with detailed results
   * @param {Array<string>} emails - Array of email addresses to validate
   * @returns {Array<Object>} - Array of detailed validation results
   */
  validateBatch(emails) {
    if (!Array.isArray(emails)) {
      throw new Error('validateBatch requires an array of email addresses');
    }

    const results = emails.map((email, index) => ({
      index,
      originalEmail: email,
      ...this.validateEmail(email)
    }));

    // Add summary statistics
    const summary = {
      total: emails.length,
      valid: results.filter(r => r.isValid).length,
      invalid: results.filter(r => !r.isValid).length,
      validationRate: results.filter(r => r.isValid).length / emails.length
    };

    return {
      results,
      summary
    };
  }

  /**
   * Quick validation method for simple true/false result
   * @param {string} email - Email to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  isValid(email) {
    return this.validateEmail(email).isValid;
  }
}

// Export the EmailValidator class for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmailValidator;
}

// For browser environments
if (typeof window !== 'undefined') {
  window.EmailValidator = EmailValidator;
}

// Example usage and testing
if (typeof require === 'undefined' || require.main === module) {
  console.log('EmailValidator - Testing Mode');
  console.log('==============================');
  
  const validator = new EmailValidator();
  
  const testCases = [
    'valid@example.com',
    'user.name+tag@domain.co.uk',
    'test@subdomain.domain.org',
    'invalid.email.format',
    '@missing-local.com',
    'missing-domain@',
    'user@test.com',
    'user..double.dot@domain.com',
    '.leading.dot@domain.com',
    'trailing.dot.@domain.com'
  ];
  
  testCases.forEach(email => {
    const result = validator.validateEmail(email);
    const status = result.isValid ? '✅ VALID' : '❌ INVALID';
    console.log(`${email.padEnd(30)} | ${status} | ${result.message}`);
  });
}