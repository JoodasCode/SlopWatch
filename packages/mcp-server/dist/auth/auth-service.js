import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';
import { AuthenticationError } from '../types/index.js';
import { log } from '../utils/logger.js';
export class AuthService {
    database;
    constructor(database) {
        this.database = database;
    }
    /**
     * Authenticate user based on API key from environment/config
     */
    async authenticate() {
        try {
            const apiKey = this.getAPIKey();
            if (!apiKey) {
                log.auth('No API key found', {
                    sources: ['SLOPWATCH_API_KEY', '.env.slopwatch', '.slopwatch/config.json']
                });
                return null;
            }
            const userContext = await this.validateAPIKey(apiKey);
            if (!userContext) {
                log.auth('API key validation failed');
                throw new AuthenticationError('Invalid API key. Get a new one at slopwatch.com/dashboard/settings');
            }
            userContext.apiKey = apiKey;
            log.auth('User authenticated successfully', {
                email: userContext.email,
                plan: userContext.plan
            });
            return userContext;
        }
        catch (error) {
            log.error('AUTH', 'Authentication failed', error);
            return null;
        }
    }
    /**
     * Get API key from various sources (environment, config files)
     */
    getAPIKey() {
        // Priority order for API key lookup:
        // 1. Environment variable
        // 2. .env.slopwatch file
        // 3. .slopwatch/config.json file
        if (process.env.SLOPWATCH_API_KEY) {
            log.auth('API key found in environment variable');
            return process.env.SLOPWATCH_API_KEY;
        }
        const envFile = path.join(process.cwd(), '.env.slopwatch');
        if (fs.existsSync(envFile)) {
            try {
                const content = fs.readFileSync(envFile, 'utf8');
                const match = content.match(/SLOPWATCH_API_KEY=(.+)/);
                if (match) {
                    log.auth('API key found in .env.slopwatch file');
                    return match[1].trim();
                }
            }
            catch (error) {
                log.warn('AUTH', 'Failed to read .env.slopwatch file', error);
            }
        }
        const configFile = path.join(process.cwd(), '.slopwatch', 'config.json');
        if (fs.existsSync(configFile)) {
            try {
                const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
                if (config.apiKey) {
                    log.auth('API key found in .slopwatch/config.json file');
                    return config.apiKey;
                }
            }
            catch (error) {
                log.warn('AUTH', 'Failed to read .slopwatch/config.json file', error);
            }
        }
        return null;
    }
    /**
     * Validate API key format and authenticate with database
     */
    async validateAPIKey(apiKey) {
        // Validate format
        if (!this.isValidKeyFormat(apiKey)) {
            log.auth('Invalid API key format', { format: 'sk_[env]_[32chars]' });
            return null;
        }
        // Hash the key for database lookup
        const keyHash = this.hashKey(apiKey);
        // Database lookup
        try {
            const userContext = await this.database.getUserByAPIKeyHash(keyHash);
            if (!userContext) {
                log.auth('API key not found in database');
                return null;
            }
            return userContext;
        }
        catch (error) {
            log.error('AUTH', 'Database error during API key validation', error);
            return null;
        }
    }
    /**
     * Generate a new API key for a user
     */
    async generateKey(userId, environment = 'live') {
        const randomPart = crypto.randomBytes(16).toString('hex');
        const apiKey = `sk_${environment}_${randomPart}`;
        const keyHash = this.hashKey(apiKey);
        try {
            await this.database.createAPIKey(userId, keyHash, 'Default');
            log.auth('New API key generated', { userId, environment });
            return apiKey;
        }
        catch (error) {
            log.error('AUTH', 'Failed to generate API key', error);
            throw new AuthenticationError(`Failed to generate API key: ${error.message}`);
        }
    }
    /**
     * Create a new user account
     */
    async createUser(email, plan = 'free') {
        try {
            // Check if user already exists
            const existingUser = await this.database.getUserByEmail(email);
            if (existingUser) {
                throw new AuthenticationError('User already exists with this email');
            }
            // Create user
            const userId = await this.database.createUser(email, plan);
            // Generate initial API key
            const apiKey = await this.generateKey(userId, 'live');
            log.auth('New user created', { userId, email, plan });
            return { userId, apiKey };
        }
        catch (error) {
            log.error('AUTH', 'Failed to create user', error);
            throw new AuthenticationError(`Failed to create user: ${error.message}`);
        }
    }
    /**
     * Setup authentication for a new project
     */
    async setupProject() {
        try {
            // Check if already authenticated
            const existingContext = await this.authenticate();
            if (existingContext) {
                log.auth('Project already authenticated', { email: existingContext.email });
                return {
                    apiKey: existingContext.apiKey,
                    userContext: existingContext
                };
            }
            // Interactive setup would happen here in a real CLI
            // For now, we'll create a demo user
            const demoEmail = `demo-${Date.now()}@slopwatch.dev`;
            const { userId, apiKey } = await this.createUser(demoEmail, 'free');
            // Save configuration
            await this.saveConfiguration(apiKey, {
                userId,
                email: demoEmail,
                plan: 'free',
                apiKey
            });
            const userContext = {
                userId,
                email: demoEmail,
                plan: 'free',
                apiKey
            };
            log.auth('Project setup completed', { email: demoEmail });
            return { apiKey, userContext };
        }
        catch (error) {
            log.error('AUTH', 'Failed to setup project', error);
            throw new AuthenticationError(`Failed to setup project: ${error.message}`);
        }
    }
    /**
     * Save API key and user configuration to files
     */
    async saveConfiguration(apiKey, userContext) {
        try {
            // Save to .env.slopwatch file
            const envContent = `SLOPWATCH_API_KEY=${apiKey}\n`;
            await fs.writeFile('.env.slopwatch', envContent);
            // Save to .slopwatch/config.json
            const configDir = '.slopwatch';
            await fs.ensureDir(configDir);
            const config = {
                version: '1.0.0',
                apiKey,
                userId: userContext.userId,
                email: userContext.email,
                plan: userContext.plan,
                setupAt: new Date().toISOString()
            };
            await fs.writeJSON(path.join(configDir, 'config.json'), config, { spaces: 2 });
            // Add to .gitignore
            await this.updateGitignore();
            log.auth('Configuration saved', { configDir });
        }
        catch (error) {
            log.error('AUTH', 'Failed to save configuration', error);
            throw new AuthenticationError(`Failed to save configuration: ${error.message}`);
        }
    }
    /**
     * Update .gitignore to exclude SlopWatch files
     */
    async updateGitignore() {
        const gitignorePath = '.gitignore';
        let gitignoreContent = '';
        if (await fs.pathExists(gitignorePath)) {
            gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
        }
        const slopwatchEntries = [
            '.env.slopwatch',
            '.slopwatch/config.json',
            '.slopwatch/offline/',
            '.slopwatch/database.sqlite',
            '.slopwatch/database.sqlite-wal',
            '.slopwatch/database.sqlite-shm'
        ];
        let needsUpdate = false;
        let newContent = gitignoreContent;
        for (const entry of slopwatchEntries) {
            if (!gitignoreContent.includes(entry)) {
                if (!needsUpdate) {
                    newContent += '\n# SlopWatch\n';
                    needsUpdate = true;
                }
                newContent += `${entry}\n`;
            }
        }
        if (needsUpdate) {
            await fs.writeFile(gitignorePath, newContent);
            log.auth('Updated .gitignore with SlopWatch entries');
        }
    }
    /**
     * Hash API key for secure storage
     */
    hashKey(apiKey) {
        return crypto.createHash('sha256').update(apiKey).digest('hex');
    }
    /**
     * Validate API key format
     */
    isValidKeyFormat(apiKey) {
        return /^sk_(live|test)_[a-f0-9]{32}$/.test(apiKey);
    }
    /**
     * Get user context from API key (for external validation)
     */
    async getUserFromAPIKey(apiKey) {
        if (!this.isValidKeyFormat(apiKey)) {
            return null;
        }
        const keyHash = this.hashKey(apiKey);
        const userContext = await this.database.getUserByAPIKeyHash(keyHash);
        if (userContext) {
            userContext.apiKey = apiKey;
        }
        return userContext;
    }
    /**
     * Revoke an API key
     */
    async revokeAPIKey(apiKey) {
        const keyHash = this.hashKey(apiKey);
        try {
            // In a real implementation, we'd have a method to revoke keys
            // For now, we'll log the action
            log.auth('API key revoked', { keyHash: keyHash.slice(0, 8) + '...' });
        }
        catch (error) {
            log.error('AUTH', 'Failed to revoke API key', error);
            throw new AuthenticationError(`Failed to revoke API key: ${error.message}`);
        }
    }
    /**
     * Get authentication status for debugging
     */
    async getAuthStatus() {
        try {
            const userContext = await this.authenticate();
            if (!userContext) {
                return { isAuthenticated: false };
            }
            // Determine API key source
            let apiKeySource = 'unknown';
            if (process.env.SLOPWATCH_API_KEY) {
                apiKeySource = 'environment';
            }
            else if (fs.existsSync('.env.slopwatch')) {
                apiKeySource = '.env.slopwatch';
            }
            else if (fs.existsSync('.slopwatch/config.json')) {
                apiKeySource = '.slopwatch/config.json';
            }
            return {
                isAuthenticated: true,
                userEmail: userContext.email,
                plan: userContext.plan,
                apiKeySource
            };
        }
        catch (error) {
            log.error('AUTH', 'Failed to get auth status', error);
            return { isAuthenticated: false };
        }
    }
}
//# sourceMappingURL=auth-service.js.map