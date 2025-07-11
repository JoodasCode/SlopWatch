#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { createFileWatcher } from './watchers/file-watcher.js';
import { ClaimCapture } from './capture/claim-capture.js';
import { LiveAnalysisEngine } from './analysis/live-analysis.js';
import chalk from 'chalk';
class SlopWatchMCPServer {
    server;
    fileWatcher;
    claimCapture;
    analysisEngine;
    projectPath;
    isActive = false;
    constructor() {
        this.server = new Server({
            name: 'slopwatch',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.projectPath = process.cwd();
        this.claimCapture = new ClaimCapture();
        this.analysisEngine = new LiveAnalysisEngine();
        this.setupErrorHandling();
        this.setupHandlers();
    }
    setupErrorHandling() {
        this.server.onerror = (error) => {
            console.error(chalk.red('[SlopWatch MCP] Error:'), error);
        };
        process.on('SIGINT', async () => {
            await this.shutdown();
            process.exit(0);
        });
    }
    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'slopwatch_monitor',
                        description: 'Monitor AI claims vs actual code changes for lie detection',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                claim: {
                                    type: 'string',
                                    description: 'AI claim to monitor'
                                },
                                action: {
                                    type: 'string',
                                    enum: ['start', 'stop', 'status', 'analyze'],
                                    description: 'Action to perform'
                                }
                            },
                            required: ['action']
                        }
                    },
                    {
                        name: 'slopwatch_analyze_conversation',
                        description: 'Analyze AI conversation for potential lies',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                conversation: {
                                    type: 'string',
                                    description: 'AI conversation text to analyze'
                                },
                                fileChanges: {
                                    type: 'array',
                                    description: 'Recent file changes',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            file: { type: 'string' },
                                            changes: { type: 'string' }
                                        }
                                    }
                                }
                            },
                            required: ['conversation']
                        }
                    }
                ],
            };
        });
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                switch (name) {
                    case 'slopwatch_monitor':
                        return await this.handleMonitorTool(args);
                    case 'slopwatch_analyze_conversation':
                        return await this.handleAnalyzeConversation(args);
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
                return {
                    content: [{
                            type: 'text',
                            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }]
                };
            }
        });
    }
    async handleMonitorTool(args) {
        switch (args.action) {
            case 'start':
                return await this.startMonitoring();
            case 'stop':
                return await this.stopMonitoring();
            case 'status':
                return await this.getStatus();
            case 'analyze':
                if (args.claim) {
                    return await this.analyzeClaim(args.claim);
                }
                return {
                    content: [{
                            type: 'text',
                            text: 'Claim required for analysis'
                        }]
                };
            default:
                return {
                    content: [{
                            type: 'text',
                            text: 'Invalid action. Use: start, stop, status, or analyze'
                        }]
                };
        }
    }
    async startMonitoring() {
        if (this.isActive) {
            return {
                content: [{
                        type: 'text',
                        text: chalk.yellow('⚠️  SlopWatch already active')
                    }]
            };
        }
        try {
            // Initialize file watcher
            this.fileWatcher = createFileWatcher(this.projectPath);
            // Start monitoring
            this.isActive = true;
            // Start analysis engine
            await this.analysisEngine.start(this.projectPath);
            const banner = `
   ███████╗██╗      ██████╗ ██████╗ ██╗    ██╗ █████╗ ████████╗ ██████╗██╗  ██╗
   ██╔════╝██║     ██╔═══██╗██╔══██╗██║    ██║██╔══██╗╚══██╔══╝██╔════╝██║  ██║
   ███████╗██║     ██║   ██║██████╔╝██║ █╗ ██║███████║   ██║   ██║     ███████║
   ╚════██║██║     ██║   ██║██╔═══╝ ██║███╗██║██╔══██║   ██║   ██║     ██╔══██║
   ███████║███████╗╚██████╔╝██║     ╚███╔███╔╝██║  ██║   ██║   ╚██████╗██║  ██║
   ╚══════╝╚══════╝ ╚═════╝ ╚═╝      ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝    ╚═════╝╚═╝  ╚═╝

🔥 SlopWatch MCP Active - AI Lie Detection
📁 Monitoring: ${this.projectPath}
⚡ Watching for suspicious patterns...
📊 Dashboard: http://localhost:3001
      `;
            console.log(chalk.cyan(banner));
            return {
                content: [{
                        type: 'text',
                        text: `✅ SlopWatch monitoring started\n📁 Project: ${this.projectPath}\n📊 Dashboard: http://localhost:3001\n\n🕵️ Now watching for AI lies...`
                    }]
            };
        }
        catch (error) {
            this.isActive = false;
            return {
                content: [{
                        type: 'text',
                        text: `❌ Failed to start monitoring: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }]
            };
        }
    }
    async stopMonitoring() {
        if (!this.isActive) {
            return {
                content: [{
                        type: 'text',
                        text: '⚠️  SlopWatch not active'
                    }]
            };
        }
        this.isActive = false;
        if (this.fileWatcher) {
            this.fileWatcher.close();
        }
        await this.analysisEngine.stop();
        return {
            content: [{
                    type: 'text',
                    text: '✅ SlopWatch monitoring stopped'
                }]
        };
    }
    async getStatus() {
        const stats = await this.analysisEngine.getStats();
        return {
            content: [{
                    type: 'text',
                    text: `📊 SlopWatch Status:
        
🔥 Active: ${this.isActive ? 'Yes' : 'No'}
📁 Project: ${this.projectPath}
📈 Claims analyzed: ${stats.totalClaims}
🚨 Lies detected: ${stats.liesDetected}
📊 Slop Score: ${stats.slopScore}%
🎯 Accuracy: ${stats.accuracy}%

${this.isActive ? '🕵️ Currently monitoring for AI lies...' : '💤 Not monitoring'}
        `
                }]
        };
    }
    async analyzeClaim(claim) {
        console.log(chalk.blue('🔍 [SlopWatch] Analyzing claim:'), claim);
        const analysis = await this.claimCapture.extractClaims(claim);
        return {
            content: [{
                    type: 'text',
                    text: `🔍 Claim Analysis:
        
📝 Extracted: ${analysis.length} claims
${analysis.map(c => `• ${c.text} (${c.type}: ${c.action})`).join('\n')}

⏳ Monitoring file changes for verification...
        `
                }]
        };
    }
    async handleAnalyzeConversation(args) {
        console.log(chalk.blue('🔍 [SlopWatch] Analyzing AI conversation...'));
        try {
            // Extract claims from conversation
            const claims = await this.claimCapture.extractClaims(args.conversation);
            if (claims.length === 0) {
                return {
                    content: [{
                            type: 'text',
                            text: '📝 No specific claims detected in conversation'
                        }]
                };
            }
            // Analyze against file changes if provided
            let lieDetection = '';
            if (args.fileChanges && args.fileChanges.length > 0) {
                for (const claim of claims) {
                    const isLie = await this.analysisEngine.analyzeClaimAgainstChanges(claim, args.fileChanges);
                    if (isLie) {
                        lieDetection += `🚨 LIE DETECTED: "${claim.text}"\n`;
                        console.log(chalk.red('🚨 [SlopWatch] LIE DETECTED:'), claim.text);
                    }
                }
            }
            const result = `🔍 AI Conversation Analysis:

📝 Claims detected: ${claims.length}
${claims.map(c => `• ${c.text} (${c.type}: ${c.action}) - ${Math.round(c.confidence * 100)}% confidence`).join('\n')}

${lieDetection || '✅ No lies detected yet - monitoring file changes...'}

📊 Dashboard: http://localhost:3001
      `;
            return {
                content: [{
                        type: 'text',
                        text: result
                    }]
            };
        }
        catch (error) {
            return {
                content: [{
                        type: 'text',
                        text: `❌ Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }]
            };
        }
    }
    async shutdown() {
        if (this.isActive) {
            await this.stopMonitoring();
        }
    }
    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        // Auto-start monitoring when MCP server starts
        setTimeout(async () => {
            if (!this.isActive) {
                await this.startMonitoring();
            }
        }, 1000);
    }
}
// Run the server
const server = new SlopWatchMCPServer();
server.run().catch(console.error);
//# sourceMappingURL=mcp-integration.js.map