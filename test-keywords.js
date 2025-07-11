// Test the Smart Claim Detector keyword bank

class SmartClaimDetector {
  constructor() {
    // ACTION VERBS (how AI describes what it did)
    this.actionVerbs = {
      add: ['added', 'implemented', 'introduced', 'created', 'built', 'included', 'inserted', 'put', 'placed', 'integrated'],
      fix: ['fixed', 'resolved', 'corrected', 'repaired', 'addressed', 'solved', 'patched', 'debugged', 'remedied'],
      improve: ['improved', 'enhanced', 'optimized', 'upgraded', 'refined', 'streamlined', 'polished', 'boosted'],
      update: ['updated', 'modified', 'changed', 'revised', 'adjusted', 'tweaked', 'altered', 'refactored'],
      remove: ['removed', 'deleted', 'eliminated', 'cleaned', 'stripped', 'cleared', 'purged'],
      configure: ['configured', 'set up', 'established', 'initialized', 'arranged', 'organized']
    };

    // TECHNICAL DOMAINS (what AI claims to work on)
    this.technicalDomains = {
      errorHandling: [
        'error handling', 'exception handling', 'try catch', 'error management',
        'exception management', 'fault tolerance', 'error recovery', 'crash prevention',
        'robust error handling', 'graceful degradation', 'error boundaries'
      ],
      
      async: [
        'async', 'await', 'asynchronous', 'promises', 'concurrent', 'parallel',
        'non-blocking', 'async/await', 'promise chains', 'async operations'
      ],
      
      responsive: [
        'responsive', 'mobile-friendly', 'responsive design', 'breakpoints',
        'media queries', 'adaptive', 'mobile responsive', 'tablet responsive',
        'cross-device', 'responsive layout', 'mobile optimization'
      ],
      
      performance: [
        'performance', 'optimization', 'speed', 'faster', 'efficient', 'optimized',
        'performance boost', 'load time', 'bundle size', 'lazy loading',
        'caching', 'memory optimization', 'cpu optimization'
      ],
      
      security: [
        'security', 'secure', 'authentication', 'authorization', 'validation',
        'sanitization', 'csrf protection', 'xss prevention', 'sql injection',
        'secure coding', 'vulnerability fixes', 'security hardening'
      ]
    };

    // CONFIDENCE INDICATORS (how AI expresses certainty)
    this.confidenceIndicators = [
      '✅', '✓', 'done', 'completed', 'finished', 'implemented',
      'now', 'should work', 'will work', 'properly', 'correctly',
      'successfully', 'all set', 'ready', 'good to go'
    ];
  }

  detectClaims(text) {
    const claims = [];
    const lowerText = text.toLowerCase();
    
    // Find action + domain combinations
    for (const [actionType, actionWords] of Object.entries(this.actionVerbs)) {
      for (const actionWord of actionWords) {
        if (lowerText.includes(actionWord)) {
          
          // Find nearby technical domains
          for (const [domainType, domainPhrases] of Object.entries(this.technicalDomains)) {
            for (const phrase of domainPhrases) {
              if (lowerText.includes(phrase)) {
                claims.push({
                  action: actionType,
                  domain: domainType,
                  claim: `${actionWord} ${phrase}`,
                  confidence: 0.8
                });
              }
            }
          }
        }
      }
    }
    
    // Check for confidence indicators
    for (const indicator of this.confidenceIndicators) {
      if (lowerText.includes(indicator.toLowerCase())) {
        claims.forEach(claim => claim.confidence += 0.1);
      }
    }
    
    return claims;
  }

  runTests() {
    const testCases = [
      "✅ I've added comprehensive error handling throughout the application",
      "Fixed the responsive design issues on mobile devices",  
      "The authentication system has been implemented with JWT tokens",
      "Now the app supports dark mode with CSS custom properties",
      "Added async/await to improve performance across all API calls",
      "I updated the styling to be more accessible with proper ARIA labels",
      "Resolved the issue with memory leaks in the React components",
      "Implemented robust input validation using Joi schema",
      "The tests are now passing with 95% code coverage",
      "Enhanced the user interface with modern CSS Grid layout",
      "Built a secure login system with password encryption",
      "Optimized the bundle size for faster load times",
      "Created responsive breakpoints for tablet and mobile",
      "Established proper error boundaries in React components",
      "Streamlined the async operations for better performance"
    ];
    
    console.log('🔍 Testing Smart Claim Detector - Keyword Bank\n');
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const claims = this.detectClaims(testCase);
      
      console.log(`Test ${i + 1}: "${testCase}"`);
      console.log(`Detected ${claims.length} claims:`);
      
      for (const claim of claims) {
        console.log(`  🎯 ${claim.action} → ${claim.domain} (${Math.round(claim.confidence * 100)}% confidence)`);
        console.log(`     Pattern: "${claim.claim}"`);
      }
      
      console.log('');
    }
  }
}

const detector = new SmartClaimDetector();
detector.runTests(); 