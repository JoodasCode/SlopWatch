import { EventEmitter } from 'events';
export interface FileChange {
    id: string;
    path: string;
    type: 'add' | 'modify' | 'delete';
    content?: string;
    diff?: string;
    timestamp: number;
    size?: number;
    hash?: string;
}
export interface WatcherOptions {
    projectPath: string;
    ignored?: string[];
    includeExtensions?: string[];
    gitTracking?: boolean;
}
export declare class ProjectFileWatcher extends EventEmitter {
    private watcher;
    private projectPath;
    private fileHashes;
    private options;
    private readonly SUPPORTED_EXTENSIONS;
    constructor(options: WatcherOptions);
    start(): Promise<void>;
    stop(): Promise<void>;
    private initializeFileHashes;
    private getGitTrackedFiles;
    private handleFileChange;
    private hashContent;
    private generateDiff;
    private generateAddDiff;
    private generateDeleteDiff;
    getRecentChanges(since?: number): FileChange[];
    isRelevantFile(filePath: string): boolean;
    getProjectStats(): {
        watchedFiles: number;
        supportedExtensions: string[];
    };
}
export declare function createFileWatcher(projectPath: string, options?: Partial<WatcherOptions>): ProjectFileWatcher;
//# sourceMappingURL=file-watcher.d.ts.map