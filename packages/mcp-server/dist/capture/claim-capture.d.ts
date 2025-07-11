import { EventEmitter } from 'events';
export interface AIClaim {
    id: string;
    text: string;
    type: 'css' | 'js' | 'ts' | 'react' | 'html' | 'build' | 'test' | 'generic';
    action: 'add' | 'fix' | 'modify' | 'remove' | 'optimize' | 'refactor' | 'create';
    target: string;
    confidence: number;
    timestamp: number;
    conversationId?: string;
    userId?: string;
    metadata?: Record<string, any>;
}
export interface ConversationMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}
export declare class ClaimCaptureSystem extends EventEmitter {
    private claims;
    private conversations;
    private readonly CLAIM_PATTERNS;
    constructor();
    captureMessage(message: ConversationMessage, conversationId: string): AIClaim[];
    private extractClaimsFromText;
    private splitIntoSentences;
    private calculateConfidence;
    addClaim(text: string, type?: AIClaim['type'], action?: AIClaim['action']): AIClaim;
    getRecentClaims(since?: number): AIClaim[];
    getClaim(id: string): AIClaim | undefined;
    getConversation(conversationId: string): ConversationMessage[];
    cleanup(olderThan?: number): void;
    getStats(): {
        totalClaims: number;
        claimsByType: Record<string, number>;
        recentActivity: number;
    };
}
export declare function createClaimCapture(): ClaimCaptureSystem;
//# sourceMappingURL=claim-capture.d.ts.map