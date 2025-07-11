import { Database } from '../database/database.js';
import { UserContext } from '../types/index.js';
export declare class AuthService {
    private database;
    constructor(database: Database);
    /**
     * Authenticate user based on API key from environment/config
     */
    authenticate(): Promise<UserContext | null>;
    /**
     * Get API key from various sources (environment, config files)
     */
    private getAPIKey;
    /**
     * Validate API key format and authenticate with database
     */
    validateAPIKey(apiKey: string): Promise<UserContext | null>;
    /**
     * Generate a new API key for a user
     */
    generateKey(userId: string, environment?: 'live' | 'test'): Promise<string>;
    /**
     * Create a new user account
     */
    createUser(email: string, plan?: string): Promise<{
        userId: string;
        apiKey: string;
    }>;
    /**
     * Setup authentication for a new project
     */
    setupProject(): Promise<{
        apiKey: string;
        userContext: UserContext;
    }>;
    /**
     * Save API key and user configuration to files
     */
    private saveConfiguration;
    /**
     * Update .gitignore to exclude SlopWatch files
     */
    private updateGitignore;
    /**
     * Hash API key for secure storage
     */
    private hashKey;
    /**
     * Validate API key format
     */
    private isValidKeyFormat;
    /**
     * Get user context from API key (for external validation)
     */
    getUserFromAPIKey(apiKey: string): Promise<UserContext | null>;
    /**
     * Revoke an API key
     */
    revokeAPIKey(apiKey: string): Promise<void>;
    /**
     * Get authentication status for debugging
     */
    getAuthStatus(): Promise<{
        isAuthenticated: boolean;
        userEmail?: string;
        plan?: string;
        apiKeySource?: string;
    }>;
}
//# sourceMappingURL=auth-service.d.ts.map