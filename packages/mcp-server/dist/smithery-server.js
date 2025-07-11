#!/usr/bin/env node
/**
 * SlopWatch MCP Smithery Server - Minimal HTTP implementation for Smithery.ai hosting
 * Professional AI lie detection for development environments
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { glob } from 'glob';
import http from 'http';
// Schema definitions
const AnalyzeClaimSchema = z.object({
    claim: z.string().min(1).describe("The AI claim to analyze for truthfulness"),
    workspaceDir: z.string().optional().describe("Directory to analyze (defaults to current working directory)"),
    fileTypes: z.array(z.string()).optional().describe("Specific file types to analyze (e.g., ['.js', '.ts', '.py'])"),
    maxFiles: z.number().min(1).max(1000).default(100).describe("Maximum number of files to analyze")
});
const GetStatusSchema = z.object({
    detailed: z.boolean().default(false).describe("Whether to return detailed statistics")
});
// JSON Schema objects for MCP compliance
const analyzeClaimJsonSchema = {
    type: "object",
    properties: {
        claim: {
            type: "string",
            description: "The AI claim to analyze for truthfulness"
        },
        workspaceDir: {
            type: "string",
            description: "Directory to analyze (defaults to current working directory)"
        },
        fileTypes: {
            type: "array",
            items: { type: "string" },
            description: "Specific file types to analyze (e.g., ['.js', '.ts', '.py'])"
        },
        maxFiles: {
            type: "number",
            minimum: 1,
            maximum: 1000,
            default: 100,
            description: "Maximum number of files to analyze"
        }
    },
    required: ["claim"]
};
const getStatusJsonSchema = {
    type: "object",
    properties: {
        detailed: {
            type: "boolean",
            default: false,
            description: "Whether to return detailed statistics"
        }
    }
};
// Core analysis patterns
const PATTERNS = {
    javascript: {
        error_handling: /try\s*\{[\s\S]*?\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*?\}/g,
        async_await: /async\s+function|await\s+[\w.()[\]]+/g,
        validation: /(?:===|!==|==|!=)\s*(?:null|undefined)|typeof\s+\w+/g,
        promises: /\.then\s*\(|Promise\./g
    },
    css: {
        responsive: /@media\s*\([^)]*\)/g,
        flexbox: /display\s*:\s*flex/g,
        grid: /display\s*:\s*grid/g,
        dark_mode: /@media\s*\(prefers-color-scheme:\s*dark\)/g
    },
    python: {
        error_handling: /try\s*:|except\s+\w+:|finally\s*:/g,
        type_hints: /:\s*(?:str|int|float|bool|List|Dict|Optional)/g,
        async_await: /async\s+def|await\s+\w+/g
    }
};
class SlopWatchSmitheryServer {
    server;
    analysisCount = 0;
    liesDetected = 0;
    httpServer;
    constructor() {
        this.server = new Server({
            name: 'slopwatch-mcp-server',
            version: '1.0.0',
        });
        this.setupHandlers();
    }
    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'analyze_claim',
                    description: 'Analyze an AI claim against actual code to detect lies and inconsistencies',
                    inputSchema: analyzeClaimJsonSchema,
                },
                {
                    name: 'get_status',
                    description: 'Get current status and statistics of the SlopWatch server',
                    inputSchema: getStatusJsonSchema,
                },
            ],
        }));
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'analyze_claim':
                        return await this.handleAnalyzeClaim(args);
                    case 'get_status':
                        return await this.handleGetStatus(args);
                    default:
                        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
                }
            }
            catch (error) {
                if (error instanceof McpError) {
                    throw error;
                }
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`Error in tool ${name}:`, error);
                throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${errorMessage}`);
            }
        });
    }
    async handleAnalyzeClaim(args) {
        const params = AnalyzeClaimSchema.parse(args);
        const { claim, workspaceDir = '/tmp/demo-workspace', fileTypes, maxFiles = 100 } = params;
        console.log(`🔍 Analyzing claim: "${claim}"`);
        try {
            // Ensure demo workspace exists for Smithery hosting
            this.ensureDemoWorkspace(workspaceDir);
            const files = await this.findFiles(workspaceDir, fileTypes, maxFiles);
            if (files.length === 0) {
                return {
                    content: [{
                            type: 'text',
                            text: `❌ No supported files found in ${workspaceDir}\n\nSupported extensions: .js, .ts, .jsx, .tsx, .py, .css, .html`
                        }]
                };
            }
            const results = await this.analyzeFiles(files, claim);
            this.analysisCount++;
            if (results.isLie) {
                this.liesDetected++;
            }
            const response = this.formatAnalysisResponse(results, files.length);
            return { content: [{ type: 'text', text: response }] };
        }
        catch (error) {
            console.error('Analysis failed:', error);
            throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    ensureDemoWorkspace(workspace) {
        try {
            if (!existsSync(workspace)) {
                mkdirSync(workspace, { recursive: true });
            }
            // Create demo JavaScript file with no error handling
            const demoJS = `// Demo file for SlopWatch testing
function processData(data) {
  return data.map(item => item.value);
}

async function fetchData() {
  const response = fetch('/api/data');
  return response.json();
}

function calculateTotal(items) {
  let total = 0;
  for (let item of items) {
    total += item.price;
  }
  return total;
}`;
            // Create demo CSS file with no responsive design
            const demoCSS = `/* Demo stylesheet */
.container {
  width: 1200px;
  background: white;
  padding: 20px;
}

.button {
  padding: 10px 20px;
  color: blue;
  background: white;
  border: 1px solid blue;
}

.header {
  font-size: 24px;
  font-weight: bold;
}`;
            // Create demo Python file with no error handling
            const demoPython = `# Demo Python file
def process_data(data):
    return [item['value'] for item in data]

def fetch_user_data(user_id):
    response = requests.get(f'/api/users/{user_id}')
    return response.json()

def calculate_average(numbers):
    return sum(numbers) / len(numbers)`;
            const jsPath = join(workspace, 'demo.js');
            const cssPath = join(workspace, 'demo.css');
            const pyPath = join(workspace, 'demo.py');
            if (!existsSync(jsPath)) {
                writeFileSync(jsPath, demoJS);
            }
            if (!existsSync(cssPath)) {
                writeFileSync(cssPath, demoCSS);
            }
            if (!existsSync(pyPath)) {
                writeFileSync(pyPath, demoPython);
            }
        }
        catch (error) {
            console.error('Failed to create demo workspace:', error);
        }
    }
    async handleGetStatus(args) {
        const params = GetStatusSchema.parse(args);
        const detailed = params.detailed ?? false;
        const slopScore = this.analysisCount > 0 ? (this.liesDetected / this.analysisCount) * 100 : 0;
        let response = this.createBanner();
        response += `\n📊 Current Status:\n`;
        response += `├─ Total Analyses: ${this.analysisCount}\n`;
        response += `├─ Lies Detected: ${this.liesDetected}\n`;
        response += `└─ Slop Score: ${slopScore.toFixed(1)}%\n`;
        if (detailed) {
            response += `\n🔍 Detailed Statistics:\n`;
            response += `├─ Server Uptime: ${process.uptime().toFixed(1)}s\n`;
            response += `├─ Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}MB\n`;
            response += `├─ Node Version: ${process.version}\n`;
            response += `└─ Transport: HTTP (Smithery)\n`;
        }
        return { content: [{ type: 'text', text: response }] };
    }
    async findFiles(dir, fileTypes, maxFiles = 100) {
        const extensions = fileTypes || ['.js', '.ts', '.jsx', '.tsx', '.py', '.css', '.html'];
        const patterns = extensions.map(ext => `**/*${ext}`);
        const allFiles = [];
        for (const pattern of patterns) {
            try {
                const files = await glob(pattern, {
                    cwd: dir,
                    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
                    nodir: true
                });
                allFiles.push(...files.map(f => join(dir, f)));
            }
            catch (error) {
                console.error(`Error globbing ${pattern}:`, error);
            }
        }
        return allFiles.slice(0, maxFiles);
    }
    async analyzeFiles(files, claim) {
        const normalizedClaim = claim.toLowerCase();
        const evidence = [];
        let totalScore = 0;
        let checkedPatterns = 0;
        for (const file of files) {
            try {
                const content = readFileSync(file, 'utf8');
                const ext = extname(file).toLowerCase();
                let language = null;
                if (['.js', '.jsx', '.ts', '.tsx'].includes(ext))
                    language = 'javascript';
                else if (['.css', '.scss', '.sass'].includes(ext))
                    language = 'css';
                else if (['.py'].includes(ext))
                    language = 'python';
                if (!language)
                    continue;
                const patterns = PATTERNS[language];
                for (const [patternType, regex] of Object.entries(patterns)) {
                    if (this.isRelevantToAction(patternType, normalizedClaim)) {
                        checkedPatterns++;
                        const matches = content.match(regex) || [];
                        if (matches.length > 0) {
                            evidence.push(`✅ Found ${matches.length} ${patternType} pattern(s) in ${file}`);
                            totalScore += 0.8;
                        }
                        else {
                            evidence.push(`❌ Expected ${patternType} but none found in ${file}`);
                            totalScore += 0.2;
                        }
                    }
                }
            }
            catch (error) {
                console.error(`Error reading ${file}:`, error);
            }
        }
        const confidence = checkedPatterns > 0 ? totalScore / checkedPatterns : 0.5;
        const isLie = confidence < 0.4;
        const contradictingEvidence = evidence.filter(e => e.includes('❌'));
        const supportingEvidence = evidence.filter(e => e.includes('✅'));
        let summary;
        if (isLie) {
            summary = `🚨 LIE DETECTED: Found ${contradictingEvidence.length} contradicting and ${supportingEvidence.length} supporting evidence. The code does not support the AI's claim.`;
        }
        else {
            summary = `✅ CLAIM VERIFIED: Found ${supportingEvidence.length} supporting and ${contradictingEvidence.length} contradicting evidence. The code appears to support the AI's claim.`;
        }
        return {
            isLie,
            confidence: Math.round(confidence * 100) / 100,
            evidence,
            summary
        };
    }
    isRelevantToAction(patternType, claim) {
        const mappings = {
            error_handling: ['error', 'exception', 'try', 'catch', 'handling', 'robust'],
            async_await: ['async', 'await', 'asynchronous', 'promise'],
            validation: ['validate', 'validation', 'check', 'verify'],
            promises: ['promise', 'async', 'then'],
            responsive: ['responsive', 'mobile', 'tablet', 'breakpoint'],
            flexbox: ['flex', 'flexbox', 'layout'],
            grid: ['grid', 'layout'],
            dark_mode: ['dark', 'theme', 'mode'],
            type_hints: ['type', 'typing', 'hint']
        };
        const keywords = mappings[patternType] || [];
        return keywords.some(keyword => claim.includes(keyword));
    }
    formatAnalysisResponse(results, fileCount) {
        const banner = this.createBanner();
        let response = `${banner}\n\n`;
        response += `${results.summary}\n\n`;
        response += `📊 **Analysis Details:**\n`;
        response += `├─ Files analyzed: ${fileCount}\n`;
        response += `├─ Confidence score: ${Math.round(results.confidence * 100)}%\n`;
        response += `└─ Evidence found: ${results.evidence.length} items\n\n`;
        if (results.evidence.length > 0) {
            response += `🔍 **Evidence:**\n`;
            results.evidence.forEach((evidence, i) => {
                response += `   ${i + 1}. ${evidence}\n`;
            });
        }
        return response;
    }
    createBanner() {
        return `
   ███████╗██╗      ██████╗ ██████╗ ██╗    ██╗ █████╗ ████████╗ ██████╗██╗  ██╗
   ██╔════╝██║     ██╔═══██╗██╔══██╗██║    ██║██╔══██╗╚══██╔══╝██╔════╝██║  ██║
   ███████╗██║     ██║   ██║██████╔╝██║ █╗ ██║███████║   ██║   ██║     ███████║
   ╚════██║██║     ██║   ██║██╔═══╝ ██║███╗██║██╔══██║   ██║   ██║     ██╔══██║
   ███████║███████╗╚██████╔╝██║     ╚███╔███╔╝██║  ██║   ██║   ╚██████╗██║  ██║
   ╚══════╝╚══════╝ ╚═════╝ ╚═╝      ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝

   🔥 SlopWatch Smithery Server v1.0.0 - Professional AI Lie Detection`.trim();
    }
    async startHTTP(port = parseInt(process.env.PORT || '3000')) {
        console.log(`🚀 Starting SlopWatch HTTP Server on port ${port}`);
        this.httpServer = http.createServer(async (req, res) => {
            // Set CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            if (req.url === '/mcp' && ['GET', 'POST'].includes(req.method || '')) {
                await this.handleMCPRequest(req, res);
            }
            else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        });
        this.httpServer.listen(port, () => {
            console.log(`✅ SlopWatch HTTP Server listening on port ${port}`);
            console.log(`📡 MCP endpoint available at http://localhost:${port}/mcp`);
        });
    }
    async handleMCPRequest(req, res) {
        try {
            let body = '';
            req.on('data', (chunk) => body += chunk);
            req.on('end', () => {
                this.processMCPMessage(body, req, res);
            });
        }
        catch (error) {
            console.error('HTTP request error:', error);
            res.writeHead(500);
            res.end();
        }
    }
    async processMCPMessage(body, req, res) {
        try {
            const message = body ? JSON.parse(body) : { method: 'initialize' };
            let response;
            if (req.method === 'GET' || message.method === 'initialize') {
                response = {
                    jsonrpc: "2.0",
                    id: message.id || 1,
                    result: {
                        protocolVersion: "2024-11-05",
                        capabilities: { tools: {} },
                        serverInfo: {
                            name: "slopwatch-mcp-server",
                            version: "1.0.0"
                        }
                    }
                };
            }
            else {
                // Handle other MCP requests through the server
                try {
                    const result = message.method === 'tools/list'
                        ? { tools: await this.getTools() }
                        : await this.handleToolCall(message);
                    response = {
                        jsonrpc: "2.0",
                        id: message.id,
                        result
                    };
                }
                catch (error) {
                    response = {
                        jsonrpc: "2.0",
                        id: message.id,
                        error: {
                            code: -32603,
                            message: error instanceof Error ? error.message : 'Internal error'
                        }
                    };
                }
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
        }
        catch (error) {
            console.error('MCP message processing error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                error: { code: -32603, message: "Internal error" }
            }));
        }
    }
    async getTools() {
        return [
            {
                name: 'analyze_claim',
                description: 'Analyze an AI claim against actual code to detect lies and inconsistencies',
                inputSchema: analyzeClaimJsonSchema,
            },
            {
                name: 'get_status',
                description: 'Get current status and statistics of the SlopWatch server',
                inputSchema: getStatusJsonSchema,
            },
        ];
    }
    async handleToolCall(message) {
        const { name, arguments: args } = message.params;
        switch (name) {
            case 'analyze_claim':
                return await this.handleAnalyzeClaim(args);
            case 'get_status':
                return await this.handleGetStatus(args);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    async startStdio() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('🚀 SlopWatch MCP Server started successfully (stdio)');
    }
}
async function main() {
    try {
        const server = new SlopWatchSmitheryServer();
        // Use HTTP for Smithery, stdio for local development
        if (process.env.PORT || process.argv.includes('--http')) {
            await server.startHTTP();
        }
        else {
            await server.startStdio();
        }
    }
    catch (error) {
        console.error('❌ Failed to start SlopWatch Server:', error);
        process.exit(1);
    }
}
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => {
        console.error('❌ Server startup failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=smithery-server.js.map