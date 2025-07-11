import { EventEmitter } from 'events';
import { watch } from 'chokidar';
import { readFile, stat } from 'fs/promises';
import { join, relative, extname } from 'path';
import { execSync } from 'child_process';
import { createHash } from 'crypto';
export class ProjectFileWatcher extends EventEmitter {
    watcher = null;
    projectPath;
    fileHashes = new Map();
    options;
    // Track supported file types for code analysis
    SUPPORTED_EXTENSIONS = [
        '.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte',
        '.css', '.scss', '.sass', '.less',
        '.html', '.htm', '.md', '.json',
        '.py', '.rb', '.go', '.rs', '.java', '.c', '.cpp', '.cs',
        '.php', '.sh', '.yml', '.yaml', '.toml', '.env'
    ];
    constructor(options) {
        super();
        this.options = options;
        this.projectPath = options.projectPath;
    }
    async start() {
        console.log(`🔍 Starting file watcher for: ${this.projectPath}`);
        // Initialize file hashes for existing files
        await this.initializeFileHashes();
        const ignoredPatterns = [
            '**/node_modules/**',
            '**/.git/**',
            '**/dist/**',
            '**/build/**',
            '**/.next/**',
            '**/coverage/**',
            '**/.nyc_output/**',
            '**/tmp/**',
            '**/temp/**',
            ...(this.options.ignored || [])
        ];
        this.watcher = watch(this.projectPath, {
            ignored: ignoredPatterns,
            persistent: true,
            ignoreInitial: true,
            followSymlinks: false,
            atomic: true, // Wait for write operations to complete
            awaitWriteFinish: {
                stabilityThreshold: 100,
                pollInterval: 50
            }
        });
        this.watcher
            .on('add', (path) => this.handleFileChange(path, 'add'))
            .on('change', (path) => this.handleFileChange(path, 'modify'))
            .on('unlink', (path) => this.handleFileChange(path, 'delete'))
            .on('error', (error) => this.emit('error', error))
            .on('ready', () => {
            console.log('✅ File watcher ready');
            this.emit('ready');
        });
    }
    async stop() {
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = null;
            console.log('🛑 File watcher stopped');
        }
    }
    async initializeFileHashes() {
        try {
            // Get all tracked files if git is available
            const gitFiles = this.getGitTrackedFiles();
            for (const filePath of gitFiles) {
                const fullPath = join(this.projectPath, filePath);
                try {
                    const content = await readFile(fullPath, 'utf8');
                    const hash = this.hashContent(content);
                    this.fileHashes.set(filePath, hash);
                }
                catch (error) {
                    // File might not exist or be readable, skip
                }
            }
        }
        catch (error) {
            console.log('📝 Git not available, skipping initial hash setup');
        }
    }
    getGitTrackedFiles() {
        try {
            const output = execSync('git ls-files', {
                cwd: this.projectPath,
                encoding: 'utf8',
                timeout: 5000
            });
            return output.trim().split('\n').filter(Boolean);
        }
        catch (error) {
            return [];
        }
    }
    async handleFileChange(filePath, type) {
        try {
            const relativePath = relative(this.projectPath, filePath);
            const extension = extname(filePath);
            // Only track supported file types
            if (!this.SUPPORTED_EXTENSIONS.includes(extension)) {
                return;
            }
            // Filter by extensions if specified
            if (this.options.includeExtensions && !this.options.includeExtensions.includes(extension)) {
                return;
            }
            const change = {
                id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                path: relativePath,
                type,
                timestamp: Date.now()
            };
            if (type === 'delete') {
                this.fileHashes.delete(relativePath);
                change.diff = this.generateDeleteDiff(relativePath);
            }
            else {
                const content = await readFile(filePath, 'utf8');
                const newHash = this.hashContent(content);
                const oldHash = this.fileHashes.get(relativePath);
                change.content = content;
                change.hash = newHash;
                if (type === 'modify' && oldHash) {
                    change.diff = await this.generateDiff(relativePath, filePath);
                }
                else if (type === 'add') {
                    change.diff = this.generateAddDiff(content);
                }
                this.fileHashes.set(relativePath, newHash);
                const stats = await stat(filePath);
                change.size = stats.size;
            }
            console.log(`📝 File ${type}: ${relativePath}`);
            this.emit('change', change);
        }
        catch (error) {
            console.error(`❌ Error handling file change for ${filePath}:`, error);
        }
    }
    hashContent(content) {
        return createHash('md5').update(content).digest('hex');
    }
    async generateDiff(relativePath, fullPath) {
        try {
            // Use git diff for better diffs
            const output = execSync(`git diff HEAD -- "${relativePath}"`, {
                cwd: this.projectPath,
                encoding: 'utf8',
                timeout: 5000
            });
            if (output.trim()) {
                return output;
            }
            // Fallback to unstaged diff
            const unstagedOutput = execSync(`git diff -- "${relativePath}"`, {
                cwd: this.projectPath,
                encoding: 'utf8',
                timeout: 5000
            });
            return unstagedOutput || '+ [File modified but no diff available]';
        }
        catch (error) {
            // Fallback: simple content indication
            const content = await readFile(fullPath, 'utf8');
            return `+ ${content.split('\n').length} lines modified`;
        }
    }
    generateAddDiff(content) {
        return content.split('\n').map(line => `+ ${line}`).join('\n');
    }
    generateDeleteDiff(relativePath) {
        return `- [File deleted: ${relativePath}]`;
    }
    // Get recent changes for analysis
    getRecentChanges(since = Date.now() - 30000) {
        // This would be stored in memory or database in real implementation
        // For now, we'll emit changes and let consumers store them
        return [];
    }
    // Check if file is relevant for code analysis
    isRelevantFile(filePath) {
        const ext = extname(filePath);
        return this.SUPPORTED_EXTENSIONS.includes(ext);
    }
    // Get project statistics
    getProjectStats() {
        return {
            watchedFiles: this.fileHashes.size,
            supportedExtensions: this.SUPPORTED_EXTENSIONS
        };
    }
}
// Factory function for easy instantiation
export function createFileWatcher(projectPath, options = {}) {
    return new ProjectFileWatcher({
        projectPath,
        gitTracking: true,
        ...options
    });
}
//# sourceMappingURL=file-watcher.js.map