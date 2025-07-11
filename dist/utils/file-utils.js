/**
 * SlopWatch MCP Server - File Utilities
 * Copyright (c) 2025 SlopWatch Team
 */
import { promises as fs } from 'fs';
import { resolve, extname, relative } from 'path';
import { glob } from 'glob';
import { SUPPORTED_EXTENSIONS, FileAnalysisError, UnsupportedLanguageError } from '../types/index.js';
/**
 * Determine language from file extension
 */
export function getLanguageFromPath(filePath) {
    const ext = extname(filePath).toLowerCase();
    for (const [language, extensions] of Object.entries(SUPPORTED_EXTENSIONS)) {
        if (extensions.includes(ext)) {
            // Handle React files specifically
            if ((ext === '.jsx' || ext === '.tsx') && language === 'react') {
                return 'react';
            }
            // Handle TypeScript files
            if ((ext === '.ts' || ext === '.tsx') && language === 'typescript') {
                return 'typescript';
            }
            // Handle JavaScript files (but not TypeScript/React)
            if ((ext === '.js' || ext === '.jsx') && language === 'javascript') {
                return 'javascript';
            }
            return language;
        }
    }
    return 'unknown';
}
/**
 * Check if file should be included based on config
 */
export function shouldIncludeFile(filePath, config) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    // Check exclude patterns
    for (const pattern of config.excludePatterns) {
        if (isGlobMatch(normalizedPath, pattern)) {
            return false;
        }
    }
    // Check if extension is supported
    const ext = extname(filePath).toLowerCase();
    return config.supportedExtensions.includes(ext);
}
/**
 * Simple glob pattern matching
 */
function isGlobMatch(filePath, pattern) {
    // Convert glob pattern to regex
    const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
}
/**
 * Read and parse a single file
 */
export async function readFileContent(filePath, config) {
    try {
        const absolutePath = resolve(filePath);
        const stats = await fs.stat(absolutePath);
        // Check file size
        if (stats.size > config.maxFileSize) {
            console.warn(`Skipping large file: ${filePath} (${stats.size} bytes)`);
            return null;
        }
        // Check if should include
        if (!shouldIncludeFile(filePath, config)) {
            return null;
        }
        const content = await fs.readFile(absolutePath, 'utf8');
        const language = getLanguageFromPath(filePath);
        if (language === 'unknown') {
            throw new UnsupportedLanguageError(language, filePath);
        }
        return {
            path: filePath,
            content,
            language,
            lastModified: stats.mtime
        };
    }
    catch (error) {
        if (error instanceof UnsupportedLanguageError) {
            throw error;
        }
        throw new FileAnalysisError(filePath, error);
    }
}
/**
 * Find files in directory based on patterns
 */
export async function findFiles(baseDir, patterns = ['**/*'], config) {
    const allPatterns = patterns.length > 0 ? patterns : ['**/*'];
    const foundFiles = [];
    for (const pattern of allPatterns) {
        try {
            const files = await glob(pattern, {
                cwd: baseDir,
                nodir: true,
                dot: false,
                follow: false,
                ignore: [...config.excludePatterns]
            });
            foundFiles.push(...files.map(file => resolve(baseDir, file)));
        }
        catch (error) {
            console.error(`Error globbing pattern ${pattern}:`, error);
        }
    }
    // Remove duplicates and filter
    const uniqueFiles = [...new Set(foundFiles)];
    return uniqueFiles.filter(file => shouldIncludeFile(file, config));
}
/**
 * Read multiple files with concurrency control
 */
export async function readMultipleFiles(filePaths, config, maxConcurrency = config.maxConcurrentAnalysis) {
    const results = [];
    const errors = [];
    // Process files in batches to control concurrency
    for (let i = 0; i < filePaths.length; i += maxConcurrency) {
        const batch = filePaths.slice(i, i + maxConcurrency);
        const batchPromises = batch.map(async (filePath) => {
            try {
                const content = await readFileContent(filePath, config);
                return content;
            }
            catch (error) {
                errors.push({ path: filePath, error });
                return null;
            }
        });
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.filter((result) => result !== null));
    }
    // Log errors (but don't fail the entire operation)
    if (errors.length > 0) {
        console.warn(`Failed to read ${errors.length} files:`, errors);
    }
    return results;
}
/**
 * Get file statistics
 */
export async function getFileStats(filePaths) {
    const languageDistribution = {
        javascript: 0,
        typescript: 0,
        python: 0,
        css: 0,
        html: 0,
        react: 0,
        java: 0,
        go: 0,
        rust: 0,
        unknown: 0
    };
    let totalSize = 0;
    let successfulReads = 0;
    for (const filePath of filePaths) {
        try {
            const stats = await fs.stat(filePath);
            const language = getLanguageFromPath(filePath);
            languageDistribution[language]++;
            totalSize += stats.size;
            successfulReads++;
        }
        catch (error) {
            console.warn(`Could not stat file ${filePath}:`, error);
        }
    }
    return {
        totalFiles: successfulReads,
        languageDistribution,
        totalSize,
        averageSize: successfulReads > 0 ? totalSize / successfulReads : 0
    };
}
/**
 * Validate and normalize directory path
 */
export async function validateDirectory(dirPath) {
    try {
        const absolutePath = resolve(dirPath);
        const stats = await fs.stat(absolutePath);
        if (!stats.isDirectory()) {
            throw new Error(`Path is not a directory: ${dirPath}`);
        }
        // Check if directory is readable
        await fs.access(absolutePath, fs.constants.R_OK);
        return absolutePath;
    }
    catch (error) {
        throw new Error(`Invalid directory: ${dirPath} - ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Create relative path from base directory
 */
export function createRelativePath(filePath, baseDir) {
    try {
        return relative(baseDir, filePath);
    }
    catch {
        return filePath; // Fallback to absolute path
    }
}
/**
 * Filter files by language
 */
export function filterFilesByLanguage(files, languages) {
    return files.filter(file => languages.includes(file.language));
}
/**
 * Group files by language
 */
export function groupFilesByLanguage(files) {
    const groups = {
        javascript: [],
        typescript: [],
        python: [],
        css: [],
        html: [],
        react: [],
        java: [],
        go: [],
        rust: [],
        unknown: []
    };
    for (const file of files) {
        groups[file.language].push(file);
    }
    return groups;
}
/**
 * Estimate processing time based on file count and size
 */
export function estimateProcessingTime(files) {
    // Base processing time per file (in milliseconds)
    const baseTimePerFile = 10;
    // Additional time per KB of content
    const timePerKB = 0.5;
    let totalTime = 0;
    for (const file of files) {
        const sizeKB = Buffer.byteLength(file.content, 'utf8') / 1024;
        totalTime += baseTimePerFile + (sizeKB * timePerKB);
    }
    return Math.max(totalTime, 100); // Minimum 100ms
}
//# sourceMappingURL=file-utils.js.map