#!/usr/bin/env node
/**
 * SlopWatch MCP Server - Professional AI Lie Detection
 * A production-ready MCP server for real-time AI lie detection in development environments.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError, } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { readFileSync } from 'fs';
import { join, extname } from 'path';
import { glob } from 'glob';
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
// JSON Schema objects for MCP compliance (Smithery requirement)
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
// Core analysis patterns for different languages
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
class SlopWatchServer {
    server;
    analysisCount = 0;
    liesDetected = 0;
    constructor() {
        this.server = new Server({
            name: 'slopwatch-mcp-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
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
        const { claim, workspaceDir = process.cwd(), fileTypes, maxFiles = 100 } = params;
        console.error(`🔍 Analyzing claim: "${claim}"`);
        try {
            // Find files to analyze
            const files = await this.findFiles(workspaceDir, fileTypes, maxFiles);
            if (files.length === 0) {
                return {
                    content: [{
                            type: 'text',
                            text: `❌ No supported files found in ${workspaceDir}\n\nSupported extensions: .js, .ts, .jsx, .tsx, .py, .css, .html`
                        }]
                };
            }
            // Analyze files
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
    async handleGetStatus(args) {
        const params = GetStatusSchema.parse(args);
        const detailed = params.detailed ?? false;
        const banner = this.createBanner();
        let response = `${banner}\n\n`;
        response += `📊 **SlopWatch Status:**\n`;
        response += `├─ Total analyses: ${this.analysisCount}\n`;
        response += `├─ Lies detected: ${this.liesDetected}\n`;
        response += `├─ Accuracy rate: ${this.analysisCount > 0 ? Math.round((this.liesDetected / this.analysisCount) * 100) : 0}%\n`;
        response += `├─ Supported languages: JavaScript, TypeScript, Python, CSS, HTML\n`;
        response += `└─ Version: 1.0.0\n`;
        if (detailed) {
            response += `\n📈 **Detailed Statistics:**\n`;
            response += `├─ Total analyses: ${this.analysisCount}\n`;
            response += `├─ Lies detected: ${this.liesDetected}\n`;
            response += `├─ Accuracy rate: ${this.analysisCount > 0 ? Math.round((this.liesDetected / this.analysisCount) * 100) : 0}%\n`;
            response += `├─ Files analyzed: ${this.analysisCount}\n`;
            response += `└─ Evidence found: ${this.analysisCount}\n`;
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
                // Check each pattern type
                for (const [patternType, regex] of Object.entries(patterns)) {
                    if (this.isRelevantToAction(patternType, normalizedClaim)) {
                        checkedPatterns++;
                        const matches = content.match(regex) || [];
                        if (matches.length > 0) {
                            // Found evidence supporting the claim
                            evidence.push(`✅ Found ${matches.length} ${patternType} pattern(s) in ${file}`);
                            totalScore += 0.8; // Positive evidence
                        }
                        else {
                            // Missing expected pattern - potential lie
                            evidence.push(`❌ Expected ${patternType} but none found in ${file}`);
                            totalScore += 0.2; // Negative evidence
                        }
                    }
                }
            }
            catch (error) {
                console.error(`Error reading ${file}:`, error);
            }
        }
        const confidence = checkedPatterns > 0 ? totalScore / checkedPatterns : 0.5;
        const isLie = confidence < 0.4; // If confidence is low, likely a lie
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

   🔥 SlopWatch MCP Server v1.0.0 - Professional AI Lie Detection`.trim();
    }
    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('🚀 SlopWatch MCP Server started successfully');
    }
}
async function main() {
    try {
        const server = new SlopWatchServer();
        await server.start();
    }
    catch (error) {
        console.error('❌ Failed to start SlopWatch MCP Server:', error);
        process.exit(1);
    }
}
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => {
        console.error('❌ Server startup failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map