import { AIClaim, FileChange, AnalysisResult } from '../types/index.js';
/**
 * Base class for all SlopWatch detectors
 * Each detector specializes in detecting lies for specific types of AI claims
 */
export declare abstract class BaseDetector {
    protected name: string;
    protected confidenceThreshold: number;
    protected enabled: boolean;
    constructor(name: string, confidenceThreshold?: number);
    /**
     * Determine if this detector can handle the given claim
     */
    abstract canHandle(claim: AIClaim): boolean;
    /**
     * Analyze a claim against actual file changes
     */
    abstract analyze(claim: AIClaim, changes: FileChange[], sessionId: string): Promise<AnalysisResult>;
    /**
     * Get the detector's name
     */
    getName(): string;
    /**
     * Check if detector is enabled
     */
    isEnabled(): boolean;
    /**
     * Enable or disable the detector
     */
    setEnabled(enabled: boolean): void;
    /**
     * Get confidence threshold
     */
    getConfidenceThreshold(): number;
    /**
     * Set confidence threshold
     */
    setConfidenceThreshold(threshold: number): void;
    /**
     * Create a verified result
     */
    protected createVerifiedResult(claim: AIClaim, sessionId: string, reason: string, confidence: number, evidence?: string[]): AnalysisResult;
    /**
     * Create a lie result
     */
    protected createLieResult(claim: AIClaim, sessionId: string, reason: string, confidence: number, evidence?: string[]): AnalysisResult;
    /**
     * Create a partial result
     */
    protected createPartialResult(claim: AIClaim, sessionId: string, reason: string, confidence: number, evidence?: string[]): AnalysisResult;
    /**
     * Create an unknown result
     */
    protected createUnknownResult(claim: AIClaim, sessionId: string, reason: string, confidence?: number): AnalysisResult;
    /**
     * Utility method to check if file is of specific type
     */
    protected isFileType(filePath: string, extensions: string[]): boolean;
    /**
     * Utility method to extract file extension
     */
    protected getFileExtension(filePath: string): string;
    /**
     * Utility method to check if diff contains specific patterns
     */
    protected diffContains(diff: string, patterns: string[]): boolean;
    /**
     * Utility method to count lines in diff
     */
    protected countDiffLines(diff: string): {
        added: number;
        removed: number;
    };
    /**
     * Utility method to extract method/function names from diff
     */
    protected extractFunctionNames(diff: string): string[];
    /**
     * Utility method to extract CSS selectors from diff
     */
    protected extractCSSSelectors(diff: string): string[];
    /**
     * Utility method to check for import/require statements
     */
    protected hasImportStatements(diff: string, modules?: string[]): boolean;
    /**
     * Log analysis start
     */
    protected logAnalysisStart(claim: AIClaim): void;
    /**
     * Log analysis result
     */
    protected logAnalysisResult(result: AnalysisResult): void;
    /**
     * Validate analysis input
     */
    protected validateInput(claim: AIClaim, changes: FileChange[]): void;
}
//# sourceMappingURL=base-detector.d.ts.map