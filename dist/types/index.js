/**
 * SlopWatch MCP Server - Professional AI Lie Detection
 * Copyright (c) 2025 SlopWatch Team
 */
import { z } from "zod";
// MCP Tool schemas
export const AnalyzeClaimSchema = z.object({
    claim: z.string().min(1).describe("The AI claim to analyze for truthfulness"),
    workspaceDir: z.string().optional().describe("Directory to analyze (defaults to current working directory)"),
    fileTypes: z.array(z.string()).optional().describe("Specific file types to analyze (e.g., ['.js', '.ts', '.py'])"),
    maxFiles: z.number().min(1).max(1000).default(100).describe("Maximum number of files to analyze")
});
export const StartMonitoringSchema = z.object({
    workspaceDir: z.string().optional().describe("Directory to monitor (defaults to current working directory)"),
    watchPatterns: z.array(z.string()).optional().describe("File patterns to watch (e.g., ['**/*.js', '**/*.ts'])"),
    excludePatterns: z.array(z.string()).optional().describe("Patterns to exclude from watching")
});
export const GetStatusSchema = z.object({
    detailed: z.boolean().default(false).describe("Whether to return detailed statistics")
});
// Error types
export class SlopWatchError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'SlopWatchError';
    }
}
export class FileAnalysisError extends SlopWatchError {
    constructor(filePath, originalError) {
        super(`Failed to analyze file: ${filePath}`, 'FILE_ANALYSIS_ERROR', { filePath, originalError });
    }
}
export class UnsupportedLanguageError extends SlopWatchError {
    constructor(language, filePath) {
        super(`Unsupported language '${language}' for file: ${filePath}`, 'UNSUPPORTED_LANGUAGE', { language, filePath });
    }
}
// Constants
export const SUPPORTED_EXTENSIONS = {
    javascript: ['.js', '.jsx', '.mjs', '.cjs'],
    typescript: ['.ts', '.tsx', '.d.ts'],
    python: ['.py', '.pyw', '.pyi'],
    css: ['.css', '.scss', '.sass', '.less'],
    html: ['.html', '.htm', '.xhtml'],
    react: ['.jsx', '.tsx'],
    java: ['.java'],
    go: ['.go'],
    rust: ['.rs'],
    unknown: []
};
export const DEFAULT_CONFIG = {
    maxFileSize: 1024 * 1024, // 1MB
    supportedExtensions: Object.values(SUPPORTED_EXTENSIONS).flat(),
    excludePatterns: [
        'node_modules/**',
        '.git/**',
        'dist/**',
        'build/**',
        '.next/**',
        'coverage/**',
        '*.min.js',
        '*.bundle.js'
    ],
    confidenceThreshold: 0.7,
    maxConcurrentAnalysis: 10
};
//# sourceMappingURL=index.js.map