/**
 * SlopWatch MCP Server - Base Detector Implementation
 * Copyright (c) 2025 SlopWatch Team
 */
import { IDetector, SupportedLanguage, FilePattern, FileContent, AnalysisResult, DetectedPattern, Evidence } from '../types/index.js';
export declare abstract class BaseDetector implements IDetector {
    abstract readonly language: SupportedLanguage;
    abstract readonly patterns: readonly FilePattern[];
    /**
     * Analyze files for the given claim
     */
    analyzeFiles(files: readonly FileContent[], claim: string): Promise<AnalysisResult>;
    /**
     * Detect patterns in content based on claim
     */
    detectPatterns(content: string, claim: string): DetectedPattern[];
    /**
     * Check if pattern is relevant to the claim
     */
    protected isPatternRelevantToClaim(pattern: FilePattern, normalizedClaim: string): boolean;
    /**
     * Find matches for a pattern in content
     */
    protected findMatches(content: string, pattern: FilePattern): string[];
    /**
     * Generate evidence from detected patterns
     */
    protected generateEvidence(file: FileContent, patterns: DetectedPattern[], claim: string): Evidence[];
    /**
     * Calculate confidence for a specific file
     */
    protected calculateFileConfidence(file: FileContent, patterns: DetectedPattern[], claim: string): number;
    /**
     * Calculate confidence for a specific pattern
     */
    protected calculatePatternConfidence(pattern: FilePattern, matches: string[], normalizedClaim: string): number;
    /**
     * Determine if claim expects this pattern to be present
     */
    protected claimExpectsPattern(pattern: FilePattern, normalizedClaim: string): boolean;
    /**
     * Check if absence of pattern is significant (indicates lie)
     */
    protected isAbsenceSignificant(pattern: FilePattern | undefined, normalizedClaim: string): boolean;
    /**
     * Calculate severity of missing pattern
     */
    protected calculateSeverity(patternName: string, normalizedClaim: string): Evidence['severity'];
    /**
     * Get pattern definition by name
     */
    protected getPatternByName(name: string): FilePattern | undefined;
    /**
     * Extract keywords from pattern category
     */
    protected extractKeywords(category: string): string[];
    /**
     * Get confidence that claim mentions this pattern
     */
    protected getClaimConfidence(pattern: FilePattern, normalizedClaim: string): number;
    /**
     * Determine if analysis indicates a lie
     */
    protected determineLieStatus(patterns: DetectedPattern[], evidence: Evidence[], claim: string, confidence: number): boolean;
    /**
     * Generate analysis summary
     */
    protected generateSummary(isLie: boolean, evidence: Evidence[], claim: string): string;
    /**
     * Create result for non-applicable language
     */
    protected createNonApplicableResult(claim: string): AnalysisResult;
}
//# sourceMappingURL=base-detector.d.ts.map