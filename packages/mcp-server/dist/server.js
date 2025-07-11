#!/usr/bin/env node
/**
 * 🔥 SlopWatch MCP Server - Professional AI Lie Detection
 * Stop the slop. Start the accountability.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { createServer } from 'http';
import { parse } from 'url';

// Core lie detection patterns
const LIE_PATTERNS = {
  error_handling: {
    keywords: ['error handling', 'try catch', 'exception', 'error management'],
    pattern: /try\s*{|catch\s*\(|\.catch\s*\(|throw\s+new|Promise\.catch|\.handleError/,
    description: 'Error handling (try/catch, Promise.catch, throw)'
  },
  async_await: {
    keywords: ['async', 'await', 'promise', 'asynchronous'],
    pattern: /async\s+function|await\s+|Promise\s*\.|\.then\s*\(|\.catch\s*\(/,
    description: 'Async/await functionality'
  },
  typescript_types: {
    keywords: ['typescript', 'types', 'interface', 'type definition'],
    pattern: /interface\s+\w+|type\s+\w+\s*=|:\s*\w+\[\]|:\s*(string|number|boolean)\b/,
    description: 'TypeScript type definitions'
  },
  validation: {
    keywords: ['validation', 'validate', 'check', 'verify'],
    pattern: /if\s*\(.*\.length|if\s*\(!.*\)|validate\w*\(|check\w*\(|\.test\s*\(|\.match\s*\(/,
    description: 'Input validation and checks'
  },
  responsive_design: {
    keywords: ['responsive', 'media query', 'mobile', 'breakpoint'],
    pattern: /@media\s*\(|min-width|max-width|flex|grid|display:\s*flex|display:\s*grid/,
    description: 'Responsive design (media queries, flexbox, grid)'
  },
  dark_mode: {
    keywords: ['dark mode', 'theme', 'color scheme'],
    pattern: /prefers-color-scheme|data-theme|\.dark|--.*-dark|var\(--.*-dark\)/,
    description: 'Dark mode implementation'
  },
  react_hooks: {
    keywords: ['react', 'hook', 'usestate', 'useeffect'],
    pattern: /useState|useEffect|useContext|useReducer|useMemo|useCallback|use[A-Z]\w+/,
    description: 'React hooks'
  },
  testing: {
    keywords: ['test', 'unit test', 'testing', 'spec'],
    pattern: /describe\s*\(|it\s*\(|test\s*\(|expect\s*\(|jest\.|vitest\.|mocha\./,
    description: 'Unit tests'
  }
};

class SlopDetector {
  constructor(workspaceDir = process.cwd()) {
    this.workspaceDir = workspaceDir;
  }

  async analyzeClaim(claim, options = {}) {
    const maxFiles = options.maxFiles || 100;
    const fileTypes = options.fileTypes || ['.js', '.ts', '.tsx', '.jsx', '.css', '.py', '.html'];
    
    // Find what patterns we should look for based on the claim
    const expectedPatterns = this.parseClaimPatterns(claim);
    
    if (expectedPatterns.length === 0) {
      return {
        isLie: false,
        confidence: 0.1,
        evidence: ['⚠️ Cannot determine what to verify from this claim'],
        analysis: 'The claim is too vague or does not contain verifiable technical assertions.',
        filesAnalyzed: 0
      };
    }

    // Scan files for evidence
    const files = this.getRelevantFiles(fileTypes, maxFiles);
    const evidence = [];
    let matchCount = 0;
    
    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf8');
        
        for (const pattern of expectedPatterns) {
          if (content.match(pattern.pattern)) {
            matchCount++;
            evidence.push(`✅ Found ${pattern.description} in ${file.replace(this.workspaceDir, '.')}`);
          }
        }
      } catch (error) {
        // Skip unreadable files
        continue;
      }
    }

    // Calculate lie probability
    const expectedFinds = expectedPatterns.length;
    const actualFinds = matchCount;
    const confidence = actualFinds === 0 ? 0.95 : Math.max(0.1, 1 - (actualFinds / expectedFinds));
    const isLie = actualFinds === 0;

    if (isLie) {
      evidence.unshift(`🚨 Expected ${expectedPatterns.map(p => p.description).join(', ')} but found NONE`);
    }

    return {
      isLie,
      confidence,
      evidence,
      analysis: this.generateAnalysis(claim, isLie, confidence, actualFinds, expectedFinds),
      filesAnalyzed: files.length
    };
  }

  parseClaimPatterns(claim) {
    const patterns = [];
    const lowerClaim = claim.toLowerCase();

    for (const [key, config] of Object.entries(LIE_PATTERNS)) {
      if (config.keywords.some(keyword => lowerClaim.includes(keyword))) {
        patterns.push(config);
      }
    }

    return patterns;
  }

  getRelevantFiles(fileTypes, maxFiles) {
    const files = [];
    
    const scanDir = (dir, depth = 0) => {
      if (depth > 3 || files.length >= maxFiles) return;
      
      try {
        const items = readdirSync(dir);
        
        for (const item of items) {
          if (files.length >= maxFiles) break;
          
          const fullPath = join(dir, item);
          const stat = statSync(fullPath);
          
          if (stat.isDirectory()) {
            // Skip common non-source directories
            if (!item.startsWith('.') && !['node_modules', 'dist', 'build', '.git'].includes(item)) {
              scanDir(fullPath, depth + 1);
            }
          } else if (stat.isFile()) {
            const ext = extname(item);
            if (fileTypes.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }
    };

    scanDir(this.workspaceDir);
    return files;
  }

  generateAnalysis(claim, isLie, confidence, found, expected) {
    if (isLie) {
      return `🚨 LIE DETECTED: "${claim}" is NOT supported by the code. Expected evidence but found NONE. Confidence: ${Math.round(confidence * 100)}%`;
    } else {
      return `✅ CLAIM VERIFIED: Found ${found} pieces of supporting evidence for "${claim}". Confidence: ${Math.round((1 - confidence) * 100)}%`;
    }
  }
}

// Initialize MCP Server
const server = new Server({
  name: 'slopwatch-mcp-server',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {},
  },
});

// Tool discovery
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'analyze_claim',
        description: '🔥 Analyze an AI claim against actual code to detect lies',
        inputSchema: {
          type: 'object',
          properties: {
            claim: {
              type: 'string',
              description: 'The AI claim to analyze (e.g., "I added error handling")'
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
        description: '📊 Get SlopWatch server status and capabilities',
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

// Tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'analyze_claim': {
      const detector = new SlopDetector(args?.workspaceDir);
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
      const patterns = Object.values(LIE_PATTERNS).map(p => p.description);
      const status = {
        name: '🔥 SlopWatch MCP Server',
        version: '1.0.0',
        status: 'active',
        capabilities: [
          'AI lie detection',
          'Multi-language analysis', 
          'Pattern matching',
          'Real-time verification'
        ],
        supportedLanguages: ['JavaScript', 'TypeScript', 'CSS', 'Python', 'HTML', 'React'],
        detectionTypes: patterns
      };

      return {
        content: [
          {
            type: 'text',
            text: args?.detailed 
              ? JSON.stringify(status, null, 2)
              : `🔥 SlopWatch MCP Server v${status.version} - Status: ${status.status}

🎯 Supported Languages: ${status.supportedLanguages.join(', ')}
🔍 Detection Types: ${patterns.length} patterns active

Stop the slop. Start the accountability.`
          }
        ]
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// HTTP Server for hosting
function createHttpServer() {
  return createServer(async (req, res) => {
    const { pathname } = parse(req.url || '', true);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (pathname === '/mcp' || pathname === '/') {
      if (req.method === 'GET') {
        // Tool discovery
        const tools = [
          {
            name: 'analyze_claim',
            description: '🔥 Analyze an AI claim against actual code to detect lies',
            inputSchema: {
              type: 'object',
              properties: {
                claim: { type: 'string', description: 'The AI claim to analyze' },
                workspaceDir: { type: 'string', description: 'Directory to analyze (optional)' }
              },
              required: ['claim']
            }
          },
          {
            name: 'get_status',
            description: '📊 Get SlopWatch status and capabilities',
            inputSchema: { type: 'object', properties: {} }
          }
        ];
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ tools, server: 'SlopWatch MCP v1.0.0' }));
        
      } else if (req.method === 'POST') {
        // Tool execution
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const message = JSON.parse(body);
            
            if (message.method === 'tools/call') {
              const { name, arguments: args } = message.params;
              
              if (name === 'analyze_claim') {
                const detector = new SlopDetector(args?.workspaceDir);
                const result = await detector.analyzeClaim(args?.claim || '', {
                  maxFiles: args?.maxFiles,
                  fileTypes: args?.fileTypes
                });
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  content: [{
                    type: 'text',
                    text: `${result.analysis}\n\n📊 Files: ${result.filesAnalyzed} | Confidence: ${Math.round(result.confidence * 100)}% | Evidence: ${result.evidence.length}\n\n🔍 Evidence:\n${result.evidence.map((e, i) => `${i + 1}. ${e}`).join('\n')}`
                  }]
                }));
                
              } else if (name === 'get_status') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  content: [{
                    type: 'text',
                    text: '🔥 SlopWatch MCP Server v1.0.0 - Status: ACTIVE\n\n🎯 Supported: JavaScript, TypeScript, CSS, Python, HTML, React\n🔍 Detection: 8 pattern types\n\nStop the slop. Start the accountability.'
                  }]
                }));
                
              } else {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: `Unknown tool: ${name}` }));
              }
            } else {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Unsupported method' }));
            }
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid request: ' + error.message }));
          }
        });
      }
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
<!DOCTYPE html>
<html>
<head><title>🔥 SlopWatch MCP Server</title></head>
<body style="font-family: monospace; padding: 2rem; background: #1a1a1a; color: #00ff00;">
  <h1>🔥 SlopWatch MCP Server</h1>
  <p><strong>Status:</strong> Active</p>
  <p><strong>Endpoint:</strong> <a href="/mcp" style="color: #00ff00;">/mcp</a></p>
  <p><strong>Purpose:</strong> AI lie detection for coding environments</p>
  <p><strong>Motto:</strong> Stop the slop. Start the accountability.</p>
</body>
</html>
      `);
    }
  });
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    // Test mode
    console.log('🔥 SlopWatch Test Mode');
    const detector = new SlopDetector();
    const result = await detector.analyzeClaim('I added comprehensive error handling');
    console.log(result.analysis);
    console.log(`📊 Files: ${result.filesAnalyzed} | Evidence: ${result.evidence.length}`);
    return;
  }
  
  if (args.includes('--http')) {
    // HTTP mode for hosting
    const port = parseInt(process.env.PORT || '3000');
    const httpServer = createHttpServer();
    
    httpServer.listen(port, () => {
      console.log(`🔥 SlopWatch MCP Server running on port ${port}`);
      console.log(`📊 Health: http://localhost:${port}/mcp`);
      console.log(`🎯 Ready to detect AI lies!`);
    });
  } else {
    // STDIO mode for MCP clients
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}

// Handle crashes gracefully
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('🚨 Unhandled Rejection:', reason);
  process.exit(1);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
} 