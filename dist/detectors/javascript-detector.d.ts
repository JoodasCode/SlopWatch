/**
 * SlopWatch MCP Server - JavaScript/TypeScript Detector
 * Copyright (c) 2025 SlopWatch Team
 */
import { BaseDetector } from './base-detector.js';
import { SupportedLanguage, FilePattern } from '../types/index.js';
export declare class JavaScriptDetector extends BaseDetector {
    readonly language: SupportedLanguage;
    readonly patterns: readonly FilePattern[];
    protected isPatternRelevantToClaim(pattern: FilePattern, normalizedClaim: string): boolean;
    protected calculatePatternConfidence(pattern: FilePattern, matches: string[], normalizedClaim: string): number;
}
//# sourceMappingURL=javascript-detector.d.ts.map