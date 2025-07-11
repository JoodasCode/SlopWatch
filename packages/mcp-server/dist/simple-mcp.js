#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { createServer } from 'http';
import { parse } from 'url';
// Detection patterns for different languages
const DETECTION_PATTERNS = [
    // Error handling
    {
        pattern: /try\s*{|catch\s*\(|\.catch\s*\(|throw\s+new|Promise\.catch/,
        type: 'error_handling',
        description: 'Error handling (try/catch, Promise.catch, throw)'
    },
    // Async/await
    {
        pattern: /async\s+function|await\s+|Promise\s*\./,
        type: 'async_await',
        description: 'Async/await functionality'
    },
    // Type definitions
    {
        pattern: /interface\s+\w+|type\s+\w+\s*=|:\s*\w+\[\]|:\s*string|:\s*number|:\s*boolean/,
        type: 'typescript_types',
        description: 'TypeScript type definitions'
    },
    // Validation
    {
        pattern: /if\s*\(.*\.length|if\s*\(!.*\)|validate\w*\(|check\w*\(|\.test\s*\(/,
        type: 'validation',
        description: 'Input validation and checks'
    },
    // CSS responsive design
    {
        pattern: /@media\s*\(|min-width|max-width|flex|grid|display:\s*flex|display:\s*grid/,
        type: 'responsive_design',
        description: 'Responsive design (media queries, flexbox, grid)'
    },
    // CSS dark mode
    {
        pattern: /prefers-color-scheme|data-theme|\.dark|--.*-dark|var\(--/,
        type: 'dark_mode',
        description: 'Dark mode implementation'
    },
    // React hooks
    {
        pattern: /useState|useEffect|useContext|useReducer|useMemo|useCallback|use\w+/,
        type: 'react_hooks',
        description: 'React hooks'
    },
    // Testing
    {
        pattern: /describe\s*\(|it\s*\(|test\s*\(|expect\s*\(|jest\.|vitest\.|mocha\./,
        type: 'testing',
        description: 'Unit tests'
    }
];
class SimpleLieDetector {
    workspaceDir;
    constructor(workspaceDir = process.cwd()) {
        this.workspaceDir = workspaceDir;
    }
    async analyzeClaim(claim, options = {}) {
        const maxFiles = options.maxFiles || 100;
        const fileTypes = options.fileTypes || ['.js', '.ts', '.tsx', '.jsx', '.css', '.py', '.html'];
        // Parse claim to identify what to look for
        const expectedPatterns = this.parseClaimForPatterns(claim);
        if (expectedPatterns.length === 0) {
            return {
                isLie: false,
                confidence: 0.1,
                evidence: ['Cannot determine what to verify from this claim'],
                analysis: 'The claim is too vague or does not contain verifiable technical assertions.',
                filesAnalyzed: 0
            };
        }
        // Get relevant files
        const files = this.getRelevantFiles(fileTypes, maxFiles);
        // Analyze files for patterns
        const evidence = [];
        let matchCount = 0;
        for (const file of files) {
            try {
                const content = readFileSync(file, 'utf8');
                for (const expected of expectedPatterns) {
                    const matches = content.match(expected.pattern);
                    if (matches) {
                        matchCount++;
                        evidence.push(`✅ Found ${expected.description} in ${file}`);
                    }
                }
            }
            catch (error) {
                // Skip files that can't be read
                continue;
            }
        }
        // Calculate if it's a lie
        const expectedFinds = expectedPatterns.length;
        const actualFinds = matchCount;
        const confidence = actualFinds === 0 ? 0.9 : Math.max(0.1, 1 - (actualFinds / expectedFinds));
        const isLie = actualFinds === 0;
        if (isLie) {
            evidence.unshift(`❌ Expected ${expectedPatterns.map(p => p.description).join(', ')} but found none`);
        }
        return {
            isLie,
            confidence,
            evidence,
            analysis: this.generateAnalysis(claim, isLie, confidence, actualFinds, expectedFinds),
            filesAnalyzed: files.length
        };
    }
    parseClaimForPatterns(claim) {
        const patterns = [];
        const lowerClaim = claim.toLowerCase();
        // Check for different types of claims
        if (lowerClaim.includes('error handling') || lowerClaim.includes('try catch') || lowerClaim.includes('exception')) {
            patterns.push(DETECTION_PATTERNS.find(p => p.type === 'error_handling'));
        }
        if (lowerClaim.includes('async') || lowerClaim.includes('await') || lowerClaim.includes('promise')) {
            patterns.push(DETECTION_PATTERNS.find(p => p.type === 'async_await'));
        }
        if (lowerClaim.includes('typescript') || lowerClaim.includes('types') || lowerClaim.includes('interface')) {
            patterns.push(DETECTION_PATTERNS.find(p => p.type === 'typescript_types'));
        }
        if (lowerClaim.includes('validation') || lowerClaim.includes('validate') || lowerClaim.includes('check')) {
            patterns.push(DETECTION_PATTERNS.find(p => p.type === 'validation'));
        }
        if (lowerClaim.includes('responsive') || lowerClaim.includes('media query') || lowerClaim.includes('mobile')) {
            patterns.push(DETECTION_PATTERNS.find(p => p.type === 'responsive_design'));
        }
        if (lowerClaim.includes('dark mode') || lowerClaim.includes('theme')) {
            patterns.push(DETECTION_PATTERNS.find(p => p.type === 'dark_mode'));
        }
        if (lowerClaim.includes('react') || lowerClaim.includes('hook') || lowerClaim.includes('usestate')) {
            patterns.push(DETECTION_PATTERNS.find(p => p.type === 'react_hooks'));
        }
        if (lowerClaim.includes('test') || lowerClaim.includes('unit test') || lowerClaim.includes('testing')) {
            patterns.push(DETECTION_PATTERNS.find(p => p.type === 'testing'));
        }
        return patterns.filter(Boolean);
    }
    getRelevantFiles(fileTypes, maxFiles) {
        const files = [];
        const scanDir = (dir, depth = 0) => {
            if (depth > 3 || files.length >= maxFiles)
                return;
            try {
                const items = readdirSync(dir);
                for (const item of items) {
                    if (files.length >= maxFiles)
                        break;
                    const fullPath = join(dir, item);
                    const stat = statSync(fullPath);
                    if (stat.isDirectory()) {
                        if (!item.startsWith('.') && item !== 'node_modules' && item !== 'dist') {
                            scanDir(fullPath, depth + 1);
                        }
                    }
                    else if (stat.isFile()) {
                        const ext = extname(item);
                        if (fileTypes.includes(ext)) {
                            files.push(fullPath);
                        }
                    }
                }
            }
            catch (error) {
                // Skip directories we can't read
            }
        };
        scanDir(this.workspaceDir);
        return files;
    }
    generateAnalysis(claim, isLie, confidence, found, expected) {
        if (isLie) {
            return `🚨 LIE DETECTED: The claim "${claim}" is not supported by the code. Expected to find evidence but found none. Confidence: ${Math.round(confidence * 100)}%`;
        }
        else {
            return `✅ CLAIM VERIFIED: Found ${found} pieces of supporting evidence for "${claim}". Confidence: ${Math.round((1 - confidence) * 100)}%`;
        }
    }
}
// MCP Server setup
const server = new Server({
    name: 'slopwatch-mcp-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'analyze_claim',
                description: 'Analyze an AI claim against actual code to detect lies',
                inputSchema: {
                    type: 'object',
                    properties: {
                        claim: {
                            type: 'string',
                            description: 'The AI claim to analyze'
                        },
                        workspaceDir: {
                            type: 'string',
                            description: 'Directory to analyze (optional, defaults to current)'
                        },
                        maxFiles: {
                            type: 'number',
                            description: 'Maximum files to analyze (default: 100)'
                        },
                        fileTypes: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'File extensions to check (default: .js,.ts,.tsx,.jsx,.css,.py,.html)'
                        }
                    },
                    required: ['claim']
                }
            },
            {
                name: 'get_status',
                description: 'Get SlopWatch status and capabilities',
                inputSchema: {
                    type: 'object',
                    properties: {
                        detailed: {
                            type: 'boolean',
                            description: 'Show detailed information'
                        }
                    }
                }
            }
        ]
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
        case 'analyze_claim': {
            const detector = new SimpleLieDetector(args?.workspaceDir);
            const result = await detector.analyzeClaim(args?.claim || '', {
                maxFiles: args?.maxFiles,
                fileTypes: args?.fileTypes
            });
            return {
                content: [
                    {
                        type: 'text',
                        text: `${result.analysis}

📊 Analysis Details:
├─ Files analyzed: ${result.filesAnalyzed}
├─ Confidence score: ${Math.round(result.confidence * 100)}%
└─ Evidence found: ${result.evidence.length} items

🔍 Evidence:
${result.evidence.map((e, i) => `   ${i + 1}. ${e}`).join('\n')}`
                    }
                ]
            };
        }
        case 'get_status': {
            const status = {
                name: 'SlopWatch MCP Server',
                version: '1.0.0',
                status: 'active',
                capabilities: [
                    'AI lie detection',
                    'Multi-language analysis',
                    'Pattern matching',
                    'Real-time verification'
                ],
                supportedLanguages: ['JavaScript', 'TypeScript', 'CSS', 'Python', 'HTML', 'React'],
                detectionTypes: DETECTION_PATTERNS.map(p => p.description)
            };
            return {
                content: [
                    {
                        type: 'text',
                        text: args?.detailed
                            ? JSON.stringify(status, null, 2)
                            : `🔥 SlopWatch MCP Server v${status.version} - Status: ${status.status}\n\nSupported: ${status.supportedLanguages.join(', ')}`
                    }
                ]
            };
        }
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
});
// HTTP Server for Smithery hosting
function createHttpServer() {
    return createServer(async (req, res) => {
        const { pathname, query } = parse(req.url || '', true);
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        if (pathname === '/mcp') {
            if (req.method === 'GET') {
                // Tool discovery
                const tools = await server.request({ method: 'tools/list' }, { method: 'tools/list' });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ tools: tools.tools }));
            }
            else if (req.method === 'POST') {
                // Tool execution
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const message = JSON.parse(body);
                        const result = await server.request(message, { method: 'tools/call', params: message.params });
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    }
                    catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Invalid request' }));
                    }
                });
            }
        }
        else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    });
}
// Main execution
async function main() {
    const args = process.argv.slice(2);
    if (args.includes('--http')) {
        // HTTP mode for Smithery
        const port = parseInt(process.env.PORT || '3000');
        const httpServer = createHttpServer();
        httpServer.listen(port, () => {
            console.log(`🔥 SlopWatch MCP Server running on http://localhost:${port}`);
            console.log(`📊 Health check: http://localhost:${port}/mcp`);
        });
    }
    else {
        // STDIO mode for local MCP clients
        const transport = new StdioServerTransport();
        await server.connect(transport);
    }
}
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}
