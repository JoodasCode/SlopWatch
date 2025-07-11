import { EventEmitter } from 'events';
export class ClaimCaptureSystem extends EventEmitter {
    claims = new Map();
    conversations = new Map();
    // Patterns to detect AI claims
    CLAIM_PATTERNS = [
        // CSS/Styling claims
        {
            pattern: /(?:made|created|added|implemented)\s+(?:the\s+)?(?:header|footer|button|layout|component)?\s*(?:responsive|mobile-friendly)/i,
            type: 'css',
            action: 'modify',
            target: 'responsive design'
        },
        {
            pattern: /(?:changed|updated|modified)\s+(?:the\s+)?(?:color|background|styling|css)/i,
            type: 'css',
            action: 'modify',
            target: 'styling'
        },
        {
            pattern: /(?:added|implemented)\s+(?:media\s+queries|breakpoints|responsive\s+styles)/i,
            type: 'css',
            action: 'add',
            target: 'media queries'
        },
        // JavaScript/TypeScript claims
        {
            pattern: /(?:added|implemented|created)\s+(?:comprehensive\s+)?(?:error\s+handling|try-catch|exception\s+handling)/i,
            type: 'js',
            action: 'add',
            target: 'error handling'
        },
        {
            pattern: /(?:optimized|improved|enhanced)\s+(?:the\s+)?(?:performance|database\s+queries|api\s+calls)/i,
            type: 'js',
            action: 'optimize',
            target: 'performance'
        },
        {
            pattern: /(?:added|implemented|created)\s+(?:typescript\s+)?(?:types|interfaces|type\s+definitions)/i,
            type: 'ts',
            action: 'add',
            target: 'types'
        },
        // React claims
        {
            pattern: /(?:created|added|implemented)\s+(?:a\s+)?(?:react\s+)?(?:component|hook|context)/i,
            type: 'react',
            action: 'create',
            target: 'component'
        },
        {
            pattern: /(?:added|implemented)\s+(?:state\s+management|useState|useEffect|context)/i,
            type: 'react',
            action: 'add',
            target: 'state management'
        },
        // Build/Configuration claims
        {
            pattern: /(?:configured|setup|added)\s+(?:webpack|vite|rollup|build\s+process)/i,
            type: 'build',
            action: 'add',
            target: 'build configuration'
        },
        // Test claims
        {
            pattern: /(?:added|wrote|created|implemented)\s+(?:unit\s+)?(?:tests|test\s+cases|testing)/i,
            type: 'test',
            action: 'add',
            target: 'tests'
        },
        // Generic programming claims
        {
            pattern: /(?:refactored|restructured|reorganized)\s+(?:the\s+)?(?:code|codebase|functions|components)/i,
            type: 'generic',
            action: 'refactor',
            target: 'code structure'
        },
        {
            pattern: /(?:fixed|resolved|solved)\s+(?:the\s+)?(?:bug|issue|error|problem)/i,
            type: 'generic',
            action: 'fix',
            target: 'bug fix'
        }
    ];
    constructor() {
        super();
    }
    // Capture a conversation message and extract claims
    captureMessage(message, conversationId) {
        // Store the message
        if (!this.conversations.has(conversationId)) {
            this.conversations.set(conversationId, []);
        }
        this.conversations.get(conversationId).push(message);
        // Only extract claims from AI responses
        if (message.role !== 'assistant') {
            return [];
        }
        const claims = this.extractClaimsFromText(message.content, {
            conversationId,
            messageId: message.id
        });
        // Store and emit claims
        claims.forEach(claim => {
            this.claims.set(claim.id, claim);
            this.emit('claim', claim);
        });
        return claims;
    }
    // Extract claims from text using pattern matching
    extractClaimsFromText(text, metadata = {}) {
        const claims = [];
        const sentences = this.splitIntoSentences(text);
        for (const sentence of sentences) {
            for (const pattern of this.CLAIM_PATTERNS) {
                const match = sentence.match(pattern.pattern);
                if (match) {
                    const claim = {
                        id: `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        text: sentence.trim(),
                        type: pattern.type,
                        action: pattern.action,
                        target: pattern.target,
                        confidence: this.calculateConfidence(sentence, pattern.pattern),
                        timestamp: Date.now(),
                        metadata
                    };
                    claims.push(claim);
                    break; // Don't match multiple patterns for the same sentence
                }
            }
        }
        return claims;
    }
    // Split text into sentences for better claim extraction
    splitIntoSentences(text) {
        return text
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 10); // Filter out very short fragments
    }
    // Calculate confidence based on pattern strength and context
    calculateConfidence(sentence, pattern) {
        let confidence = 0.7; // Base confidence
        // Boost confidence for specific technical terms
        const technicalTerms = [
            'implemented', 'optimized', 'refactored', 'configured',
            'media queries', 'try-catch', 'typescript', 'error handling',
            'responsive', 'component', 'function', 'class'
        ];
        const technicalMatches = technicalTerms.filter(term => sentence.toLowerCase().includes(term.toLowerCase())).length;
        confidence += technicalMatches * 0.05;
        // Reduce confidence for vague language
        const vagueTerms = ['might', 'maybe', 'probably', 'seems', 'appears'];
        const vagueMatches = vagueTerms.filter(term => sentence.toLowerCase().includes(term.toLowerCase())).length;
        confidence -= vagueMatches * 0.1;
        // Boost confidence for action-oriented language
        if (/\b(added|created|implemented|fixed|optimized)\b/i.test(sentence)) {
            confidence += 0.1;
        }
        return Math.max(0.3, Math.min(0.95, confidence));
    }
    // Manual claim entry (for testing or manual input)
    addClaim(text, type, action) {
        // Try to auto-detect if not specified
        const detectedClaims = this.extractClaimsFromText(text);
        const claim = {
            id: `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: text.trim(),
            type: type || detectedClaims[0]?.type || 'generic',
            action: action || detectedClaims[0]?.action || 'modify',
            target: detectedClaims[0]?.target || 'code',
            confidence: detectedClaims[0]?.confidence || 0.8,
            timestamp: Date.now()
        };
        this.claims.set(claim.id, claim);
        this.emit('claim', claim);
        return claim;
    }
    // Get recent claims for analysis
    getRecentClaims(since = Date.now() - 300000) {
        return Array.from(this.claims.values())
            .filter(claim => claim.timestamp >= since)
            .sort((a, b) => b.timestamp - a.timestamp);
    }
    // Get claim by ID
    getClaim(id) {
        return this.claims.get(id);
    }
    // Get conversation history
    getConversation(conversationId) {
        return this.conversations.get(conversationId) || [];
    }
    // Clear old data (for memory management)
    cleanup(olderThan = Date.now() - 86400000) {
        // Clean up old claims
        for (const [id, claim] of this.claims.entries()) {
            if (claim.timestamp < olderThan) {
                this.claims.delete(id);
            }
        }
        // Clean up old conversations
        for (const [id, messages] of this.conversations.entries()) {
            const recentMessages = messages.filter(msg => msg.timestamp >= olderThan);
            if (recentMessages.length === 0) {
                this.conversations.delete(id);
            }
            else {
                this.conversations.set(id, recentMessages);
            }
        }
    }
    // Get statistics
    getStats() {
        const claims = Array.from(this.claims.values());
        const recentClaims = this.getRecentClaims();
        const claimsByType = claims.reduce((acc, claim) => {
            acc[claim.type] = (acc[claim.type] || 0) + 1;
            return acc;
        }, {});
        return {
            totalClaims: claims.length,
            claimsByType,
            recentActivity: recentClaims.length
        };
    }
}
// Factory function
export function createClaimCapture() {
    return new ClaimCaptureSystem();
}
//# sourceMappingURL=claim-capture.js.map