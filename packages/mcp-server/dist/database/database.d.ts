import { DatabaseConfig, ConversationContext, ConversationMessage, AIClaim, FileChange, AnalysisResult, WatchSession, UserContext } from '../types/index.js';
export declare class Database {
    private db;
    private config;
    private isInitialized;
    constructor(config: DatabaseConfig);
    initialize(): Promise<void>;
    createSession(context: ConversationContext): Promise<void>;
    getSession(sessionId: string): Promise<WatchSession | null>;
    endSession(sessionId: string): Promise<void>;
    logMessage(message: ConversationMessage): Promise<void>;
    saveClaim(claim: AIClaim): Promise<void>;
    getClaimsBySession(sessionId: string): Promise<AIClaim[]>;
    updateClaimStatus(claimId: string, status: string): Promise<void>;
    logFileChange(change: FileChange): Promise<void>;
    getFileChangesBySession(sessionId: string): Promise<FileChange[]>;
    saveAnalysisResult(result: AnalysisResult): Promise<void>;
    getAnalysesBySession(sessionId: string): Promise<AnalysisResult[]>;
    getRecentAnalyses(sessionId: string, limit?: number): Promise<AnalysisResult[]>;
    createUser(email: string, plan?: string): Promise<string>;
    getUserById(userId: string): Promise<UserContext | null>;
    getUserByEmail(email: string): Promise<UserContext | null>;
    createAPIKey(userId: string, keyHash: string, name?: string): Promise<string>;
    getUserByAPIKeyHash(keyHash: string): Promise<UserContext | null>;
    updateSessionStats(sessionId: string): Promise<void>;
    cleanup(): Promise<void>;
    close(): Promise<void>;
    isHealthy(): boolean;
}
//# sourceMappingURL=database.d.ts.map