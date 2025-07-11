export interface ConversationContext {
    sessionId: string;
    projectPath: string;
    userId: string;
    timestamp: number;
}
export interface ConversationMessage {
    id: string;
    sessionId: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: number;
    claims?: AIClaim[];
}
export interface AIClaim {
    id: string;
    text: string;
    type: 'css' | 'js' | 'build' | 'test' | 'generic';
    action: 'add' | 'fix' | 'modify' | 'remove' | 'optimize';
    target: string;
    extractedFrom: string;
    confidence: number;
}
export interface FileChange {
    id: string;
    sessionId: string;
    type: 'add' | 'modify' | 'delete';
    path: string;
    diff: string;
    timestamp: number;
    size?: number;
    linesAdded?: number;
    linesRemoved?: number;
}
export interface AnalysisResult {
    id: string;
    sessionId: string;
    claimId: string;
    status: 'verified' | 'lie' | 'partial' | 'unknown';
    confidence: number;
    reason: string;
    timestamp: number;
    detector: string;
    evidence?: string[];
}
export interface WatchSession {
    id: string;
    projectPath: string;
    startTime: number;
    endTime?: number;
    changes: FileChange[];
    claims: AIClaim[];
    analyses: AnalysisResult[];
}
export interface UserContext {
    userId: string;
    email: string;
    plan: 'free' | 'pro' | 'enterprise';
    apiKey: string;
}
export interface DatabaseConfig {
    path: string;
    enableWAL: boolean;
    enableForeignKeys: boolean;
}
export interface WebSocketEvent {
    type: string;
    data: any;
    timestamp: number;
    sessionId?: string;
}
export interface DetectorConfig {
    name: string;
    enabled: boolean;
    confidence: number;
    patterns: string[];
}
export interface ProjectConfig {
    name: string;
    path: string;
    watchPatterns: string[];
    ignorePatterns: string[];
    detectors: Record<string, DetectorConfig>;
}
export interface UserInputEvent extends WebSocketEvent {
    type: 'user_input';
    data: {
        message: string;
        sessionId: string;
    };
}
export interface AIResponseEvent extends WebSocketEvent {
    type: 'ai_response';
    data: {
        response: string;
        claims: AIClaim[];
        sessionId: string;
    };
}
export interface FileChangeEvent extends WebSocketEvent {
    type: 'file_change';
    data: FileChange;
}
export interface LieDetectedEvent extends WebSocketEvent {
    type: 'lie_detected';
    data: {
        claim: string;
        reason: string;
        confidence: number;
        sessionId: string;
    };
}
export interface AnalysisCompleteEvent extends WebSocketEvent {
    type: 'analysis_complete';
    data: AnalysisResult;
}
export interface SlopScoreUpdateEvent extends WebSocketEvent {
    type: 'slop_score_update';
    data: {
        score: number;
        sessionId: string;
    };
}
export interface ConnectionStatusEvent extends WebSocketEvent {
    type: 'connection_status';
    data: {
        status: 'connected' | 'disconnected' | 'error';
        message?: string;
    };
}
export interface MCPRequest {
    method: string;
    params?: any;
    id?: string | number;
}
export interface MCPResponse {
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
    id?: string | number;
}
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: any;
}
export declare class SlopWatchError extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
export declare class DetectorError extends SlopWatchError {
    detector: string;
    constructor(message: string, detector: string);
}
export declare class DatabaseError extends SlopWatchError {
    constructor(message: string);
}
export declare class AuthenticationError extends SlopWatchError {
    constructor(message: string);
}
//# sourceMappingURL=index.d.ts.map