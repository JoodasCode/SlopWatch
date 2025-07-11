# SlopWatch: Complete Technical Specification

## Executive Summary

SlopWatch is an AI accountability platform that monitors AI coding assistants (starting with Cursor) and provides real-time verification of AI claims vs actual code changes. The system consists of three core components: an MCP server that intercepts AI conversations, a file monitoring system that tracks actual changes, and a web dashboard that provides real-time analysis.

---

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cursor IDE    │    │  SlopWatch MCP  │    │ Web Dashboard   │
│                 │◄──►│     Server      │◄──►│   (Frontend)    │
│ • User Input    │    │                 │    │                 │
│ • AI Responses  │    │ • Conversation  │    │ • Real-time UI  │
│ • Code Changes  │    │   Capture       │    │ • Analytics     │
└─────────────────┘    │ • File Monitor  │    │ • Alerts        │
                       │ • Analysis      │    │                 │
                       └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   Database      │
                       │                 │
                       │ • Conversations │
                       │ • File Changes  │
                       │ • Analysis Data │
                       └─────────────────┘
```

---

## Authentication & User Management

### API Key Authentication System

**Overview:**
SlopWatch uses API key authentication for user identification and data routing. This approach prioritizes simplicity, fast implementation, and immediate user value while maintaining security and scalability.

**User Identity Flow:**
1. User signs up at `slopwatch.com` → receives unique API key
2. User runs `slopwatch init` → enters API key → saved locally
3. MCP server authenticates all requests using API key
4. Server routes data to correct user dashboard based on API key

**Technical Implementation:**

#### API Key Structure
```
Format: sk_[env]_[random_32_chars]
Examples:
- sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
- sk_test_x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4
```

#### Authentication Service
```typescript
// packages/auth/src/api-key-service.ts
export class APIKeyService {
  async validateKey(apiKey: string): Promise<UserContext | null> {
    // Validate format
    if (!this.isValidKeyFormat(apiKey)) {
      return null;
    }
    
    // Database lookup
    const keyRecord = await this.database.query(
      'SELECT user_id, plan, status FROM api_keys WHERE key_hash = ? AND status = ?',
      [this.hashKey(apiKey), 'active']
    );
    
    if (!keyRecord) {
      return null;
    }
    
    // Get user details
    const user = await this.database.query(
      'SELECT id, email, plan, created_at FROM users WHERE id = ?',
      [keyRecord.user_id]
    );
    
    return {
      userId: user.id,
      email: user.email,
      plan: user.plan,
      apiKey: apiKey
    };
  }
  
  async generateKey(userId: string, environment: 'live' | 'test' = 'live'): Promise<string> {
    const randomPart = crypto.randomBytes(16).toString('hex');
    const apiKey = `sk_${environment}_${randomPart}`;
    const keyHash = this.hashKey(apiKey);
    
    await this.database.query(
      'INSERT INTO api_keys (user_id, key_hash, environment, created_at) VALUES (?, ?, ?, ?)',
      [userId, keyHash, environment, new Date()]
    );
    
    return apiKey;
  }
  
  private hashKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }
  
  private isValidKeyFormat(apiKey: string): boolean {
    return /^sk_(live|test)_[a-z0-9]{32}$/.test(apiKey);
  }
}
```

#### MCP Server Authentication
```typescript
// packages/mcp-server/src/auth/authenticator.ts
export class MCPAuthenticator {
  private userContext: UserContext | null = null;
  
  async initialize() {
    const apiKey = this.getAPIKey();
    if (!apiKey) {
      throw new Error('SLOPWATCH_API_KEY environment variable required. Run "slopwatch auth setup"');
    }
    
    this.userContext = await this.validateAPIKey(apiKey);
    if (!this.userContext) {
      throw new Error('Invalid API key. Get a new one at slopwatch.com/dashboard/settings');
    }
    
    console.log(`✅ Authenticated as ${this.userContext.email} (${this.userContext.plan} plan)`);
    return this.userContext;
  }
  
  private getAPIKey(): string | null {
    // Priority order for API key lookup:
    // 1. Environment variable
    // 2. .env.slopwatch file
    // 3. .slopwatch/config.json file
    
    if (process.env.SLOPWATCH_API_KEY) {
      return process.env.SLOPWATCH_API_KEY;
    }
    
    const envFile = path.join(process.cwd(), '.env.slopwatch');
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, 'utf8');
      const match = content.match(/SLOPWATCH_API_KEY=(.+)/);
      if (match) return match[1].trim();
    }
    
    const configFile = path.join(process.cwd(), '.slopwatch', 'config.json');
    if (fs.existsSync(configFile)) {
      const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      return config.apiKey;
    }
    
    return null;
  }
  
  private async validateAPIKey(apiKey: string): Promise<UserContext | null> {
    try {
      const response = await fetch('https://api.slopwatch.com/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client: 'mcp-server',
          version: this.getVersion()
        })
      });
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to validate API key:', error.message);
      return null;
    }
  }
  
  getUserContext(): UserContext {
    if (!this.userContext) {
      throw new Error('Not authenticated. Call initialize() first.');
    }
    return this.userContext;
  }
}
```

#### Data Routing Service
```typescript
// packages/mcp-server/src/services/data-router.ts
export class DataRouter {
  constructor(private userContext: UserContext) {}
  
  async sendActivity(activity: Activity): Promise<void> {
    const payload = {
      userId: this.userContext.userId,
      projectPath: this.getProjectPath(),
      activity: {
        ...activity,
        timestamp: Date.now(),
        mcpVersion: this.getVersion()
      }
    };
    
    await this.sendToAPI('/activities', payload);
  }
  
  async sendAnalysis(analysis: AnalysisResult): Promise<void> {
    const payload = {
      userId: this.userContext.userId,
      projectPath: this.getProjectPath(),
      analysis: {
        ...analysis,
        timestamp: Date.now()
      }
    };
    
    await this.sendToAPI('/analyses', payload);
  }
  
  private async sendToAPI(endpoint: string, data: any): Promise<void> {
    try {
      const response = await fetch(`https://api.slopwatch.com${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.userContext.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      // Fallback to local storage if API is unavailable
      await this.storeLocally(endpoint, data);
      console.warn(`Failed to send to API, stored locally: ${error.message}`);
    }
  }
  
  private async storeLocally(endpoint: string, data: any): Promise<void> {
    const localDir = path.join(process.cwd(), '.slopwatch', 'offline');
    await fs.ensureDir(localDir);
    
    const filename = `${Date.now()}-${endpoint.replace('/', '')}.json`;
    const filepath = path.join(localDir, filename);
    
    await fs.writeJSON(filepath, data);
  }
  
  private getProjectPath(): string {
    return crypto.createHash('md5').update(process.cwd()).digest('hex');
  }
}
```

### CLI Authentication Commands

#### Setup Command
```typescript
// packages/cli/src/commands/auth.ts
export class AuthCommand {
  async setup(): Promise<void> {
    console.log('🚀 Setting up SlopWatch authentication...\n');
    
    // Check if already configured
    if (this.hasExistingAuth()) {
      const overwrite = await this.promptOverwrite();
      if (!overwrite) return;
    }
    
    // Get API key from user
    const apiKey = await this.promptAPIKey();
    
    // Validate API key
    console.log('🔑 Validating API key...');
    const userContext = await this.validateKey(apiKey);
    
    if (!userContext) {
      console.error('❌ Invalid API key. Get one at https://slopwatch.com/dashboard/settings');
      process.exit(1);
    }
    
    // Save configuration
    await this.saveConfiguration(apiKey, userContext);
    
    console.log(`✅ Successfully authenticated as ${userContext.email}`);
    console.log(`📊 Plan: ${userContext.plan}`);
    console.log(`🌐 Dashboard: https://slopwatch.com/dashboard`);
  }
  
  private async promptAPIKey(): Promise<string> {
    const answers = await inquirer.prompt([{
      type: 'password',
      name: 'apiKey',
      message: 'Enter your SlopWatch API key:',
      validate: (input: string) => {
        if (!input.trim()) return 'API key is required';
        if (!input.startsWith('sk_')) return 'Invalid API key format';
        return true;
      }
    }]);
    
    return answers.apiKey.trim();
  }
  
  private async saveConfiguration(apiKey: string, userContext: UserContext): Promise<void> {
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
  }
  
  private async updateGitignore(): Promise<void> {
    const gitignorePath = '.gitignore';
    let gitignoreContent = '';
    
    if (await fs.pathExists(gitignorePath)) {
      gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
    }
    
    const slopwatchEntries = [
      '.env.slopwatch',
      '.slopwatch/config.json',
      '.slopwatch/offline/'
    ];
    
    let needsUpdate = false;
    for (const entry of slopwatchEntries) {
      if (!gitignoreContent.includes(entry)) {
        gitignoreContent += `\n# SlopWatch\n${entry}\n`;
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      await fs.writeFile(gitignorePath, gitignoreContent);
      console.log('📝 Updated .gitignore with SlopWatch entries');
    }
  }
}
```

### Database Schema for Authentication

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- For email/password auth
  name VARCHAR(255),
  plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- API Keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash of API key
  name VARCHAR(100) DEFAULT 'Default', -- User-friendly name
  environment VARCHAR(10) DEFAULT 'live' CHECK (environment IN ('live', 'test')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP -- Optional expiration
);

-- API Key usage tracking
CREATE TABLE api_key_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint VARCHAR(100) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  request_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_key_usage_key_id ON api_key_usage(api_key_id);
CREATE INDEX idx_api_key_usage_created_at ON api_key_usage(created_at);
```

### API Endpoints for Authentication

```typescript
// Backend API routes
app.post('/auth/verify', async (req, res) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  const userContext = await apiKeyService.validateKey(apiKey);
  
  if (!userContext) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  // Track usage
  await apiKeyService.trackUsage(apiKey, req.ip, req.headers['user-agent']);
  
  res.json({
    userId: userContext.userId,
    email: userContext.email,
    plan: userContext.plan,
    status: 'authenticated'
  });
});

app.post('/auth/keys', authenticateUser, async (req, res) => {
  const { name, environment = 'live' } = req.body;
  
  const apiKey = await apiKeyService.generateKey(req.userId, environment);
  
  res.json({
    apiKey,
    name,
    environment,
    created: new Date().toISOString()
  });
});

app.get('/auth/keys', authenticateUser, async (req, res) => {
  const keys = await apiKeyService.getKeysForUser(req.userId);
  
  res.json({
    keys: keys.map(key => ({
      id: key.id,
      name: key.name,
      environment: key.environment,
      lastUsed: key.last_used_at,
      created: key.created_at,
      status: key.status
      // Note: Never return actual key values
    }))
  });
});
```

### User Onboarding Flow

**1. Sign Up Process:**
```typescript
// Frontend signup component
export function SignupForm() {
  const [step, setStep] = useState('email'); // email -> verify -> key
  
  const handleSignup = async (email: string, password: string) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const { userId } = await response.json();
    
    // Generate initial API key
    const keyResponse = await fetch('/api/auth/keys', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tempToken}` },
      body: JSON.stringify({ name: 'Default Key' })
    });
    
    const { apiKey } = await keyResponse.json();
    
    setStep('success');
    setApiKey(apiKey);
  };
  
  if (step === 'success') {
    return (
      <div className="success-state">
        <h2>🎉 Welcome to SlopWatch!</h2>
        <p>Your API key (save this somewhere safe):</p>
        <code className="api-key">{apiKey}</code>
        <p>Next steps:</p>
        <ol>
          <li>Install CLI: <code>npm i -g @slopwatch/cli</code></li>
          <li>Setup project: <code>slopwatch init</code></li>
          <li>Enter your API key when prompted</li>
        </ol>
      </div>
    );
  }
  
  // ... rest of signup form
}
```

**2. CLI Initialization:**
```bash
$ slopwatch init

🚀 Initializing SlopWatch for this project...

✅ Detected: Node.js project with package.json
✅ Detected: Git repository
✅ Detected: Cursor IDE compatible

🔑 Authentication required
Enter your API key (get one at slopwatch.com/signup): sk_live_abc123...

🔍 Validating API key...
✅ Authenticated as john@example.com (Pro plan)

📝 Configuring project...
✅ Created .slopwatch/config.json
✅ Created .env.slopwatch
✅ Updated .gitignore
✅ Configured Cursor MCP

🌐 Dashboard ready: https://slopwatch.com/dashboard
📖 Open Cursor and start coding to see AI claims tracked!

Next: Restart Cursor to activate SlopWatch MCP server.
```

This authentication system provides:
- **Simple setup** (just an API key)
- **Secure routing** (all data tied to authenticated users)
- **Easy debugging** (clear error messages)
- **Scalable foundation** (can add OAuth later)
- **Immediate value** (works in 30 seconds)

---

## Backend Architecture

### 1. MCP Server (`@slopwatch/mcp-server`)

**Location:** `packages/mcp-server/`

**Core Responsibilities:**
- Intercept Cursor AI conversations
- Monitor file system changes
- Analyze AI claims vs reality
- Send real-time updates to web dashboard

**Technology Stack:**
- **Runtime:** Node.js 18+
- **MCP SDK:** `@modelcontextprotocol/sdk`
- **File Watching:** `chokidar`
- **Git Integration:** `simple-git`
- **WebSocket:** `ws`
- **Database:** `better-sqlite3`
- **Language:** TypeScript

**Project Structure:**
```
packages/mcp-server/
├── src/
│   ├── index.ts                 # MCP server entry point
│   ├── handlers/
│   │   ├── conversation.ts      # Handle AI conversations
│   │   ├── file-watcher.ts      # Monitor file changes
│   │   └── analysis.ts          # Analyze claims vs reality
│   ├── detectors/
│   │   ├── base-detector.ts     # Base class for detectors
│   │   ├── css-detector.ts      # CSS/styling claim detection
│   │   ├── js-detector.ts       # JavaScript claim detection
│   │   ├── build-detector.ts    # Build/compile claim detection
│   │   └── test-detector.ts     # Test-related claim detection
│   ├── database/
│   │   ├── schema.ts            # Database schema definitions
│   │   ├── migrations.ts        # Database migrations
│   │   └── queries.ts           # Database query helpers
│   ├── websocket/
│   │   ├── server.ts            # WebSocket server
│   │   └── events.ts            # Event definitions
│   └── utils/
│       ├── diff-analyzer.ts     # Code diff analysis
│       ├── pattern-matcher.ts   # Pattern matching utilities
│       └── logger.ts            # Logging utilities
├── package.json
├── tsconfig.json
└── README.md
```

**Key Components:**

#### 1.1 Conversation Handler
```typescript
// src/handlers/conversation.ts
export class ConversationHandler {
  async handleUserInput(message: string, context: ConversationContext) {
    // Log user input
    await this.database.logUserMessage(message, context);
    
    // Start file monitoring session
    await this.fileWatcher.startSession(context.projectPath);
    
    // Notify dashboard
    this.websocket.broadcast({
      type: 'user_input',
      data: { message, timestamp: Date.now() }
    });
  }

  async handleAIResponse(response: string, context: ConversationContext) {
    // Log AI response
    await this.database.logAIMessage(response, context);
    
    // Extract claims from AI response
    const claims = await this.extractClaims(response);
    
    // Start monitoring for claim verification
    await this.startClaimVerification(claims, context);
    
    // Notify dashboard
    this.websocket.broadcast({
      type: 'ai_response',
      data: { response, claims, timestamp: Date.now() }
    });
  }

  private async extractClaims(response: string): Promise<AIClaim[]> {
    // Pattern matching to extract actionable claims
    // "Fixed header height" -> { type: 'css', action: 'fix', target: 'header height' }
    // "Added error handling" -> { type: 'js', action: 'add', target: 'error handling' }
  }
}
```

#### 1.2 File Watcher
```typescript
// src/handlers/file-watcher.ts
export class FileWatcher {
  private watcher: chokidar.FSWatcher;
  private activeSessions: Map<string, WatchSession> = new Map();

  async startSession(projectPath: string): Promise<string> {
    const sessionId = uuidv4();
    const session: WatchSession = {
      id: sessionId,
      projectPath,
      startTime: Date.now(),
      changes: []
    };

    this.activeSessions.set(sessionId, session);

    // Watch for file changes
    this.watcher = chokidar.watch(projectPath, {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**'
      ],
      persistent: true
    });

    this.watcher.on('change', (path) => this.handleFileChange(sessionId, path));
    this.watcher.on('add', (path) => this.handleFileAdd(sessionId, path));
    this.watcher.on('unlink', (path) => this.handleFileDelete(sessionId, path));

    return sessionId;
  }

  private async handleFileChange(sessionId: string, filePath: string) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Get file diff
    const diff = await this.getDiff(filePath);
    
    const change: FileChange = {
      type: 'modify',
      path: filePath,
      diff,
      timestamp: Date.now()
    };

    session.changes.push(change);
    
    // Log to database
    await this.database.logFileChange(sessionId, change);
    
    // Trigger analysis
    await this.analysisEngine.analyzeChange(sessionId, change);
    
    // Notify dashboard
    this.websocket.broadcast({
      type: 'file_change',
      data: change
    });
  }
}
```

#### 1.3 Analysis Engine
```typescript
// src/handlers/analysis.ts
export class AnalysisEngine {
  private detectors: BaseDetector[] = [
    new CSSDetector(),
    new JavaScriptDetector(),
    new BuildDetector(),
    new TestDetector()
  ];

  async analyzeClaimVsReality(
    claim: AIClaim, 
    changes: FileChange[], 
    sessionId: string
  ): Promise<AnalysisResult> {
    
    // Find appropriate detector
    const detector = this.detectors.find(d => d.canHandle(claim));
    if (!detector) {
      return { status: 'unknown', confidence: 0 };
    }

    // Analyze claim against actual changes
    const result = await detector.analyze(claim, changes);
    
    // Log analysis result
    await this.database.logAnalysis(sessionId, claim, result);
    
    // Update slop score
    await this.updateSlopScore(sessionId, result);
    
    // Send real-time alert if lie detected
    if (result.status === 'lie') {
      this.websocket.broadcast({
        type: 'lie_detected',
        data: {
          claim: claim.text,
          reason: result.reason,
          confidence: result.confidence
        }
      });
    }

    return result;
  }

  private async updateSlopScore(sessionId: string, result: AnalysisResult) {
    // Calculate running slop score based on recent analysis results
    const recentResults = await this.database.getRecentAnalyses(sessionId, 50);
    const lies = recentResults.filter(r => r.status === 'lie').length;
    const total = recentResults.length;
    const slopScore = Math.round((lies / total) * 100);
    
    this.websocket.broadcast({
      type: 'slop_score_update',
      data: { score: slopScore }
    });
  }
}
```

#### 1.4 Comprehensive Detector System

**Detector Architecture:**
SlopWatch uses a modular detector system that can analyze AI claims across all major programming languages, frameworks, and technologies. Each detector specializes in specific patterns and can be independently configured.

```typescript
// src/detectors/base-detector.ts
export abstract class BaseDetector {
  abstract canHandle(claim: AIClaim, changes: FileChange[]): boolean;
  abstract analyze(claim: AIClaim, changes: FileChange[]): Promise<AnalysisResult>;
  
  protected lie(reason: string, confidence: number = 0.9): AnalysisResult {
    return { status: 'lie', confidence, reason };
  }
  
  protected verified(reason: string = 'Changes match claim', confidence: number = 0.8): AnalysisResult {
    return { status: 'verified', confidence, reason };
  }
  
  protected partial(reason: string, confidence: number = 0.6): AnalysisResult {
    return { status: 'partial', confidence, reason };
  }
}

// Complete Detector Registry
export class DetectorRegistry {
  private detectors: BaseDetector[] = [
    // === PROGRAMMING LANGUAGES ===
    new JavaScriptDetector(),      // JS patterns, ES6+, async/await
    new TypeScriptDetector(),      // Type annotations, interfaces, generics
    new PythonDetector(),          // Type hints, async, decorators
    new RustDetector(),            // Memory safety, borrowing, traits
    new GoDetector(),              // Goroutines, channels, interfaces
    new JavaDetector(),            // OOP patterns, Spring annotations
    new CSharpDetector(),          // .NET patterns, LINQ, async
    new PHPDetector(),             // Laravel, Symfony patterns
    new SwiftDetector(),           // iOS patterns, Combine, SwiftUI
    new KotlinDetector(),          // Android patterns, coroutines
    
    // === FRONTEND FRAMEWORKS ===
    new ReactDetector(),           // Hooks, components, JSX, context
    new VueDetector(),            // Composition API, reactivity, templates
    new AngularDetector(),        // Decorators, services, observables
    new SvelteDetector(),         // Stores, transitions, bindings
    new NextJSDetector(),         // App router, server components, API routes
    new NuxtDetector(),           // Pages, middleware, plugins
    new SolidJSDetector(),        // Signals, stores, components
    
    // === BACKEND FRAMEWORKS ===
    new ExpressDetector(),        // Middleware, routes, error handling
    new FastAPIDetector(),        // Pydantic, async routes, OpenAPI
    new DjangoDetector(),         // Models, views, middleware
    new RailsDetector(),          // ActiveRecord, controllers, gems
    new SpringDetector(),         // Annotations, beans, security
    new NestJSDetector(),         // Decorators, modules, providers
    new FlaskDetector(),          // Routes, blueprints, extensions
    
    // === DATABASES ===
    new SQLDetector(),            // Indexes, joins, optimization
    new PostgreSQLDetector(),     // JSONB, triggers, functions
    new MongoDetector(),          // Aggregation, indexing, schema
    new RedisDetector(),          // Caching, pub/sub, data structures
    new SupabaseDetector(),       // RLS, functions, real-time
    new PrismaDetector(),         // Schema, migrations, queries
    new DrizzleDetector(),        // Type-safe queries, migrations
    
    // === CLOUD & INFRASTRUCTURE ===
    new AWSDetector(),            // Services, IAM, CloudFormation
    new GCPDetector(),            // Services, IAM, deployment
    new AzureDetector(),          // Services, ARM templates
    new DockerDetector(),         // Containerization, multi-stage
    new KubernetesDetector(),     // Manifests, services, ingress
    new TerraformDetector(),      // Resources, modules, state
    new ServerlessDetector(),     // Functions, events, triggers
    
    // === DEVOPS & CI/CD ===
    new GitHubActionsDetector(),  // Workflows, actions, secrets
    new GitLabCIDetector(),       // Pipelines, jobs, artifacts
    new JenkinsDetector(),        // Pipelines, stages, agents
    new CircleCIDetector(),       // Config, workflows, orbs
    new VercelDetector(),         // Deployment, functions, config
    new NetlifyDetector(),        // Functions, redirects, forms
    
    // === TESTING ===
    new JestDetector(),           // Unit tests, mocks, coverage
    new VitestDetector(),         // Fast unit testing, snapshots
    new CypressDetector(),        // E2E tests, commands, fixtures
    new PlaywrightDetector(),     // Cross-browser testing, traces
    new TestingLibraryDetector(), // Component testing, queries
    new StorybookDetector(),      // Stories, addons, documentation
    
    // === SECURITY ===
    new AuthenticationDetector(), // JWT, OAuth, sessions, bcrypt
    new AuthorizationDetector(),  // RBAC, permissions, policies
    new ValidationDetector(),     // Input validation, sanitization
    new EncryptionDetector(),     // SSL/TLS, hashing, encryption
    new SecurityHeadersDetector(), // CORS, CSP, HSTS
    
    // === PERFORMANCE ===
    new CachingDetector(),        // Redis, CDN, browser caching
    new OptimizationDetector(),   // Bundle size, tree shaking
    new LazyLoadingDetector(),    // Code splitting, lazy imports
    new ImageOptimizationDetector(), // WebP, compression, responsive
    new DatabaseOptimizationDetector(), // Indexes, query optimization
    
    // === MONITORING & OBSERVABILITY ===
    new LoggingDetector(),        // Winston, Pino, structured logs
    new MonitoringDetector(),     // Prometheus, Grafana, alerts
    new ErrorTrackingDetector(),  // Sentry, Bugsnag, error handling
    new AnalyticsDetector(),      // Google Analytics, Mixpanel
    new PerformanceDetector(),    // Web Vitals, profiling, metrics
    
    // === STYLING & UI ===
    new CSSDetector(),            // Responsive design, animations
    new TailwindDetector(),       // Utility classes, config, plugins
    new StyledComponentsDetector(), // CSS-in-JS, themes, variants
    new SASSDetector(),           // Variables, mixins, modules
    new ChakraUIDetector(),       // Components, themes, responsive
    new MaterialUIDetector(),     // Components, customization
    
    // === BUILD TOOLS ===
    new WebpackDetector(),        // Config, loaders, plugins
    new ViteDetector(),          // Config, plugins, optimization
    new ESBuildDetector(),       // Fast builds, plugins
    new RollupDetector(),        // Bundle configuration, plugins
    new TurborepoDetector(),     // Monorepo, caching, pipelines
    new NxDetector(),            // Workspace, generators, executors
    
    // === API & COMMUNICATION ===
    new GraphQLDetector(),       // Schema, resolvers, subscriptions
    new RESTDetector(),          // Endpoints, status codes, validation
    new WebSocketDetector(),     // Real-time, events, connections
    new GRPCDetector(),          // Protocol buffers, services
    new TRPCDetector(),          // Type-safe APIs, procedures
    
    // === MOBILE DEVELOPMENT ===
    new ReactNativeDetector(),   // Components, navigation, native modules
    new FlutterDetector(),       // Widgets, state management, plugins
    new SwiftUIDetector(),       // Views, modifiers, data flow
    new JetpackComposeDetector(), // Composables, state, navigation
    
    // === GENERIC FALLBACK ===
    new GenericDetector()        // Catches everything else
  ];
  
  getApplicableDetectors(claim: AIClaim, changes: FileChange[]): BaseDetector[] {
    return this.detectors.filter(detector => detector.canHandle(claim, changes));
  }
}
```

**Example Implementation - React Detector:**
```typescript
export class ReactDetector extends BaseDetector {
  canHandle(claim: AIClaim, changes: FileChange[]): boolean {
    return claim.text.includes('react') ||
           claim.text.includes('component') ||
           claim.text.includes('hook') ||
           changes.some(c => /\.(jsx|tsx)$/.test(c.path));
  }

  async analyze(claim: AIClaim, changes: FileChange[]): Promise<AnalysisResult> {
    const reactFiles = changes.filter(c => /\.(jsx|tsx)$/.test(c.path));
    
    if (claim.text.includes('hook')) {
      const hasHooks = reactFiles.some(c =>
        /use(State|Effect|Context|Callback|Memo|Ref|Reducer)\s*\(/.test(c.diff)
      );
      if (!hasHooks) return this.lie('No React hooks found in changes');
    }
    
    if (claim.text.includes('component')) {
      const hasComponent = reactFiles.some(c =>
        /export\s+(default\s+)?function\s+[A-Z]\w*|const\s+[A-Z]\w*\s*=/.test(c.diff)
      );
      if (!hasComponent) return this.lie('No React component created');
    }
    
    if (claim.text.includes('state management')) {
      const hasStateManagement = reactFiles.some(c =>
        /useState|useReducer|createContext|Provider|zustand|redux/.test(c.diff)
      );
      if (!hasStateManagement) return this.lie('No state management implementation found');
    }
    
    if (claim.text.includes('responsive')) {
      const hasResponsive = reactFiles.some(c =>
        /@media|useMediaQuery|breakpoint|sm:|md:|lg:|xl:/.test(c.diff)
      );
      if (!hasResponsive) return this.lie('No responsive design patterns found');
    }
    
    return this.verified('React changes match the claim');
  }
}
```

**Example Implementation - Security Detector:**
```typescript
export class SecurityDetector extends BaseDetector {
  canHandle(claim: AIClaim, changes: FileChange[]): boolean {
    return /security|auth|validation|sanitiz|encrypt|hash|jwt|cors|csrf/.test(claim.text.toLowerCase());
  }

  async analyze(claim: AIClaim, changes: FileChange[]): Promise<AnalysisResult> {
    if (claim.text.includes('validation')) {
      const hasValidation = changes.some(c =>
        /joi\.|yup\.|zod\.|validate\(|sanitize\(|escape\(|validator\./i.test(c.diff)
      );
      if (!hasValidation) return this.lie('No input validation library usage found');
    }
    
    if (claim.text.includes('authentication')) {
      const hasAuth = changes.some(c =>
        /jwt\.|passport\.|bcrypt\.|hash\(|verify\(|authenticate|login|logout/i.test(c.diff)
      );
      if (!hasAuth) return this.lie('No authentication implementation found');
    }
    
    if (claim.text.includes('CORS')) {
      const hasCORS = changes.some(c =>
        /cors|Access-Control-Allow|origin.*\*/i.test(c.diff)
      );
      if (!hasCORS) return this.lie('No CORS configuration found');
    }
    
    if (claim.text.includes('encryption')) {
      const hasEncryption = changes.some(c =>
        /crypto|encrypt|decrypt|cipher|aes|rsa|hash|pbkdf2/i.test(c.diff)
      );
      if (!hasEncryption) return this.lie('No encryption implementation found');
    }
    
    return this.verified('Security implementation matches claim');
  }
}
```

**Detector Configuration:**
```typescript
interface DetectorConfig {
  enabled: boolean;
  confidence: number;
  patterns: string[];
  customRules?: CustomRule[];
}

interface CustomRule {
  pattern: RegExp;
  message: string;
  confidence: number;
}
```

This comprehensive detector system can analyze AI claims across **every major technology stack**, making SlopWatch the universal AI accountability platform for all developers, regardless of their tech choices.

#### 1.5 Database Schema
```typescript
// src/database/schema.ts
export interface ConversationMessage {
  id: string;
  session_id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: number;
  claims?: AIClaim[];
}

export interface FileChange {
  id: string;
  session_id: string;
  type: 'add' | 'modify' | 'delete';
  path: string;
  diff: string;
  timestamp: number;
}

export interface AnalysisResult {
  id: string;
  session_id: string;
  claim_id: string;
  status: 'verified' | 'lie' | 'partial' | 'unknown';
  confidence: number;
  reason: string;
  timestamp: number;
}

export interface AIClaim {
  id: string;
  text: string;
  type: 'css' | 'js' | 'build' | 'test' | 'generic';
  action: 'add' | 'fix' | 'modify' | 'remove' | 'optimize';
  target: string;
  extracted_from: string;
}
```

---

### 2. Web Dashboard (`@slopwatch/dashboard`)

**Location:** `packages/dashboard/`

**Core Responsibilities:**
- Real-time UI for monitoring AI claims
- Analytics and historical data visualization
- Alert system for detected lies
- Configuration management

**Technology Stack:**
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Real-time:** Socket.io-client
- **Charts:** Recharts
- **State Management:** Zustand
- **Language:** TypeScript

**Project Structure:**
```
packages/dashboard/
├── src/
│   ├── app/
│   │   ├── page.tsx                # Main dashboard
│   │   ├── analytics/page.tsx      # Analytics page
│   │   ├── settings/page.tsx       # Settings page
│   │   └── layout.tsx              # Root layout
│   ├── components/
│   │   ├── ui/                     # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── badge.tsx
│   │   ├── dashboard/
│   │   │   ├── activity-feed.tsx   # Live activity feed
│   │   │   ├── stats-grid.tsx      # Statistics cards
│   │   │   ├── slop-score.tsx      # Slop score display
│   │   │   └── alerts.tsx          # Alert notifications
│   │   ├── analytics/
│   │   │   ├── trend-chart.tsx     # Trend analysis
│   │   │   ├── detector-stats.tsx  # Detector performance
│   │   │   └── project-stats.tsx   # Per-project statistics
│   │   └── layout/
│   │       ├── header.tsx
│   │       ├── sidebar.tsx
│   │       └── footer.tsx
│   ├── hooks/
│   │   ├── useWebSocket.ts         # WebSocket connection
│   │   ├── useAnalytics.ts         # Analytics data
│   │   └── useSettings.ts          # Settings management
│   ├── stores/
│   │   ├── dashboard-store.ts      # Dashboard state
│   │   ├── analytics-store.ts      # Analytics state
│   │   └── settings-store.ts       # Settings state
│   ├── types/
│   │   ├── dashboard.ts            # Dashboard type definitions
│   │   ├── analytics.ts            # Analytics type definitions
│   │   └── api.ts                  # API type definitions
│   └── lib/
│       ├── websocket.ts            # WebSocket client
│       ├── api.ts                  # API client
│       └── utils.ts                # Utility functions
├── public/
├── package.json
├── tailwind.config.js
├── next.config.js
└── tsconfig.json
```

**Key Components:**

#### 2.1 Main Dashboard
```typescript
// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useDashboardStore } from '@/stores/dashboard-store';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { SlopScore } from '@/components/dashboard/slop-score';
import { Alerts } from '@/components/dashboard/alerts';

export default function Dashboard() {
  const { isConnected, connectionStatus } = useWebSocket();
  const { activities, stats, slopScore } = useDashboardStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">SlopWatch Dashboard</h1>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-400">{connectionStatus}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <StatsGrid stats={stats} className="mb-8" />
            <ActivityFeed activities={activities} />
          </div>
          
          <div className="space-y-8">
            <SlopScore score={slopScore} />
            <Alerts />
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### 2.2 WebSocket Hook
```typescript
// src/hooks/useWebSocket.ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useDashboardStore } from '@/stores/dashboard-store';

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { addActivity, updateStats, updateSlopScore, addAlert } = useDashboardStore();

  useEffect(() => {
    // Connect to WebSocket server
    socketRef.current = io('ws://localhost:8080', {
      transports: ['websocket']
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to SlopWatch server');
    });

    socket.on('user_input', (data) => {
      addActivity({
        type: 'user_input',
        content: data.message,
        timestamp: data.timestamp
      });
    });

    socket.on('ai_response', (data) => {
      addActivity({
        type: 'ai_response',
        content: data.response,
        claims: data.claims,
        timestamp: data.timestamp
      });
    });

    socket.on('file_change', (data) => {
      addActivity({
        type: 'file_change',
        content: `Modified ${data.path}`,
        details: data.diff,
        timestamp: data.timestamp
      });
    });

    socket.on('lie_detected', (data) => {
      addActivity({
        type: 'lie_detected',
        content: data.claim,
        reason: data.reason,
        confidence: data.confidence,
        timestamp: Date.now()
      });

      addAlert({
        type: 'error',
        title: 'AI Lie Detected!',
        message: `${data.claim} - ${data.reason}`,
        confidence: data.confidence
      });
    });

    socket.on('slop_score_update', (data) => {
      updateSlopScore(data.score);
    });

    return () => {
      socket.disconnect();
    };
  }, [addActivity, updateStats, updateSlopScore, addAlert]);

  return {
    isConnected: socketRef.current?.connected ?? false,
    connectionStatus: socketRef.current?.connected ? 'Connected to Cursor' : 'Disconnected'
  };
}
```

#### 2.3 Activity Feed Component
```typescript
// src/components/dashboard/activity-feed.tsx
import { Activity } from '@/types/dashboard';

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'lie_detected': return '🚨';
      case 'partial_implementation': return '⚠️';
      case 'verified_claim': return '✅';
      case 'file_change': return '📝';
      case 'ai_response': return '🤖';
      case 'user_input': return '👤';
      default: return '•';
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'lie_detected': return 'border-red-500 bg-red-500/10';
      case 'partial_implementation': return 'border-yellow-500 bg-yellow-500/10';
      case 'verified_claim': return 'border-green-500 bg-green-500/10';
      default: return 'border-gray-600 bg-gray-800/50';
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">Live Activity Feed</h2>
      </div>
      
      <div className="divide-y divide-gray-700">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className={`p-4 border-l-4 ${getActivityColor(activity.type)}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{getActivityIcon(activity.type)}</span>
              <div className="flex-1">
                <div className="font-medium">{activity.content}</div>
                {activity.reason && (
                  <div className="text-sm text-gray-400 mt-1">{activity.reason}</div>
                )}
                {activity.confidence && (
                  <div className="text-xs text-gray-500 mt-1">
                    Confidence: {Math.round(activity.confidence * 100)}%
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 2.4 Dashboard Store
```typescript
// src/stores/dashboard-store.ts
import { create } from 'zustand';
import { Activity, DashboardStats, Alert } from '@/types/dashboard';

interface DashboardStore {
  activities: Activity[];
  stats: DashboardStats;
  slopScore: number;
  alerts: Alert[];
  
  addActivity: (activity: Omit<Activity, 'id'>) => void;
  updateStats: (stats: Partial<DashboardStats>) => void;
  updateSlopScore: (score: number) => void;
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => void;
  dismissAlert: (id: string) => void;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  activities: [],
  stats: {
    liesDetected: 0,
    partialImplementations: 0,
    verifiedClaims: 0,
    totalClaims: 0
  },
  slopScore: 0,
  alerts: [],

  addActivity: (activity) => {
    const newActivity: Activity = {
      ...activity,
      id: crypto.randomUUID()
    };
    
    set((state) => ({
      activities: [newActivity, ...state.activities].slice(0, 100) // Keep last 100
    }));

    // Update stats based on activity type
    if (activity.type === 'lie_detected') {
      set((state) => ({
        stats: {
          ...state.stats,
          liesDetected: state.stats.liesDetected + 1,
          totalClaims: state.stats.totalClaims + 1
        }
      }));
    } else if (activity.type === 'verified_claim') {
      set((state) => ({
        stats: {
          ...state.stats,
          verifiedClaims: state.stats.verifiedClaims + 1,
          totalClaims: state.stats.totalClaims + 1
        }
      }));
    }
  },

  updateStats: (newStats) => {
    set((state) => ({
      stats: { ...state.stats, ...newStats }
    }));
  },

  updateSlopScore: (score) => {
    set({ slopScore: score });
  },

  addAlert: (alert) => {
    const newAlert: Alert = {
      ...alert,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    
    set((state) => ({
      alerts: [newAlert, ...state.alerts]
    }));

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      get().dismissAlert(newAlert.id);
    }, 5000);
  },

  dismissAlert: (id) => {
    set((state) => ({
      alerts: state.alerts.filter(alert => alert.id !== id)
    }));
  }
}));
```

---

## Packaging and Distribution

### 1. Monorepo Structure
```
slopwatch/
├── packages/
│   ├── mcp-server/              # MCP server package
│   ├── dashboard/               # Web dashboard
│   └── cli/                     # CLI installation tool
├── apps/
│   └── docs/                    # Documentation site
├── scripts/
│   ├── build.sh                 # Build all packages
│   ├── publish.sh               # Publish to npm
│   └── setup.sh                 # Development setup
├── package.json                 # Root package.json
├── turbo.json                   # Turborepo config
├── tsconfig.json                # Shared TypeScript config
└── README.md
```

### 2. CLI Tool (`@slopwatch/cli`)

**Purpose:** One-command installation and setup

```typescript
// packages/cli/src/index.ts
#!/usr/bin/env node

import { Command } from 'commander';
import { setupSlopWatch } from './setup';
import { startDashboard } from './dashboard';

const program = new Command();

program
  .name('slopwatch')
  .description('AI accountability for Cursor')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize SlopWatch in current project')
  .option('-p, --port <port>', 'Dashboard port', '3000')
  .action(async (options) => {
    console.log('🚀 Setting up SlopWatch...');
    
    // 1. Check if Cursor is installed
    await checkCursorInstallation();
    
    // 2. Install MCP server
    await installMCPServer();
    
    // 3. Configure Cursor MCP settings
    await configureCursorMCP();
    
    // 4. Start dashboard
    await startDashboard(options.port);
    
    console.log('✅ SlopWatch is ready!');
    console.log(`🌐 Dashboard: http://localhost:${options.port}`);
    console.log('📖 Open Cursor and start coding to see AI claims tracked');
  });

program
  .command('start')
  .description('Start SlopWatch dashboard')
  .option('-p, --port <port>', 'Dashboard port', '3000')
  .action(async (options) => {
    await startDashboard(options.port);
  });

program.parse();
```

### 3. Package.json Configuration

```json
{
  "name": "@slopwatch/cli",
  "version": "1.0.0",
  "description": "AI accountability for Cursor",
  "main": "dist/index.js",
  "bin": {
    "slopwatch": "dist/index.js"
  },
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "@slopwatch/mcp-server": "workspace:*",
    "@slopwatch/dashboard": "workspace:*"
  },
  "keywords": [
    "ai",
    "cursor",
    "accountability",
    "development",
    "mcp"
  ]
}
```

### 4. Installation Flow

**User runs:**
```bash
npx @slopwatch/cli init
```

**What happens:**
1. **Check Prerequisites:**
   - Verify Cursor is installed
   - Check Node.js version (18+)
   - Verify project is Git repository

2. **Install MCP Server:**
   - Download and install `@slopwatch/mcp-server`
   - Create configuration files
   - Set up database

3. **Configure Cursor:**
   - Add MCP server to Cursor's `mcp.json`
   - Restart Cursor MCP connection
   - Verify connection

4. **Start Dashboard:**
   - Launch web dashboard on specified port
   - Open browser to dashboard
   - Display setup completion message

### 5. Configuration Files

**Cursor MCP Configuration (`~/.cursor/mcp.json`):**
```json
{
  "mcpServers": {
    "slopwatch": {
      "type": "stdio",
      "command": "npx",
      "args": ["@slopwatch/mcp-server"],
      "env": {
        "SLOPWATCH_PROJECT_PATH": "/path/to/current/project",
        "SLOPWATCH_DASHBOARD_PORT": "3000"
      }
    }
  }
}
```

**SlopWatch Configuration (`.slopwatch/config.json`):**
```json
{
  "version": "1.0.0",
  "project": {
    "name": "my-project",
    "path": "/path/to/project",
    "watchPatterns": [
      "src/**/*",
      "components/**/*",
      "styles/**/*"
    ],
    "ignorePatterns": [
      "node_modules/**",
      "dist/**",
      ".git/**"
    ]
  },
  "detectors": {
    "css": { "enabled": true, "confidence": 0.8 },
    "javascript": { "enabled": true, "confidence": 0.8 },
    "build": { "enabled": true, "confidence": 0.9 },
    "test": { "enabled": true, "confidence": 0.7 }
  },
  "dashboard": {
    "port": 3000,
    "realtime": true,
    "retentionDays": 30
  },
  "notifications": {
    "lies": true,
    "partialImplementations": true,
    "threshold": 0.7
  }
}
```

---

## Deployment and Hosting

### 1. Development Workflow
```bash
# Clone repository
git clone https://github.com/slopwatch/slopwatch
cd slopwatch

# Install dependencies
npm install

# Build all packages
npm run build

# Start development
npm run dev
```

### 2. Publishing to NPM
```bash
# Build and publish all packages
npm run publish

# Packages published:
# - @slopwatch/cli
# - @slopwatch/mcp-server  
# - @slopwatch/dashboard
```

### 3. Distribution Strategy

**Free Tier:**
- Basic lie detection
- Local dashboard
- 7-day history retention
- Community support

**Pro Tier ($29/month):**
- Advanced pattern detection
- Team dashboard with collaboration
- 90-day history retention
- Slack/Discord integrations
- Custom detector configuration
- Priority support

**Enterprise Tier ($199/month):**
- Unlimited team members
- Custom detectors and rules
- SSO integration
- API access
- Dedicated support
- On-premise deployment option

### 4. Hosting Architecture

**SaaS Option (Pro/Enterprise):**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User's MCP    │    │  SlopWatch API  │    │   Dashboard     │
│     Server      │───►│   (Cloud)       │◄──►│   (Hosted)      │
│   (Local)       │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   Database      │
                       │   (PostgreSQL)  │
                       └─────────────────┘
```

**Self-Hosted Option (All Tiers):**
```
┌─────────────────┐    ┌─────────────────┐
│   User's MCP    │    │   Dashboard     │
│     Server      │◄──►│   (Local)       │
│   (Local)       │    │                 │
└─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │   Database      │
                       │   (SQLite)      │
                       └─────────────────┘
```

---

## Advanced Features

### 1. Machine Learning Enhancement

**Pattern Learning Engine:**
```typescript
// packages/ml-engine/src/pattern-learner.ts
export class PatternLearner {
  private model: TensorFlowModel;
  
  async trainOnUserFeedback(
    claim: string, 
    actualChanges: FileChange[], 
    userFeedback: 'correct' | 'incorrect'
  ) {
    // Train model to better detect lies based on user corrections
    const features = this.extractFeatures(claim, actualChanges);
    await this.model.train(features, userFeedback === 'correct' ? 1 : 0);
  }
  
  async predictLieConfidence(claim: string, changes: FileChange[]): Promise<number> {
    const features = this.extractFeatures(claim, changes);
    return await this.model.predict(features);
  }
  
  private extractFeatures(claim: string, changes: FileChange[]) {
    return {
      claimLength: claim.length,
      actionVerbs: this.extractActionVerbs(claim),
      fileTypes: changes.map(c => this.getFileType(c.path)),
      changeTypes: changes.map(c => c.type),
      diffComplexity: changes.map(c => this.calculateDiffComplexity(c.diff))
    };
  }
}
```

### 2. Build Integration

**Build Monitor:**
```typescript
// packages/build-monitor/src/index.ts
export class BuildMonitor {
  async monitorBuildProcess(projectPath: string): Promise<BuildResult> {
    const packageJson = await this.readPackageJson(projectPath);
    const buildCommand = packageJson.scripts?.build || 'npm run build';
    
    const process = spawn(buildCommand, { cwd: projectPath });
    
    return new Promise((resolve) => {
      let output = '';
      let errors = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        errors += data.toString();
      });
      
      process.on('close', (code) => {
        resolve({
          success: code === 0,
          output,
          errors,
          duration: Date.now() - startTime,
          exitCode: code
        });
      });
    });
  }
  
  async analyzeFailure(buildResult: BuildResult, aiClaim: string): Promise<LieAnalysis> {
    if (buildResult.success) {
      return { isLie: false, confidence: 0 };
    }
    
    // Check if AI claimed to fix build issues
    if (aiClaim.includes('fix') && aiClaim.includes('error')) {
      return {
        isLie: true,
        confidence: 0.95,
        reason: `AI claimed to fix errors but build still fails: ${buildResult.errors}`
      };
    }
    
    return { isLie: false, confidence: 0 };
  }
}
```

### 3. Test Integration

**Test Monitor:**
```typescript
// packages/test-monitor/src/index.ts
export class TestMonitor {
  async runTests(projectPath: string): Promise<TestResult> {
    // Support multiple test runners
    const testRunners = ['jest', 'vitest', 'mocha', 'cypress'];
    
    for (const runner of testRunners) {
      if (await this.hasTestRunner(projectPath, runner)) {
        return await this.runTestRunner(projectPath, runner);
      }
    }
    
    return { skipped: true, reason: 'No test runner found' };
  }
  
  async analyzeTestClaims(testResult: TestResult, aiClaim: string): Promise<LieAnalysis> {
    if (aiClaim.includes('test') && aiClaim.includes('pass')) {
      if (testResult.failed > 0) {
        return {
          isLie: true,
          confidence: 0.9,
          reason: `AI claimed tests pass but ${testResult.failed} tests are failing`
        };
      }
    }
    
    if (aiClaim.includes('add') && aiClaim.includes('test')) {
      if (testResult.added === 0) {
        return {
          isLie: true,
          confidence: 0.8,
          reason: 'AI claimed to add tests but no new tests detected'
        };
      }
    }
    
    return { isLie: false, confidence: 0 };
  }
}
```

### 4. Performance Monitoring

**Performance Detector:**
```typescript
// packages/performance-monitor/src/index.ts
export class PerformanceMonitor {
  async measurePerformance(projectPath: string): Promise<PerformanceMetrics> {
    // Bundle size analysis
    const bundleSize = await this.analyzeBundleSize(projectPath);
    
    // Lighthouse audit (for web projects)
    const lighthouse = await this.runLighthouse(projectPath);
    
    // Load time measurement
    const loadTime = await this.measureLoadTime(projectPath);
    
    return {
      bundleSize,
      lighthouse,
      loadTime,
      timestamp: Date.now()
    };
  }
  
  async analyzePerformanceClaims(
    before: PerformanceMetrics, 
    after: PerformanceMetrics, 
    aiClaim: string
  ): Promise<LieAnalysis> {
    if (aiClaim.includes('optim') || aiClaim.includes('performance')) {
      // Check if performance actually improved
      const bundleImprovement = (before.bundleSize - after.bundleSize) / before.bundleSize;
      const loadTimeImprovement = (before.loadTime - after.loadTime) / before.loadTime;
      
      if (bundleImprovement < 0.01 && loadTimeImprovement < 0.01) {
        return {
          isLie: true,
          confidence: 0.8,
          reason: 'AI claimed to optimize performance but no measurable improvement detected'
        };
      }
    }
    
    return { isLie: false, confidence: 0 };
  }
}
```

---

## API Documentation

### 1. MCP Server API

**Server Interface:**
```typescript
interface MCPServer {
  // Required MCP methods
  initialize(): Promise<void>;
  listTools(): Promise<Tool[]>;
  callTool(name: string, arguments: any): Promise<any>;
  
  // SlopWatch specific methods
  startSession(projectPath: string): Promise<string>;
  endSession(sessionId: string): Promise<void>;
  logConversation(sessionId: string, message: ConversationMessage): Promise<void>;
  getAnalysis(sessionId: string): Promise<AnalysisResult[]>;
}
```

### 2. WebSocket Events

**Client → Server:**
```typescript
interface ClientToServerEvents {
  'subscribe': (sessionId: string) => void;
  'unsubscribe': (sessionId: string) => void;
  'get_history': (sessionId: string, limit: number) => void;
  'update_settings': (settings: UserSettings) => void;
}
```

**Server → Client:**
```typescript
interface ServerToClientEvents {
  'user_input': (data: UserInputEvent) => void;
  'ai_response': (data: AIResponseEvent) => void;
  'file_change': (data: FileChangeEvent) => void;
  'lie_detected': (data: LieDetectedEvent) => void;
  'analysis_complete': (data: AnalysisCompleteEvent) => void;
  'slop_score_update': (data: SlopScoreUpdateEvent) => void;
  'connection_status': (data: ConnectionStatusEvent) => void;
}
```

### 3. REST API (Pro/Enterprise)

**Authentication:**
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
```

**Projects:**
```
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PUT    /api/projects/:id
DELETE /api/projects/:id
```

**Analytics:**
```
GET /api/analytics/summary
GET /api/analytics/trends
GET /api/analytics/detectors
GET /api/analytics/export
```

**Team Management (Enterprise):**
```
GET    /api/teams/:id/members
POST   /api/teams/:id/members
DELETE /api/teams/:id/members/:userId
GET    /api/teams/:id/analytics
```

---

## Testing Strategy

### 1. Unit Tests

**MCP Server Tests:**
```typescript
// packages/mcp-server/tests/detectors/css-detector.test.ts
describe('CSSDetector', () => {
  it('should detect responsive design lies', async () => {
    const detector = new CSSDetector();
    const claim = { text: 'Added responsive design', type: 'css' };
    const changes = [
      { path: 'styles.css', diff: 'color: red;' } // No @media queries
    ];
    
    const result = await detector.analyze(claim, changes);
    
    expect(result.status).toBe('lie');
    expect(result.confidence).toBeGreaterThan(0.8);
  });
  
  it('should verify legitimate responsive changes', async () => {
    const detector = new CSSDetector();
    const claim = { text: 'Added responsive design', type: 'css' };
    const changes = [
      { path: 'styles.css', diff: '@media (max-width: 768px) { ... }' }
    ];
    
    const result = await detector.analyze(claim, changes);
    
    expect(result.status).toBe('verified');
  });
});
```

**Dashboard Tests:**
```typescript
// packages/dashboard/tests/components/activity-feed.test.tsx
import { render, screen } from '@testing-library/react';
import { ActivityFeed } from '@/components/dashboard/activity-feed';

describe('ActivityFeed', () => {
  it('should display lie detection activities', () => {
    const activities = [
      {
        id: '1',
        type: 'lie_detected',
        content: 'Fixed responsive design',
        reason: 'No @media queries found',
        confidence: 0.9,
        timestamp: Date.now()
      }
    ];
    
    render(<ActivityFeed activities={activities} />);
    
    expect(screen.getByText('Fixed responsive design')).toBeInTheDocument();
    expect(screen.getByText('No @media queries found')).toBeInTheDocument();
  });
});
```

### 2. Integration Tests

**End-to-End Workflow:**
```typescript
// tests/e2e/full-workflow.test.ts
describe('SlopWatch E2E', () => {
  it('should detect lies in complete workflow', async () => {
    // 1. Start MCP server
    const mcpServer = await startMCPServer();
    
    // 2. Simulate Cursor conversation
    await mcpServer.handleUserInput('Fix the header height');
    await mcpServer.handleAIResponse('✅ Fixed header height to 60px');
    
    // 3. Simulate file changes (but wrong changes)
    await mcpServer.handleFileChange({
      path: 'styles.css',
      diff: 'color: blue;' // No height changes
    });
    
    // 4. Wait for analysis
    await sleep(1000);
    
    // 5. Check results
    const analysis = await mcpServer.getLatestAnalysis();
    expect(analysis.status).toBe('lie');
    expect(analysis.reason).toContain('height');
  });
});
```

### 3. Performance Tests

**Load Testing:**
```typescript
// tests/performance/load.test.ts
describe('SlopWatch Performance', () => {
  it('should handle 100 concurrent file changes', async () => {
    const startTime = Date.now();
    
    const promises = Array.from({ length: 100 }, (_, i) => 
      mcpServer.handleFileChange({
        path: `file-${i}.ts`,
        diff: 'console.log("test");'
      })
    );
    
    await Promise.all(promises);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // Should complete in 5 seconds
  });
});
```

---

## Security Considerations

### 1. Data Privacy

**Local-First Approach:**
- All code analysis happens locally
- No source code sent to external servers
- User data encrypted at rest
- Optional cloud sync with encryption

**Data Handling:**
```typescript
// packages/security/src/encryption.ts
export class DataEncryption {
  async encryptSensitive(data: any): Promise<string> {
    // Encrypt file paths, code snippets, project names
    const key = await this.getUserKey();
    return await encrypt(JSON.stringify(data), key);
  }
  
  async sanitizeForCloud(data: AnalysisResult): Promise<SafeAnalysisResult> {
    return {
      ...data,
      // Remove file paths and code content
      filePath: this.hashPath(data.filePath),
      codeSnippet: undefined,
      projectName: this.hashProject(data.projectName)
    };
  }
}
```

### 2. Access Control

**Team Permissions (Enterprise):**
```typescript
enum Permission {
  VIEW_ANALYTICS = 'view:analytics',
  MANAGE_PROJECTS = 'manage:projects',
  ADMIN_TEAM = 'admin:team'
}

interface TeamMember {
  userId: string;
  role: 'viewer' | 'developer' | 'admin';
  permissions: Permission[];
  projects: string[];
}
```

### 3. Rate Limiting

**API Protection:**
```typescript
// Rate limiting for API endpoints
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api', rateLimiter);
```

---

## Monitoring and Observability

### 1. Application Metrics

**Key Metrics to Track:**
- Detection accuracy rate
- False positive/negative rates
- Response times for analysis
- WebSocket connection stability
- Database query performance

**Metrics Collection:**
```typescript
// packages/monitoring/src/metrics.ts
export class MetricsCollector {
  async recordDetection(detector: string, status: 'lie' | 'verified', confidence: number) {
    await this.increment(`detection.${detector}.${status}`);
    await this.histogram(`detection.${detector}.confidence`, confidence);
  }
  
  async recordAnalysisTime(detector: string, duration: number) {
    await this.histogram(`analysis.${detector}.duration`, duration);
  }
  
  async recordWebSocketConnection(event: 'connect' | 'disconnect') {
    await this.increment(`websocket.${event}`);
  }
}
```

### 2. Error Tracking

**Sentry Integration:**
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

// Automatic error capture in MCP server
process.on('uncaughtException', (error) => {
  Sentry.captureException(error);
});
```

### 3. Health Checks

**System Health Monitoring:**
```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    websocket: await checkWebSocket(),
    fileWatcher: await checkFileWatcher(),
    mcpConnection: await checkMCPConnection()
  };
  
  const healthy = Object.values(checks).every(check => check.status === 'ok');
  
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  });
});
```

---

## Roadmap and Future Features

### Phase 1: MVP (Months 1-3)
- ✅ Basic MCP server implementation
- ✅ Core detectors (CSS, JS, Build)
- ✅ Real-time dashboard
- ✅ CLI installation tool
- ✅ Local-only operation

### Phase 2: Enhanced Detection (Months 4-6)
- 🔄 Machine learning pattern detection
- 🔄 Test integration monitoring
- 🔄 Performance metrics tracking
- 🔄 Custom detector configuration
- 🔄 Team collaboration features

### Phase 3: Enterprise Features (Months 7-12)
- 📋 Cloud-hosted option
- 📋 SSO integration
- 📋 Advanced analytics
- 📋 API access
- 📋 Multi-project management
- 📋 Slack/Discord integrations

### Phase 4: AI Revolution (Year 2)
- 🔮 Support for other AI IDEs (GitHub Copilot, etc.)
- 🔮 Predictive lie detection
- 🔮 AI coaching features
- 🔮 Industry benchmarking
- 🔮 White-label solutions

---

## Conclusion

SlopWatch addresses a critical gap in the AI development ecosystem by providing real-time accountability for AI coding assistants. The technical architecture is designed to be:

- **Reliable:** Robust detection algorithms with high confidence scoring
- **Scalable:** From individual developers to enterprise teams
- **Privacy-First:** Local processing with optional cloud features
- **Extensible:** Plugin architecture for custom detectors
- **User-Friendly:** One-command setup and intuitive dashboard

The combination of MCP protocol integration, real-time file monitoring, and intelligent analysis creates a powerful platform for building trust in AI-assisted development. With proper execution, SlopWatch has the potential to become an essential tool for every developer using AI coding assistants.

**Next Steps:**
1. Implement MVP with core detection features
2. Gather user feedback and iterate
3. Build community around AI accountability
4. Scale to enterprise customers
5. Expand to other AI development tools

The future of AI development needs accountability. SlopWatch provides exactly that.