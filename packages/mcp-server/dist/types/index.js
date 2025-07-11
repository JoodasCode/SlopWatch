// Core type definitions for SlopWatch MCP Server
// Error types
export class SlopWatchError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode = 500) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'SlopWatchError';
    }
}
export class DetectorError extends SlopWatchError {
    detector;
    constructor(message, detector) {
        super(message, 'DETECTOR_ERROR', 500);
        this.detector = detector;
        this.name = 'DetectorError';
    }
}
export class DatabaseError extends SlopWatchError {
    constructor(message) {
        super(message, 'DATABASE_ERROR', 500);
        this.name = 'DatabaseError';
    }
}
export class AuthenticationError extends SlopWatchError {
    constructor(message) {
        super(message, 'AUTH_ERROR', 401);
        this.name = 'AuthenticationError';
    }
}
//# sourceMappingURL=index.js.map