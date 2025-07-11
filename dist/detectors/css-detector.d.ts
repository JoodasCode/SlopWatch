/**
 * SlopWatch MCP Server - CSS Detector
 * Copyright (c) 2025 SlopWatch Team
 */
import { BaseDetector } from './base-detector.js';
import { SupportedLanguage, FilePattern } from '../types/index.js';
export declare class CSSDetector extends BaseDetector {
    readonly language: SupportedLanguage;
    readonly patterns: readonly FilePattern[];
    protected isPatternRelevantToClaim(pattern: FilePattern, normalizedClaim: string): boolean;
    protected calculatePatternConfidence(pattern: FilePattern, matches: string[], normalizedClaim: string): number;
}
//# sourceMappingURL=css-detector.d.ts.map