/**
 * SlopWatch MCP Server - Professional AI Lie Detection
 * Copyright (c) 2025 SlopWatch Team
 */
import { z } from "zod";
export interface AnalysisResult {
    readonly isLie: boolean;
    readonly confidence: number;
    readonly evidence: Evidence[];
    readonly summary: string;
    readonly detectedPatterns: DetectedPattern[];
}
export interface Evidence {
    readonly file: string;
    readonly line?: number;
    readonly description: string;
    readonly severity: 'low' | 'medium' | 'high' | 'critical';
    readonly category: string;
}
export interface DetectedPattern {
    readonly pattern: string;
    readonly matches: string[];
    readonly files: string[];
    readonly confidence: number;
}
export interface FileContent {
    readonly path: string;
    readonly content: string;
    readonly language: SupportedLanguage;
    readonly lastModified: Date;
}
export interface FilePattern {
    readonly name: string;
    readonly regex: RegExp;
    readonly category: string;
    readonly weight: number;
    readonly description: string;
}
export type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'css' | 'html' | 'react' | 'java' | 'go' | 'rust' | 'unknown';
export interface IDetector {
    readonly language: SupportedLanguage;
    readonly patterns: readonly FilePattern[];
    analyzeFiles(files: readonly FileContent[], claim: string): Promise<AnalysisResult>;
    detectPatterns(content: string, claim: string): DetectedPattern[];
}
export interface ServerConfig {
    readonly maxFileSize: number;
    readonly supportedExtensions: readonly string[];
    readonly excludePatterns: readonly string[];
    readonly confidenceThreshold: number;
    readonly maxConcurrentAnalysis: number;
}
export declare const AnalyzeClaimSchema: z.ZodObject<{
    claim: z.ZodString;
    workspaceDir: z.ZodOptional<z.ZodString>;
    fileTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    maxFiles: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    claim: string;
    maxFiles: number;
    workspaceDir?: string | undefined;
    fileTypes?: string[] | undefined;
}, {
    claim: string;
    workspaceDir?: string | undefined;
    fileTypes?: string[] | undefined;
    maxFiles?: number | undefined;
}>;
export declare const StartMonitoringSchema: z.ZodObject<{
    workspaceDir: z.ZodOptional<z.ZodString>;
    watchPatterns: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    excludePatterns: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    workspaceDir?: string | undefined;
    watchPatterns?: string[] | undefined;
    excludePatterns?: string[] | undefined;
}, {
    workspaceDir?: string | undefined;
    watchPatterns?: string[] | undefined;
    excludePatterns?: string[] | undefined;
}>;
export declare const GetStatusSchema: z.ZodObject<{
    detailed: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    detailed: boolean;
}, {
    detailed?: boolean | undefined;
}>;
export interface StatusResponse {
    readonly isMonitoring: boolean;
    readonly filesWatched: number;
    readonly totalAnalyses: number;
    readonly totalLiesDetected: number;
    readonly averageConfidence: number;
    readonly lastAnalysis?: Date;
    readonly supportedLanguages: readonly SupportedLanguage[];
    readonly version: string;
}
export interface MonitoringStatus {
    readonly active: boolean;
    readonly watchedDirectory: string;
    readonly fileCount: number;
    readonly patterns: readonly string[];
    readonly excludePatterns: readonly string[];
    readonly startTime: Date;
}
export declare class SlopWatchError extends Error {
    readonly code: string;
    readonly details?: unknown;
    constructor(message: string, code: string, details?: unknown);
}
export declare class FileAnalysisError extends SlopWatchError {
    constructor(filePath: string, originalError: unknown);
}
export declare class UnsupportedLanguageError extends SlopWatchError {
    constructor(language: string, filePath: string);
}
export type AnalysisMetrics = {
    readonly filesAnalyzed: number;
    readonly processingTime: number;
    readonly memoryUsage: number;
    readonly detectedLanguages: readonly SupportedLanguage[];
};
export type FileFilter = {
    readonly extensions?: readonly string[];
    readonly excludePatterns?: readonly string[];
    readonly maxSize?: number;
    readonly maxAge?: number;
};
export declare const SUPPORTED_EXTENSIONS: Record<SupportedLanguage, readonly string[]>;
export declare const DEFAULT_CONFIG: ServerConfig;
//# sourceMappingURL=index.d.ts.map