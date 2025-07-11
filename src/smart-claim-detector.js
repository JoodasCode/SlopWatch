#!/usr/bin/env node

/**
 * Smart Claim Detector - Catches AI lies regardless of phrasing
 * Uses multiple detection strategies to identify claims in any format
 */

class SmartClaimDetector {
  constructor() {
    this.initializeKeywordBank();
    this.initializePatterns();
  }

  initializeKeywordBank() {
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
      ],
      
      accessibility: [
        'accessibility', 'a11y', 'screen reader', 'aria', 'semantic html',
        'keyboard navigation', 'focus management', 'alt text', 'wcag',
        'inclusive design', 'accessible design'
      ],
      
      testing: [
        'testing', 'tests', 'unit tests', 'integration tests', 'e2e tests',
        'test coverage', 'test cases', 'testing framework', 'automated tests',
        'test suite', 'quality assurance'
      ],
      
      styling: [
        'styling', 'css', 'styles', 'design', 'layout', 'ui', 'user interface',
        'visual design', 'theme', 'colors', 'typography', 'spacing'
      ]
    };

    // CONFIDENCE INDICATORS (how AI expresses certainty)
    this.confidenceIndicators = [
      '✅', '✓', 'done', 'completed', 'finished', 'implemented',
      'now', 'should work', 'will work', 'properly', 'correctly',
      'successfully', 'all set', 'ready', 'good to go'
    ];

    // VAGUE QUALIFIERS (AI uses these to seem thorough)
    this.vageQualifiers = [
      'comprehensive', 'robust', 'complete', 'thorough', 'proper',
      'full', 'entire', 'whole', 'all', 'every', 'across the board'
    ];
  }

  initializePatterns() {
    // SENTENCE PATTERNS (how AI structures claims)
    this.sentencePatterns = [
      // Direct claims: "I added error handling"
      /I (?:have )?(\w+ed) (.+)/gi,
      
      // Passive claims: "Error handling has been added"
      /(.+) (?:has|have) been (\w+ed)/gi,
      
      // Confident claims: "✅ Fixed the responsive design"
      /[✅✓]\s*(.+)/gi,
      
      // "Now" claims: "Now the app supports dark mode"
      /(?:now|this) (.+) (?:supports?|works?|includes?|has) (.+)/gi,
      
      // Feature claims: "Added support for async operations"
      /(?:added|implemented) support for (.+)/gi,
      
      // Problem-solution: "Fixed the issue with mobile responsiveness"
      /(?:fixed|resolved|addressed) (?:the )?(?:issue|problem|bug) (?:with|in|for) (.+)/gi,
      
      // Improvement claims: "Improved performance across the app"
      /(?:improved|enhanced|optimized) (.+)/gi,
      
      // Update claims: "Updated the styling to be more responsive"
      /(?:updated|modified|changed) (.+) to (?:be )?(.+)/gi
    ];

    // CONTEXT PATTERNS (surrounding context that indicates AI claims)
    this.contextPatterns = [
      // Code block references
      /(?:in the|to the|for the) (?:above|following|updated) code/gi,
      
      // File references  
      /(?:in|to|for) (?:this|the) (?:file|component|function|method)/gi,
      
      // Implementation details
      /(?:using|with|via|through) (?:a|an|the) (.+) (?:approach|method|pattern|library)/gi
    ];
  }

  /**
   * Main detection method - analyzes text for AI claims
   */
  detectClaims(text) {
    const claims = [];
    
    // Strategy 1: Pattern-based detection
    claims.push(...this.detectByPatterns(text));
    
    // Strategy 2: Keyword combination detection  
    claims.push(...this.detectByKeywordCombinations(text));
    
    // Strategy 3: Semantic analysis
    claims.push(...this.detectBySemantic(text));
    
    // Strategy 4: Confidence indicator detection
    claims.push(...this.detectByConfidenceIndicators(text));
    
    // Deduplicate and score claims
    return this.deduplicateAndScore(claims);
  }

  detectByPatterns(text) {
    const claims = [];
    
    for (const pattern of this.sentencePatterns) {
      const matches = [...text.matchAll(pattern)];
      
      for (const match of matches) {
        claims.push({
          type: 'pattern',
          claim: match[0].trim(),
          confidence: 0.8,
          action: this.extractAction(match[0]),
          domain: this.extractDomain(match[0]),
          source: 'sentence_pattern'
        });
      }
    }
    
    return claims;
  }

  detectByKeywordCombinations(text) {
    const claims = [];
    const words = text.toLowerCase().split(/\s+/);
    
    // Look for action + domain combinations
    for (const [actionType, actionWords] of Object.entries(this.actionVerbs)) {
      for (const actionWord of actionWords) {
        if (words.includes(actionWord)) {
          
          // Find nearby technical domains
          for (const [domainType, domainPhrases] of Object.entries(this.technicalDomains)) {
            for (const phrase of domainPhrases) {
              if (text.toLowerCase().includes(phrase)) {
                
                // Calculate proximity score
                const actionIndex = words.indexOf(actionWord);
                const phraseIndex = text.toLowerCase().indexOf(phrase);
                const distance = Math.abs(actionIndex - phraseIndex);
                
                if (distance < 20) { // Within 20 words
                  claims.push({
                    type: 'keyword_combination',
                    claim: `${actionWord} ${phrase}`,
                    confidence: Math.max(0.3, 1 - (distance / 100)),
                    action: actionType,
                    domain: domainType,
                    source: 'keyword_proximity'
                  });
                }
              }
            }
          }
        }
      }
    }
    
    return claims;
  }

  detectBySemantic(text) {
    const claims = [];
    
    // Look for semantic patterns that indicate work completion
    const semanticIndicators = [
      // Before/after comparisons
      /(?:before|previously) .+ (?:but )?now .+/gi,
      
      // Problem statements followed by solutions  
      /(?:the issue was|problem was|bug was) .+ (?:so I|I then|I've) .+/gi,
      
      // Feature descriptions
      /(?:this|the) (?:feature|functionality|capability) (?:allows|enables|provides) .+/gi,
      
      // Implementation explanations
      /(?:by (?:using|adding|implementing)|through the use of) .+ (?:I|we) (?:can|will|have) .+/gi
    ];
    
    for (const pattern of semanticIndicators) {
      const matches = [...text.matchAll(pattern)];
      
      for (const match of matches) {
        claims.push({
          type: 'semantic',
          claim: match[0].trim(),
          confidence: 0.6,
          action: this.extractAction(match[0]),
          domain: this.extractDomain(match[0]),
          source: 'semantic_pattern'
        });
      }
    }
    
    return claims;
  }

  detectByConfidenceIndicators(text) {
    const claims = [];
    
    for (const indicator of this.confidenceIndicators) {
      if (text.toLowerCase().includes(indicator.toLowerCase())) {
        
        // Extract the sentence containing the confidence indicator
        const sentences = text.split(/[.!?]+/);
        
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes(indicator.toLowerCase())) {
            
            // Check if sentence contains technical content
            let hasTechnicalContent = false;
            
            for (const domainPhrases of Object.values(this.technicalDomains)) {
              for (const phrase of domainPhrases) {
                if (sentence.toLowerCase().includes(phrase)) {
                  hasTechnicalContent = true;
                  break;
                }
              }
              if (hasTechnicalContent) break;
            }
            
            if (hasTechnicalContent) {
              claims.push({
                type: 'confidence',
                claim: sentence.trim(),
                confidence: 0.9, // High confidence when AI uses confident language
                action: this.extractAction(sentence),
                domain: this.extractDomain(sentence),
                source: 'confidence_indicator'
              });
            }
          }
        }
      }
    }
    
    return claims;
  }

  extractAction(text) {
    const lowerText = text.toLowerCase();
    
    for (const [actionType, actionWords] of Object.entries(this.actionVerbs)) {
      for (const word of actionWords) {
        if (lowerText.includes(word)) {
          return actionType;
        }
      }
    }
    
    return 'unknown';
  }

  extractDomain(text) {
    const lowerText = text.toLowerCase();
    
    for (const [domainType, domainPhrases] of Object.entries(this.technicalDomains)) {
      for (const phrase of domainPhrases) {
        if (lowerText.includes(phrase)) {
          return domainType;
        }
      }
    }
    
    return 'general';
  }

  deduplicateAndScore(claims) {
    // Group similar claims
    const grouped = {};
    
    for (const claim of claims) {
      const key = `${claim.action}_${claim.domain}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      
      grouped[key].push(claim);
    }
    
    // Select best claim from each group
    const deduplicated = [];
    
    for (const [key, claimGroup] of Object.entries(grouped)) {
      // Sort by confidence, take highest
      claimGroup.sort((a, b) => b.confidence - a.confidence);
      
      const bestClaim = claimGroup[0];
      
      // Boost confidence if multiple detection methods agree
      if (claimGroup.length > 1) {
        bestClaim.confidence = Math.min(0.95, bestClaim.confidence + (claimGroup.length - 1) * 0.1);
        bestClaim.sources = claimGroup.map(c => c.source);
      }
      
      deduplicated.push(bestClaim);
    }
    
    return deduplicated.filter(claim => claim.confidence > 0.3);
  }

  /**
   * Test the detector with various AI response styles
   */
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
      "Enhanced the user interface with modern CSS Grid layout"
    ];
    
    console.log('🔍 Testing Smart Claim Detector\n');
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const claims = this.detectClaims(testCase);
      
      console.log(`Test ${i + 1}: "${testCase}"`);
      console.log(`Detected ${claims.length} claims:`);
      
      for (const claim of claims) {
        console.log(`  🎯 ${claim.action} → ${claim.domain} (${Math.round(claim.confidence * 100)}% confidence)`);
        console.log(`     "${claim.claim}"`);
      }
      
      console.log('');
    }
  }
}

// Export for use in other modules
export { SmartClaimDetector };

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const detector = new SmartClaimDetector();
  detector.runTests();
} 