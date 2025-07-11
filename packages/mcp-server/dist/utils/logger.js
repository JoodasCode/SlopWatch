import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
export class Logger {
    logLevel;
    logFile;
    enableConsole;
    logBuffer = [];
    maxBufferSize = 1000;
    constructor(options = {}) {
        this.logLevel = options.level ?? LogLevel.INFO;
        this.logFile = options.logFile;
        this.enableConsole = options.enableConsole ?? true;
        if (this.logFile) {
            this.ensureLogDirectory();
        }
    }
    ensureLogDirectory() {
        if (this.logFile) {
            const dir = path.dirname(this.logFile);
            fs.ensureDirSync(dir);
        }
    }
    shouldLog(level) {
        return level >= this.logLevel;
    }
    formatMessage(entry) {
        const timestamp = entry.timestamp.toISOString();
        const level = LogLevel[entry.level];
        const sessionInfo = entry.sessionId ? `[${entry.sessionId.slice(0, 8)}]` : '';
        return `${timestamp} [${level}] ${entry.category}${sessionInfo}: ${entry.message}`;
    }
    getConsoleColor(level) {
        switch (level) {
            case LogLevel.DEBUG:
                return chalk.gray;
            case LogLevel.INFO:
                return chalk.blue;
            case LogLevel.WARN:
                return chalk.yellow;
            case LogLevel.ERROR:
                return chalk.red;
            default:
                return (text) => text;
        }
    }
    async writeToFile(entry) {
        if (!this.logFile)
            return;
        try {
            const formatted = this.formatMessage(entry);
            const dataStr = entry.data ? `\n${JSON.stringify(entry.data, null, 2)}` : '';
            await fs.appendFile(this.logFile, `${formatted}${dataStr}\n`);
        }
        catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }
    log(level, category, message, data, sessionId) {
        if (!this.shouldLog(level))
            return;
        const entry = {
            timestamp: new Date(),
            level,
            message,
            category,
            data,
            sessionId
        };
        // Add to buffer
        this.logBuffer.push(entry);
        if (this.logBuffer.length > this.maxBufferSize) {
            this.logBuffer.shift();
        }
        // Console output
        if (this.enableConsole) {
            const colorFn = this.getConsoleColor(level);
            const formatted = this.formatMessage(entry);
            console.log(colorFn(formatted));
            if (data) {
                console.log(chalk.gray(JSON.stringify(data, null, 2)));
            }
        }
        // File output
        if (this.logFile) {
            this.writeToFile(entry);
        }
    }
    debug(category, message, data, sessionId) {
        this.log(LogLevel.DEBUG, category, message, data, sessionId);
    }
    info(category, message, data, sessionId) {
        this.log(LogLevel.INFO, category, message, data, sessionId);
    }
    warn(category, message, data, sessionId) {
        this.log(LogLevel.WARN, category, message, data, sessionId);
    }
    error(category, message, data, sessionId) {
        this.log(LogLevel.ERROR, category, message, data, sessionId);
    }
    // Specialized logging methods
    mcp(message, data) {
        this.info('MCP', message, data);
    }
    fileWatch(message, data, sessionId) {
        this.debug('FILE_WATCH', message, data, sessionId);
    }
    detection(message, data, sessionId) {
        this.info('DETECTION', message, data, sessionId);
    }
    analysis(message, data, sessionId) {
        this.info('ANALYSIS', message, data, sessionId);
    }
    websocket(message, data) {
        this.debug('WEBSOCKET', message, data);
    }
    database(message, data) {
        this.debug('DATABASE', message, data);
    }
    auth(message, data) {
        this.info('AUTH', message, data);
    }
    // Get recent logs for debugging
    getRecentLogs(count = 100) {
        return this.logBuffer.slice(-count);
    }
    // Clear log buffer
    clearBuffer() {
        this.logBuffer = [];
    }
    // Set log level dynamically
    setLogLevel(level) {
        this.logLevel = level;
        this.info('LOGGER', `Log level changed to ${LogLevel[level]}`);
    }
}
// Global logger instance
export const logger = new Logger({
    level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
    logFile: process.env.SLOPWATCH_LOG_FILE,
    enableConsole: true
});
// Export convenience functions
export const log = {
    debug: (category, message, data, sessionId) => logger.debug(category, message, data, sessionId),
    info: (category, message, data, sessionId) => logger.info(category, message, data, sessionId),
    warn: (category, message, data, sessionId) => logger.warn(category, message, data, sessionId),
    error: (category, message, data, sessionId) => logger.error(category, message, data, sessionId),
    // Specialized methods
    mcp: (message, data) => logger.mcp(message, data),
    fileWatch: (message, data, sessionId) => logger.fileWatch(message, data, sessionId),
    detection: (message, data, sessionId) => logger.detection(message, data, sessionId),
    analysis: (message, data, sessionId) => logger.analysis(message, data, sessionId),
    websocket: (message, data) => logger.websocket(message, data),
    database: (message, data) => logger.database(message, data),
    auth: (message, data) => logger.auth(message, data)
};
//# sourceMappingURL=logger.js.map