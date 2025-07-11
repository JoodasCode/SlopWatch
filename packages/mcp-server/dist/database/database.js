import Database from 'better-sqlite3';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { DatabaseError } from '../types/index.js';
import { log } from '../utils/logger.js';
export class Database {
    db;
    config;
    isInitialized = false;
    constructor(config) {
        this.config = config;
        // Ensure database directory exists
        const dbDir = path.dirname(config.path);
        fs.ensureDirSync(dbDir);
        // Initialize SQLite database
        this.db = new Database(config.path);
        // Configure database
        if (config.enableWAL) {
            this.db.pragma('journal_mode = WAL');
        }
        if (config.enableForeignKeys) {
            this.db.pragma('foreign_keys = ON');
        }
        // Set other performance optimizations
        this.db.pragma('synchronous = NORMAL');
        this.db.pragma('cache_size = -64000'); // 64MB cache
        this.db.pragma('temp_store = MEMORY');
        log.database('Database connection established', { path: config.path });
    }
    async initialize() {
        if (this.isInitialized)
            return;
        try {
            // Read and execute schema
            const schemaPath = path.join(__dirname, 'schema.sql');
            const schema = await fs.readFile(schemaPath, 'utf8');
            // Execute schema in a transaction
            const transaction = this.db.transaction(() => {
                this.db.exec(schema);
            });
            transaction();
            this.isInitialized = true;
            log.database('Database schema initialized successfully');
        }
        catch (error) {
            log.error('DATABASE', 'Failed to initialize database schema', error);
            throw new DatabaseError(`Failed to initialize database: ${error.message}`);
        }
    }
    // Session management
    async createSession(context) {
        const stmt = this.db.prepare(`
      INSERT INTO sessions (
        id, user_id, project_path, project_name, start_time, 
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
    `);
        const projectName = path.basename(context.projectPath);
        const now = Date.now();
        try {
            stmt.run(context.sessionId, context.userId, context.projectPath, projectName, context.timestamp, now, now);
            log.database('Session created', { sessionId: context.sessionId });
        }
        catch (error) {
            log.error('DATABASE', 'Failed to create session', error);
            throw new DatabaseError(`Failed to create session: ${error.message}`);
        }
    }
    async getSession(sessionId) {
        const stmt = this.db.prepare(`
      SELECT * FROM sessions WHERE id = ?
    `);
        try {
            const row = stmt.get(sessionId);
            if (!row)
                return null;
            return {
                id: row.id,
                projectPath: row.project_path,
                startTime: row.start_time,
                endTime: row.end_time,
                changes: await this.getFileChangesBySession(sessionId),
                claims: await this.getClaimsBySession(sessionId),
                analyses: await this.getAnalysesBySession(sessionId)
            };
        }
        catch (error) {
            log.error('DATABASE', 'Failed to get session', error);
            throw new DatabaseError(`Failed to get session: ${error.message}`);
        }
    }
    async endSession(sessionId) {
        const stmt = this.db.prepare(`
      UPDATE sessions 
      SET status = 'ended', end_time = ?, updated_at = ?
      WHERE id = ?
    `);
        const now = Date.now();
        try {
            stmt.run(now, now, sessionId);
            log.database('Session ended', { sessionId });
        }
        catch (error) {
            log.error('DATABASE', 'Failed to end session', error);
            throw new DatabaseError(`Failed to end session: ${error.message}`);
        }
    }
    // Conversation message management
    async logMessage(message) {
        const stmt = this.db.prepare(`
      INSERT INTO conversation_messages (
        id, session_id, type, content, timestamp, 
        word_count, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        const wordCount = message.content.split(/\s+/).length;
        const now = Date.now();
        try {
            stmt.run(message.id, message.sessionId, message.type, message.content, message.timestamp, wordCount, now);
            log.database('Message logged', {
                messageId: message.id,
                type: message.type,
                wordCount
            });
        }
        catch (error) {
            log.error('DATABASE', 'Failed to log message', error);
            throw new DatabaseError(`Failed to log message: ${error.message}`);
        }
    }
    // AI Claims management
    async saveClaim(claim) {
        const stmt = this.db.prepare(`
      INSERT INTO ai_claims (
        id, message_id, session_id, text, type, action, 
        target, extracted_from, confidence, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `);
        const now = Date.now();
        try {
            stmt.run(claim.id, claim.extractedFrom, '', // Will be updated when we know the session
            claim.text, claim.type, claim.action, claim.target, claim.extractedFrom, claim.confidence, now);
            log.database('Claim saved', { claimId: claim.id, type: claim.type });
        }
        catch (error) {
            log.error('DATABASE', 'Failed to save claim', error);
            throw new DatabaseError(`Failed to save claim: ${error.message}`);
        }
    }
    async getClaimsBySession(sessionId) {
        const stmt = this.db.prepare(`
      SELECT * FROM ai_claims WHERE session_id = ? ORDER BY created_at
    `);
        try {
            const rows = stmt.all(sessionId);
            return rows.map(row => ({
                id: row.id,
                text: row.text,
                type: row.type,
                action: row.action,
                target: row.target,
                extractedFrom: row.extracted_from,
                confidence: row.confidence
            }));
        }
        catch (error) {
            log.error('DATABASE', 'Failed to get claims by session', error);
            throw new DatabaseError(`Failed to get claims: ${error.message}`);
        }
    }
    async updateClaimStatus(claimId, status) {
        const stmt = this.db.prepare(`
      UPDATE ai_claims SET status = ? WHERE id = ?
    `);
        try {
            stmt.run(status, claimId);
            log.database('Claim status updated', { claimId, status });
        }
        catch (error) {
            log.error('DATABASE', 'Failed to update claim status', error);
            throw new DatabaseError(`Failed to update claim status: ${error.message}`);
        }
    }
    // File changes management
    async logFileChange(change) {
        const stmt = this.db.prepare(`
      INSERT INTO file_changes (
        id, session_id, type, path, relative_path, diff,
        size_bytes, lines_added, lines_removed, file_extension,
        timestamp, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const relativePath = change.path; // Will be made relative to project
        const fileExtension = path.extname(change.path).slice(1) || null;
        const now = Date.now();
        try {
            stmt.run(change.id, change.sessionId, change.type, change.path, relativePath, change.diff, change.size || null, change.linesAdded || 0, change.linesRemoved || 0, fileExtension, change.timestamp, now);
            log.database('File change logged', {
                changeId: change.id,
                type: change.type,
                path: change.path
            });
        }
        catch (error) {
            log.error('DATABASE', 'Failed to log file change', error);
            throw new DatabaseError(`Failed to log file change: ${error.message}`);
        }
    }
    async getFileChangesBySession(sessionId) {
        const stmt = this.db.prepare(`
      SELECT * FROM file_changes 
      WHERE session_id = ? 
      ORDER BY timestamp
    `);
        try {
            const rows = stmt.all(sessionId);
            return rows.map(row => ({
                id: row.id,
                sessionId: row.session_id,
                type: row.type,
                path: row.path,
                diff: row.diff,
                timestamp: row.timestamp,
                size: row.size_bytes,
                linesAdded: row.lines_added,
                linesRemoved: row.lines_removed
            }));
        }
        catch (error) {
            log.error('DATABASE', 'Failed to get file changes by session', error);
            throw new DatabaseError(`Failed to get file changes: ${error.message}`);
        }
    }
    // Analysis results management
    async saveAnalysisResult(result) {
        const stmt = this.db.prepare(`
      INSERT INTO analysis_results (
        id, session_id, claim_id, detector, status, confidence,
        reason, evidence, analysis_data, processing_time_ms, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const now = Date.now();
        try {
            stmt.run(result.id, result.sessionId, result.claimId, result.detector, result.status, result.confidence, result.reason, JSON.stringify(result.evidence || []), null, // analysis_data for future use
            null, // processing_time_ms for performance tracking
            now);
            log.database('Analysis result saved', {
                resultId: result.id,
                status: result.status,
                confidence: result.confidence
            });
        }
        catch (error) {
            log.error('DATABASE', 'Failed to save analysis result', error);
            throw new DatabaseError(`Failed to save analysis result: ${error.message}`);
        }
    }
    async getAnalysesBySession(sessionId) {
        const stmt = this.db.prepare(`
      SELECT * FROM analysis_results 
      WHERE session_id = ? 
      ORDER BY created_at
    `);
        try {
            const rows = stmt.all(sessionId);
            return rows.map(row => ({
                id: row.id,
                sessionId: row.session_id,
                claimId: row.claim_id,
                status: row.status,
                confidence: row.confidence,
                reason: row.reason,
                timestamp: row.created_at,
                detector: row.detector,
                evidence: JSON.parse(row.evidence || '[]')
            }));
        }
        catch (error) {
            log.error('DATABASE', 'Failed to get analyses by session', error);
            throw new DatabaseError(`Failed to get analyses: ${error.message}`);
        }
    }
    async getRecentAnalyses(sessionId, limit = 50) {
        const stmt = this.db.prepare(`
      SELECT * FROM analysis_results 
      WHERE session_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
        try {
            const rows = stmt.all(sessionId, limit);
            return rows.map(row => ({
                id: row.id,
                sessionId: row.session_id,
                claimId: row.claim_id,
                status: row.status,
                confidence: row.confidence,
                reason: row.reason,
                timestamp: row.created_at,
                detector: row.detector,
                evidence: JSON.parse(row.evidence || '[]')
            }));
        }
        catch (error) {
            log.error('DATABASE', 'Failed to get recent analyses', error);
            throw new DatabaseError(`Failed to get recent analyses: ${error.message}`);
        }
    }
    // User management
    async createUser(email, plan = 'free') {
        const stmt = this.db.prepare(`
      INSERT INTO users (id, email, plan, status, created_at, updated_at)
      VALUES (?, ?, ?, 'active', ?, ?)
    `);
        const userId = uuidv4();
        const now = Date.now();
        try {
            stmt.run(userId, email, plan, now, now);
            log.database('User created', { userId, email, plan });
            return userId;
        }
        catch (error) {
            log.error('DATABASE', 'Failed to create user', error);
            throw new DatabaseError(`Failed to create user: ${error.message}`);
        }
    }
    async getUserById(userId) {
        const stmt = this.db.prepare(`
      SELECT * FROM users WHERE id = ? AND status = 'active'
    `);
        try {
            const row = stmt.get(userId);
            if (!row)
                return null;
            return {
                userId: row.id,
                email: row.email,
                plan: row.plan,
                apiKey: '' // Will be set by auth service
            };
        }
        catch (error) {
            log.error('DATABASE', 'Failed to get user by ID', error);
            throw new DatabaseError(`Failed to get user: ${error.message}`);
        }
    }
    async getUserByEmail(email) {
        const stmt = this.db.prepare(`
      SELECT * FROM users WHERE email = ? AND status = 'active'
    `);
        try {
            const row = stmt.get(email);
            if (!row)
                return null;
            return {
                userId: row.id,
                email: row.email,
                plan: row.plan,
                apiKey: '' // Will be set by auth service
            };
        }
        catch (error) {
            log.error('DATABASE', 'Failed to get user by email', error);
            throw new DatabaseError(`Failed to get user: ${error.message}`);
        }
    }
    // API Key management
    async createAPIKey(userId, keyHash, name = 'Default') {
        const stmt = this.db.prepare(`
      INSERT INTO api_keys (id, user_id, key_hash, name, status, created_at)
      VALUES (?, ?, ?, ?, 'active', ?)
    `);
        const keyId = uuidv4();
        const now = Date.now();
        try {
            stmt.run(keyId, userId, keyHash, name, now);
            log.database('API key created', { keyId, userId, name });
            return keyId;
        }
        catch (error) {
            log.error('DATABASE', 'Failed to create API key', error);
            throw new DatabaseError(`Failed to create API key: ${error.message}`);
        }
    }
    async getUserByAPIKeyHash(keyHash) {
        const stmt = this.db.prepare(`
      SELECT u.*, k.key_hash as api_key_hash
      FROM users u
      JOIN api_keys k ON u.id = k.user_id
      WHERE k.key_hash = ? AND k.status = 'active' AND u.status = 'active'
    `);
        try {
            const row = stmt.get(keyHash);
            if (!row)
                return null;
            // Update last used timestamp
            const updateStmt = this.db.prepare(`
        UPDATE api_keys SET last_used_at = ? WHERE key_hash = ?
      `);
            updateStmt.run(Date.now(), keyHash);
            return {
                userId: row.id,
                email: row.email,
                plan: row.plan,
                apiKey: '' // Don't return the actual key
            };
        }
        catch (error) {
            log.error('DATABASE', 'Failed to get user by API key hash', error);
            throw new DatabaseError(`Failed to authenticate with API key: ${error.message}`);
        }
    }
    // Session statistics and analytics
    async updateSessionStats(sessionId) {
        const transaction = this.db.transaction(() => {
            // Count claims by status
            const claimStats = this.db.prepare(`
        SELECT 
          COUNT(*) as total_claims,
          COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_claims,
          COUNT(CASE WHEN status = 'lie' THEN 1 END) as lies_detected
        FROM ai_claims WHERE session_id = ?
      `).get(sessionId);
            // Calculate slop score (percentage of lies)
            const slopScore = claimStats.total_claims > 0
                ? (claimStats.lies_detected / claimStats.total_claims) * 100
                : 0;
            // Update session record
            this.db.prepare(`
        UPDATE sessions 
        SET total_claims = ?, verified_claims = ?, lies_detected = ?, 
            slop_score = ?, updated_at = ?
        WHERE id = ?
      `).run(claimStats.total_claims, claimStats.verified_claims, claimStats.lies_detected, slopScore, Date.now(), sessionId);
        });
        try {
            transaction();
            log.database('Session stats updated', { sessionId });
        }
        catch (error) {
            log.error('DATABASE', 'Failed to update session stats', error);
            throw new DatabaseError(`Failed to update session stats: ${error.message}`);
        }
    }
    // Cleanup and maintenance
    async cleanup() {
        try {
            // Run VACUUM to reclaim space
            this.db.exec('VACUUM');
            // Analyze tables for query optimization
            this.db.exec('ANALYZE');
            log.database('Database cleanup completed');
        }
        catch (error) {
            log.error('DATABASE', 'Failed to cleanup database', error);
            throw new DatabaseError(`Failed to cleanup database: ${error.message}`);
        }
    }
    async close() {
        try {
            this.db.close();
            log.database('Database connection closed');
        }
        catch (error) {
            log.error('DATABASE', 'Failed to close database connection', error);
            throw new DatabaseError(`Failed to close database: ${error.message}`);
        }
    }
    // Health check
    isHealthy() {
        try {
            this.db.prepare('SELECT 1').get();
            return true;
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=database.js.map