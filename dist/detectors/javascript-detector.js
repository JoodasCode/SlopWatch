/**
 * SlopWatch MCP Server - JavaScript/TypeScript Detector
 * Copyright (c) 2025 SlopWatch Team
 */
import { BaseDetector } from './base-detector.js';
export class JavaScriptDetector extends BaseDetector {
    language = 'javascript';
    patterns = [
        // Error Handling Patterns
        {
            name: 'try_catch_blocks',
            regex: /try\s*\{[\s\S]*?\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*?\}/g,
            category: 'error_handling',
            weight: 0.9,
            description: 'Try-catch error handling blocks'
        },
        {
            name: 'throw_statements',
            regex: /throw\s+(?:new\s+)?[\w.]+(?:\([^)]*\))?/g,
            category: 'error_handling',
            weight: 0.7,
            description: 'Throw statements for error handling'
        },
        {
            name: 'error_objects',
            regex: /new\s+Error\s*\(/g,
            category: 'error_handling',
            weight: 0.6,
            description: 'Error object instantiation'
        },
        // Async/Await Patterns
        {
            name: 'async_functions',
            regex: /(?:async\s+)?function\s*\w*\s*\([^)]*\)\s*\{[\s\S]*?await[\s\S]*?\}|async\s*\([^)]*\)\s*=>/g,
            category: 'async_await',
            weight: 0.8,
            description: 'Async functions with await'
        },
        {
            name: 'await_expressions',
            regex: /await\s+[\w.()[\]]+/g,
            category: 'async_await',
            weight: 0.9,
            description: 'Await expressions'
        },
        {
            name: 'promise_chains',
            regex: /\.then\s*\([^)]*\)(?:\s*\.catch\s*\([^)]*\))?/g,
            category: 'async_promises',
            weight: 0.7,
            description: 'Promise chains with then/catch'
        },
        {
            name: 'promise_all',
            regex: /Promise\.(?:all|allSettled|race)\s*\(/g,
            category: 'async_promises',
            weight: 0.8,
            description: 'Promise utility methods'
        },
        // Validation Patterns
        {
            name: 'input_validation',
            regex: /(?:if\s*\(|&&|\|\|)\s*(?:!?\w+|typeof\s+\w+|Array\.isArray\s*\(\w+\)|Number\.isNaN\s*\(\w+\))/g,
            category: 'validation',
            weight: 0.6,
            description: 'Input validation checks'
        },
        {
            name: 'null_checks',
            regex: /(?:===|!==|==|!=)\s*(?:null|undefined)|(?:null|undefined)\s*(?:===|!==|==|!=)/g,
            category: 'validation',
            weight: 0.7,
            description: 'Null and undefined checks'
        },
        {
            name: 'type_checks',
            regex: /typeof\s+\w+\s*(?:===|!==|==|!=)\s*['"](?:string|number|boolean|object|function|undefined)['"]|['"](?:string|number|boolean|object|function|undefined)['"]\s*(?:===|!==|==|!=)\s*typeof\s+\w+/g,
            category: 'validation',
            weight: 0.8,
            description: 'Type validation checks'
        },
        // Performance Patterns
        {
            name: 'memoization',
            regex: /(?:useMemo|useCallback|memo)\s*\(|(?:const|let|var)\s+\w+\s*=\s*(?:new\s+)?Map\s*\(\)|cache|memoize/g,
            category: 'performance_optimization',
            weight: 0.7,
            description: 'Memoization and caching patterns'
        },
        {
            name: 'debounce_throttle',
            regex: /(?:debounce|throttle|setTimeout|clearTimeout|setInterval|clearInterval)\s*\(/g,
            category: 'performance_optimization',
            weight: 0.6,
            description: 'Debouncing and throttling patterns'
        },
        {
            name: 'lazy_loading',
            regex: /(?:lazy|Suspense|import\s*\(|dynamic\s*\()/g,
            category: 'performance_optimization',
            weight: 0.8,
            description: 'Lazy loading patterns'
        },
        // Security Patterns
        {
            name: 'sanitization',
            regex: /(?:escape|sanitize|encodeURI|encodeURIComponent|textContent|innerText)/g,
            category: 'security',
            weight: 0.8,
            description: 'Input sanitization and encoding'
        },
        {
            name: 'csrf_protection',
            regex: /(?:csrf|xsrf)(?:Token|Protection)|X-CSRF-TOKEN/gi,
            category: 'security',
            weight: 0.9,
            description: 'CSRF protection mechanisms'
        },
        // Testing Patterns
        {
            name: 'test_functions',
            regex: /(?:describe|it|test|expect|assert|beforeEach|afterEach)\s*\(/g,
            category: 'testing',
            weight: 0.7,
            description: 'Test functions and assertions'
        },
        {
            name: 'mock_patterns',
            regex: /(?:mock|spy|stub|jest\.fn|sinon\.|chai\.)/g,
            category: 'testing',
            weight: 0.8,
            description: 'Mocking and testing utilities'
        },
        // Documentation Patterns
        {
            name: 'jsdoc_comments',
            regex: /\/\*\*[\s\S]*?\*\//g,
            category: 'documentation',
            weight: 0.5,
            description: 'JSDoc documentation comments'
        },
        {
            name: 'inline_comments',
            regex: /\/\/.*$/gm,
            category: 'documentation',
            weight: 0.3,
            description: 'Inline code comments'
        },
        // TypeScript Specific Patterns
        {
            name: 'type_annotations',
            regex: /:\s*(?:string|number|boolean|object|any|unknown|never|void|\w+(?:\[\])?)\s*[=;,)]/g,
            category: 'typescript_types',
            weight: 0.8,
            description: 'TypeScript type annotations'
        },
        {
            name: 'interfaces',
            regex: /interface\s+\w+\s*\{[\s\S]*?\}/g,
            category: 'typescript_types',
            weight: 0.9,
            description: 'TypeScript interfaces'
        },
        {
            name: 'generic_types',
            regex: /<[A-Z]\w*(?:\s*,\s*[A-Z]\w*)*>/g,
            category: 'typescript_types',
            weight: 0.7,
            description: 'Generic type parameters'
        },
        // Modern JavaScript Patterns
        {
            name: 'destructuring',
            regex: /(?:const|let|var)\s*\{[^}]+\}\s*=|(?:const|let|var)\s*\[[^\]]+\]\s*=/g,
            category: 'modern_javascript',
            weight: 0.5,
            description: 'Destructuring assignments'
        },
        {
            name: 'arrow_functions',
            regex: /(?:\w+\s*=\s*)?(?:\([^)]*\)|[^=\s]+)\s*=>\s*[\{|(?!.*\{)]/g,
            category: 'modern_javascript',
            weight: 0.4,
            description: 'Arrow function expressions'
        },
        {
            name: 'template_literals',
            regex: /`[^`]*\$\{[^}]+\}[^`]*`/g,
            category: 'modern_javascript',
            weight: 0.4,
            description: 'Template literal expressions'
        }
    ];
    isPatternRelevantToClaim(pattern, normalizedClaim) {
        // Enhanced relevance checking for JavaScript-specific claims
        const jsSpecificMappings = {
            error_handling: ['error', 'exception', 'try', 'catch', 'throw', 'handling', 'robust'],
            async_await: ['async', 'await', 'asynchronous', 'promise', 'concurrent'],
            async_promises: ['promise', 'async', 'then', 'catch', 'asynchronous'],
            validation: ['validate', 'validation', 'check', 'verify', 'sanitize', 'input'],
            performance_optimization: ['performance', 'optimize', 'optimization', 'fast', 'efficient', 'cache', 'memo'],
            security: ['secure', 'security', 'safe', 'sanitize', 'xss', 'csrf', 'injection'],
            testing: ['test', 'testing', 'spec', 'unit', 'integration', 'coverage'],
            documentation: ['document', 'documentation', 'comment', 'jsdoc', 'annotate'],
            typescript_types: ['type', 'types', 'typing', 'interface', 'generic', 'strict'],
            modern_javascript: ['modern', 'es6', 'es2015', 'destructure', 'arrow', 'template']
        };
        const mappedKeywords = jsSpecificMappings[pattern.category] || this.extractKeywords(pattern.category);
        return mappedKeywords.some(keyword => normalizedClaim.includes(keyword)) ||
            super.isPatternRelevantToClaim(pattern, normalizedClaim);
    }
    calculatePatternConfidence(pattern, matches, normalizedClaim) {
        const baseConfidence = super.calculatePatternConfidence(pattern, matches, normalizedClaim);
        // Boost confidence for critical patterns in JavaScript
        if (pattern.category === 'error_handling' && normalizedClaim.includes('error')) {
            return Math.min(baseConfidence * 1.2, 1.0);
        }
        if (pattern.category === 'async_await' && normalizedClaim.includes('async')) {
            return Math.min(baseConfidence * 1.1, 1.0);
        }
        return baseConfidence;
    }
}
//# sourceMappingURL=javascript-detector.js.map