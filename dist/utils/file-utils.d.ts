/**
 * SlopWatch MCP Server - File Utilities
 * Copyright (c) 2025 SlopWatch Team
 */
import { FileContent, SupportedLanguage, ServerConfig } from '../types/index.js';
/**
 * Determine language from file extension
 */
export declare function getLanguageFromPath(filePath: string): SupportedLanguage;
/**
 * Check if file should be included based on config
 */
export declare function shouldIncludeFile(filePath: string, config: ServerConfig): boolean;
/**
 * Read and parse a single file
 */
export declare function readFileContent(filePath: string, config: ServerConfig): Promise<FileContent | null>;
/**
 * Find files in directory based on patterns
 */
export declare function findFiles(baseDir: string, patterns: string[] | undefined, config: ServerConfig): Promise<string[]>;
/**
 * Read multiple files with concurrency control
 */
export declare function readMultipleFiles(filePaths: string[], config: ServerConfig, maxConcurrency?: number): Promise<FileContent[]>;
/**
 * Get file statistics
 */
export declare function getFileStats(filePaths: string[]): Promise<{
    totalFiles: number;
    languageDistribution: Record<SupportedLanguage, number>;
    totalSize: number;
    averageSize: number;
}>;
/**
 * Validate and normalize directory path
 */
export declare function validateDirectory(dirPath: string): Promise<string>;
/**
 * Create relative path from base directory
 */
export declare function createRelativePath(filePath: string, baseDir: string): string;
/**
 * Filter files by language
 */
export declare function filterFilesByLanguage(files: FileContent[], languages: SupportedLanguage[]): FileContent[];
/**
 * Group files by language
 */
export declare function groupFilesByLanguage(files: FileContent[]): Record<SupportedLanguage, FileContent[]>;
/**
 * Estimate processing time based on file count and size
 */
export declare function estimateProcessingTime(files: FileContent[]): number;
//# sourceMappingURL=file-utils.d.ts.map