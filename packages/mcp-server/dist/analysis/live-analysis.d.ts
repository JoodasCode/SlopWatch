import { EventEmitter } from 'events';
import { AIClaim as CaptureAIClaim } from '../capture/claim-capture.js';
import { BaseDetector } from '../detectors/base-detector.js';
import { FileChange } from '../types/index.js';
export interface LiveAnalysisResult {
    id: string;
    claimId: string;
    fileChanges: FileChange[];
    status: 'verified' | 'lie' | 'partial' | 'pending' | 'unknown';
    confidence: number;
    reason: string;
    detector: string;
    timestamp: number;
    details?: {
        expectedPatterns?: string[];
        foundPatterns?: string[];
        missingPatterns?: string[];
        analysis?: string;
    };
}
export interface LiveAnalysisOptions {
    projectPath: string;
    analysisWindow?: number;
    autoAnalyze?: boolean;
    detectors?: BaseDetector[];
}
export declare class LiveAnalysisEngine extends EventEmitter {
    private fileWatcher;
    private claimCapture;
    private detectors;
    private options;
    private recentChanges;
    private pendingClaims;
    private analysisResults;
    private analysisTimers;
    constructor(options: LiveAnalysisOptions);
    private setupEventListeners;
    start(): Promise<void>;
    stop(): Promise<void>;
    addClaim(text: string, type?: CaptureAIClaim['type']): CaptureAIClaim;
    addMessage(content: string, role: 'user' | 'assistant', conversationId?: string): CaptureAIClaim[];
    private handleFileChange;
    private handleNewClaim;
    private checkPendingClaims;
    private couldBeRelated;
    analyzeClaim(claimId: string): Promise<LiveAnalysisResult | null>;
    analyzeAllPending(): Promise<LiveAnalysisResult[]>;
    getRecentAnalyses(since?: number): LiveAnalysisResult[];
    getAnalysis(id: string): LiveAnalysisResult | undefined;
    calculateSlopScore(since?: number): number;
    getStats(): {
        totalClaims: number;
        totalAnalyses: number;
        pendingClaims: number;
        recentFileChanges: number;
        slopScore: number;
        statusBreakdown: Record<string, number>;
        detectorStats: Record<string, number>;
    };
    private cleanup;
}
export declare function createLiveAnalysis(projectPath: string, options?: Partial<LiveAnalysisOptions>): LiveAnalysisEngine;
//# sourceMappingURL=live-analysis.d.ts.map