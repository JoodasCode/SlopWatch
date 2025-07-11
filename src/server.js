#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { createServer } from 'http';

class SlopWatchMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'slopwatch-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'analyze_claim',
          description: 'Analyze an AI claim against actual code to detect lies',
          inputSchema: {
            type: 'object',
            properties: {
              claim: {
                type: 'string',
                description: 'The AI claim to analyze',
              },
              workspaceDir: {
                type: 'string',
                description: 'Directory to analyze (optional)',
              },
              fileTypes: {
                type: 'array',
                items: { type: 'string' },
                description: 'File extensions to analyze (optional)',
              },
              maxFiles: {
                type: 'number',
                description: 'Maximum files to analyze (default: 100)',
              },
            },
            required: ['claim'],
          },
        },
        {
          name: 'get_status',
          description: 'Get SlopWatch server status and statistics',
          inputSchema: {
            type: 'object',
            properties: {
              detailed: {
                type: 'boolean',
                description: 'Show detailed statistics',
              },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'analyze_claim':
          return this.analyzeClaim(request.params.arguments);
        case 'get_status':
          return this.getStatus(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async analyzeClaim(args) {
    const { claim, workspaceDir = process.cwd(), fileTypes = ['.js', '.ts', '.jsx', '.tsx', '.css', '.py'], maxFiles = 100 } = args;

    try {
      const analysisResult = await this.performLieDetection(claim, workspaceDir, fileTypes, maxFiles);
      
      return {
        content: [
          {
            type: 'text',
            text: this.formatAnalysisResult(analysisResult),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Analysis failed: ${error.message}`,
          },
        ],
      };
    }
  }

  async performLieDetection(claim, workspaceDir, fileTypes, maxFiles) {
    const files = await this.scanFiles(workspaceDir, fileTypes, maxFiles);
    const patterns = this.getDetectionPatterns(claim);
    
    let supportingEvidence = [];
    let contradictingEvidence = [];
    let filesAnalyzed = 0;

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const evidence = this.analyzeFileContent(content, patterns, file);
        
        if (evidence.supporting.length > 0) {
          supportingEvidence.push(...evidence.supporting);
        }
        if (evidence.contradicting.length > 0) {
          contradictingEvidence.push(...evidence.contradicting);
        }
        
        filesAnalyzed++;
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    const confidence = this.calculateConfidence(supportingEvidence, contradictingEvidence);
    const isLie = confidence < 50;

    return {
      isLie,
      confidence,
      supportingEvidence,
      contradictingEvidence,
      filesAnalyzed,
      claim,
    };
  }

  getDetectionPatterns(claim) {
    const lowerClaim = claim.toLowerCase();
    const patterns = [];

    // Error handling patterns
    if (lowerClaim.includes('error') && (lowerClaim.includes('handling') || lowerClaim.includes('catch'))) {
      patterns.push({
        type: 'error_handling',
        positive: [/try\s*\{[\s\S]*?\}\s*catch/gi, /\.catch\s*\(/gi, /throw\s+new\s+\w*Error/gi],
        negative: [/console\.log\(/gi]
      });
    }

    // Async/await patterns
    if (lowerClaim.includes('async') || lowerClaim.includes('await')) {
      patterns.push({
        type: 'async_await',
        positive: [/async\s+function/gi, /await\s+/gi, /\.then\s*\(/gi],
        negative: []
      });
    }

    // Validation patterns
    if (lowerClaim.includes('validat')) {
      patterns.push({
        type: 'validation',
        positive: [/if\s*\([^)]*\?\s*[^:]*:/gi, /\.test\s*\(/gi, /instanceof/gi],
        negative: []
      });
    }

    // CSS responsive patterns
    if (lowerClaim.includes('responsive') || lowerClaim.includes('media query')) {
      patterns.push({
        type: 'responsive',
        positive: [/@media\s*\(/gi, /flexbox/gi, /grid/gi],
        negative: []
      });
    }

    // React patterns
    if (lowerClaim.includes('react') || lowerClaim.includes('component')) {
      patterns.push({
        type: 'react',
        positive: [/useState/gi, /useEffect/gi, /import.*react/gi],
        negative: []
      });
    }

    return patterns;
  }

  analyzeFileContent(content, patterns, filePath) {
    const supporting = [];
    const contradicting = [];

    for (const pattern of patterns) {
      let foundPositive = false;
      
      for (const regex of pattern.positive) {
        const matches = content.match(regex);
        if (matches) {
          foundPositive = true;
          supporting.push(`✅ Found ${pattern.type} evidence in ${filePath}: ${matches.length} instances`);
        }
      }

      if (!foundPositive) {
        contradicting.push(`❌ Expected ${pattern.type} but none found in ${filePath}`);
      }

      for (const regex of pattern.negative) {
        const matches = content.match(regex);
        if (matches) {
          contradicting.push(`⚠️ Found questionable ${pattern.type} patterns in ${filePath}`);
        }
      }
    }

    return { supporting, contradicting };
  }

  calculateConfidence(supporting, contradicting) {
    const supportCount = supporting.length;
    const contradictCount = contradicting.length;
    const total = supportCount + contradictCount;
    
    if (total === 0) return 50; // Neutral when no evidence
    
    return Math.round((supportCount / total) * 100);
  }

  formatAnalysisResult(result) {
    const { isLie, confidence, supportingEvidence, contradictingEvidence, filesAnalyzed, claim } = result;
    
    let output = `\n🔍 SlopWatch Analysis Results\n`;
    output += `═══════════════════════════════\n\n`;
    
    if (isLie) {
      output += `🚨 LIE DETECTED: Found ${contradictingEvidence.length} contradicting and ${supportingEvidence.length} supporting evidence.\n`;
      output += `The code does not support the AI's claim.\n\n`;
    } else {
      output += `✅ CLAIM VERIFIED: Found ${supportingEvidence.length} pieces of supporting evidence for '${claim}'. Confidence: ${confidence}%\n\n`;
    }
    
    output += `📊 Analysis Details:\n`;
    output += `├─ Files analyzed: ${filesAnalyzed}\n`;
    output += `├─ Confidence score: ${confidence}%\n`;
    output += `└─ Evidence found: ${supportingEvidence.length + contradictingEvidence.length} items\n\n`;
    
    if (contradictingEvidence.length > 0) {
      output += `🔍 Evidence:\n`;
      contradictingEvidence.slice(0, 5).forEach((evidence, i) => {
        output += `   ${i + 1}. ${evidence}\n`;
      });
      if (contradictingEvidence.length > 5) {
        output += `   ... and ${contradictingEvidence.length - 5} more\n`;
      }
    }
    
    if (supportingEvidence.length > 0 && !isLie) {
      output += `\n✅ Supporting Evidence:\n`;
      supportingEvidence.slice(0, 3).forEach((evidence, i) => {
        output += `   ${i + 1}. ${evidence}\n`;
      });
    }
    
    return output;
  }

  async scanFiles(directory, fileTypes, maxFiles) {
    const files = [];
    
    async function scanDir(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (files.length >= maxFiles) break;
          
          const fullPath = join(dir, entry.name);
          
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await scanDir(fullPath);
          } else if (entry.isFile() && fileTypes.includes(extname(entry.name))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }
    
    await scanDir(directory);
    return files;
  }

  async getStatus(args) {
    const { detailed = false } = args || {};
    
    const status = {
      name: 'SlopWatch MCP Server',
      version: '1.0.0',
      status: 'operational',
      capabilities: ['analyze_claim', 'get_status'],
      uptime: process.uptime(),
    };
    
    if (detailed) {
      status.memory = process.memoryUsage();
      status.platform = process.platform;
      status.nodeVersion = process.version;
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `🔥 SlopWatch MCP Server Status\n\n${JSON.stringify(status, null, 2)}`,
        },
      ],
    };
  }

  async scanFiles(directory, fileTypes, maxFiles) {
    const files = [];
    
    async function scanDir(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (files.length >= maxFiles) break;
          
          const fullPath = join(dir, entry.name);
          
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await scanDir(fullPath);
          } else if (entry.isFile() && fileTypes.includes(extname(entry.name))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    }
    
    await scanDir(directory);
    return files;
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const args = process.argv.slice(2);
    
    if (args.includes('--test')) {
      console.log('🧪 SlopWatch Test Mode');
      const testResult = await this.performLieDetection(
        'I added comprehensive error handling',
        process.cwd(),
        ['.js', '.ts'],
        10
      );
      console.log(this.formatAnalysisResult(testResult));
      return;
    }

    if (args.includes('--http')) {
      this.startHttpServer();
      return;
    }

    // Default: STDIO mode for MCP
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('SlopWatch MCP Server running on stdio');
  }

  startHttpServer() {
    const PORT = process.env.PORT || 3001;
    
    const server = createServer((req, res) => {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });

      if (req.method === 'GET' && req.url === '/') {
        res.end(JSON.stringify({
          name: 'SlopWatch MCP Server',
          version: '1.0.0',
          status: 'operational',
          endpoints: ['/health', '/analyze'],
        }));
      } else if (req.method === 'GET' && req.url === '/health') {
        res.end(JSON.stringify({ status: 'healthy', uptime: process.uptime() }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    server.listen(PORT, () => {
      console.log(`🔥 SlopWatch HTTP Server running on port ${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
    });
  }
}

// Run the server
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new SlopWatchMCPServer();
  server.run().catch(console.error);
}

export default SlopWatchMCPServer; 