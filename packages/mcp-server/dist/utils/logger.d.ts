export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    message: string;
    category: string;
    data?: any;
    sessionId?: string;
}
export declare class Logger {
    private logLevel;
    private logFile?;
    private enableConsole;
    private logBuffer;
    private maxBufferSize;
    constructor(options?: {
        level?: LogLevel;
        logFile?: string;
        enableConsole?: boolean;
    });
    private ensureLogDirectory;
    private shouldLog;
    private formatMessage;
    private getConsoleColor;
    private writeToFile;
    private log;
    debug(category: string, message: string, data?: any, sessionId?: string): void;
    info(category: string, message: string, data?: any, sessionId?: string): void;
    warn(category: string, message: string, data?: any, sessionId?: string): void;
    error(category: string, message: string, data?: any, sessionId?: string): void;
    mcp(message: string, data?: any): void;
    fileWatch(message: string, data?: any, sessionId?: string): void;
    detection(message: string, data?: any, sessionId?: string): void;
    analysis(message: string, data?: any, sessionId?: string): void;
    websocket(message: string, data?: any): void;
    database(message: string, data?: any): void;
    auth(message: string, data?: any): void;
    getRecentLogs(count?: number): LogEntry[];
    clearBuffer(): void;
    setLogLevel(level: LogLevel): void;
}
export declare const logger: Logger;
export declare const log: {
    debug: (category: string, message: string, data?: any, sessionId?: string) => void;
    info: (category: string, message: string, data?: any, sessionId?: string) => void;
    warn: (category: string, message: string, data?: any, sessionId?: string) => void;
    error: (category: string, message: string, data?: any, sessionId?: string) => void;
    mcp: (message: string, data?: any) => void;
    fileWatch: (message: string, data?: any, sessionId?: string) => void;
    detection: (message: string, data?: any, sessionId?: string) => void;
    analysis: (message: string, data?: any, sessionId?: string) => void;
    websocket: (message: string, data?: any) => void;
    database: (message: string, data?: any) => void;
    auth: (message: string, data?: any) => void;
};
//# sourceMappingURL=logger.d.ts.map