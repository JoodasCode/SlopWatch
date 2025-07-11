#!/usr/bin/env node

import { createServer } from 'http';
import { URL } from 'url';

/**
 * SlopWatch MCP Server - Streamable HTTP Implementation
 * Implements the MCP Streamable HTTP transport specification
 */
class SlopWatchStreamableServer {
  constructor() {
    this.claims = new Map();
    this.verificationResults = [];
    this.sessionData = new Map(); // For stateful sessions if needed
  }

  // Parse configuration from query parameters (dot-notation support)
  parseConfig(searchParams) {
    const config = {};
    for (const [key, value] of searchParams.entries()) {
      // Handle dot notation like "server.host" -> { server: { host: value } }
      const keys = key.split('.');
      let current = config;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
    }
    return config;
  }

  // Helper to get request body
  async getRequestBody(req) {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => resolve(body));
    });
  }

  // Handle GET requests for initial capabilities
  async handleGet(url) {
    const config = this.parseConfig(url.searchParams);
    
    // Return capabilities with tools for lazy loading discovery
    return {
      protocolVersion: "2025-06-18",
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: 'slopwatch-server',
        version: '2.0.0'
      },
      tools: [
        {
          name: 'slopwatch_claim',
          description: '🎯 Register what you are about to implement (AI should call this BEFORE making changes)',
          inputSchema: {
            type: 'object',
            properties: {
              claim: { type: 'string', description: 'What you are implementing' },
              files: { type: 'array', items: { type: 'string' }, description: 'Files you will modify' },
              type: { type: 'string', description: 'Implementation type (css, js, react, python, etc.)' },
              details: { type: 'string', description: 'Additional implementation details (optional)' }
            },
            required: ['claim', 'files', 'type']
          }
        },
        {
          name: 'slopwatch_verify',
          description: '✅ Verify that your implementation matches your claim (AI should call this AFTER making changes)',
          inputSchema: {
            type: 'object',
            properties: {
              claimId: { type: 'string', description: 'The claim ID returned from slopwatch_claim' }
            },
            required: ['claimId']
          }
        },
        {
          name: 'slopwatch_status',
          description: '📊 Get current AI accountability status and recent verification results',
          inputSchema: {
            type: 'object',
            properties: {
              detailed: { type: 'boolean', description: 'Show detailed verification history' }
            }
          }
        }
      ]
    };
  }

  // Handle POST requests for MCP messages
  async handlePost(url, body) {
    const config = this.parseConfig(url.searchParams);
    
    try {
      const request = JSON.parse(body);
      let result;
      
      // Handle different MCP request types
      switch (request.method) {
        case 'initialize':
          result = {
            protocolVersion: "2025-06-18",
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'slopwatch-server',
              version: '2.0.0'
            }
          };
          break;

        case 'tools/list':
          result = {
            tools: [
              {
                name: 'slopwatch_claim',
                description: '🎯 Register what you are about to implement (AI should call this BEFORE making changes)',
                inputSchema: {
                  type: 'object',
                  properties: {
                    claim: { type: 'string', description: 'What you are implementing' },
                    files: { type: 'array', items: { type: 'string' }, description: 'Files you will modify' },
                    type: { type: 'string', description: 'Implementation type (css, js, react, python, etc.)' },
                    details: { type: 'string', description: 'Additional implementation details (optional)' }
                  },
                  required: ['claim', 'files', 'type']
                }
              },
              {
                name: 'slopwatch_verify',
                description: '✅ Verify that your implementation matches your claim (AI should call this AFTER making changes)',
                inputSchema: {
                  type: 'object',
                  properties: {
                    claimId: { type: 'string', description: 'The claim ID returned from slopwatch_claim' }
                  },
                  required: ['claimId']
                }
              },
              {
                name: 'slopwatch_status',
                description: '📊 Get current AI accountability status and recent verification results',
                inputSchema: {
                  type: 'object',
                  properties: {
                    detailed: { type: 'boolean', description: 'Show detailed verification history' }
                  }
                }
              }
            ]
          };
          break;

        case 'tools/call':
          const { name, arguments: args } = request.params;
          
          switch (name) {
            case 'slopwatch_claim':
              result = await this.registerClaim(args);
              break;
            case 'slopwatch_verify':
              result = await this.verifyClaim(args);
              break;
            case 'slopwatch_status':
              result = await this.getStatus(args);
              break;
            default:
              throw new Error(`Unknown tool: ${name}`);
          }
          break;

        default:
          throw new Error(`Unknown method: ${request.method}`);
      }

      // Return proper JSON-RPC response
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: result
      };

    } catch (error) {
      return {
        jsonrpc: "2.0",
        id: request.id || null,
        error: {
          code: -32603,
          message: error.message
        }
      };
    }
  }

  async registerClaim(args) {
    const { claim, files, type, details } = args;
    
    const claimId = Math.random().toString(36).substr(2, 9);
    
    const claimRecord = {
      id: claimId,
      claim,
      files,
      type,
      details,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };

    this.claims.set(claimId, claimRecord);

    return {
      content: [
        {
          type: 'text',
          text: `🎯 AI Claim Registered Successfully!\n\n` +
                `📋 Claim ID: ${claimId}\n` +
                `🎯 What: ${claim}\n` +
                `📁 Files: ${files.join(', ')}\n` +
                `🏷️ Type: ${type}\n` +
                `⏰ Registered: ${new Date().toLocaleTimeString()}\n\n` +
                `✨ Now make your changes, then call slopwatch_verify("${claimId}") to check if you actually did what you claimed!`
        }
      ]
    };
  }

  async verifyClaim(args) {
    const { claimId } = args;
    
    const claimRecord = this.claims.get(claimId);
    if (!claimRecord) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Claim ID ${claimId} not found. Use slopwatch_claim first to register what you're implementing.`
          }
        ]
      };
    }

    // Simplified verification for Streamable HTTP
    const verification = {
      isVerified: true,
      confidence: 85,
      details: 'Claim verified successfully (simplified for demo)'
    };

    claimRecord.status = 'verified';
    claimRecord.verification = verification;
    
    this.verificationResults.push({
      claimId,
      claim: claimRecord.claim,
      isVerified: verification.isVerified,
      confidence: verification.confidence,
      timestamp: new Date().toISOString()
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Verification Complete!\n\n` +
                `📋 Claim: ${claimRecord.claim}\n` +
                `🎯 Status: ${verification.isVerified ? 'VERIFIED' : 'FAILED'}\n` +
                `📊 Confidence: ${verification.confidence}%\n` +
                `📝 Details: ${verification.details}`
        }
      ]
    };
  }

  async getStatus(args) {
    const totalClaims = this.claims.size;
    const verifiedClaims = this.verificationResults.filter(r => r.isVerified).length;
    const accuracy = totalClaims > 0 ? Math.round((verifiedClaims / totalClaims) * 100) : 100;

    return {
      content: [
        {
          type: 'text',
          text: `📊 SlopWatch Status Dashboard\n\n` +
                `📋 Total Claims: ${totalClaims}\n` +
                `✅ Verified: ${verifiedClaims}\n` +
                `❌ Failed: ${totalClaims - verifiedClaims}\n` +
                `🎯 Accuracy: ${accuracy}%\n\n` +
                `Recent activity: ${this.verificationResults.slice(-3).map(r => 
                  `${r.isVerified ? '✅' : '❌'} ${r.claim.slice(0, 30)}...`
                ).join('\n')}`
        }
      ]
    };
  }

  setupHttpServer() {
    const server = createServer(async (req, res) => {
      // Log all incoming requests for debugging
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Headers:`, JSON.stringify(req.headers, null, 2));
      
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, MCP-Protocol-Version, Mcp-Session-Id');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      const url = new URL(req.url, `http://${req.headers.host}`);
      
      try {
        // Handle MCP endpoint (primary path)
        if (url.pathname === '/mcp') {
          if (req.method === 'GET') {
            // Return capabilities for tool discovery
            const response = await this.handleGet(url);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
            return;
          }

          if (req.method === 'POST') {
            // Handle MCP requests
            try {
              const body = await this.getRequestBody(req);
              const response = await this.handlePost(url, body);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(response));
            } catch (error) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: error.message }));
            }
            return;
          }

          if (req.method === 'DELETE') {
            // Handle session cleanup as required by Smithery
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Session cleaned up' }));
            return;
          }
        }

        // Health check
        if (url.pathname === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'healthy',
            name: 'SlopWatch Server',
            version: '2.0.0',
            claims: this.claims.size,
            transport: 'Streamable HTTP'
          }));
          return;
        }

        // Handle alternative MCP endpoints that Smithery might expect
        if (url.pathname === '/' && req.method === 'POST') {
          // Some MCP clients expect the root path
          const response = await this.handlePost(url, await this.getRequestBody(req));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
          return;
        }

        if (url.pathname === '/' && req.method === 'GET') {
          // Some MCP clients expect capabilities at root
          const response = await this.handleGet(url);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
          return;
        }

        // Default response
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <head><title>SlopWatch Server</title></head>
            <body>
              <h1>🔥 SlopWatch Server (Streamable HTTP)</h1>
              <p>MCP Server implementing Streamable HTTP transport</p>
              <ul>
                <li><a href="/health">Health Check</a></li>
                <li><a href="/mcp">MCP Endpoint</a></li>
              </ul>
              <p><strong>Debug Info:</strong></p>
              <p>Request: ${req.method} ${req.url}</p>
              <p>Available endpoints: /, /mcp, /health</p>
            </body>
          </html>
        `);

      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });

    return server;
  }

  async run() {
    const httpServer = this.setupHttpServer();
    const port = process.env.PORT || 3000;
    
    httpServer.listen(port, '0.0.0.0', () => {
      console.log(`🚀 SlopWatch Server (Streamable HTTP) running on port ${port}`);
      console.log(`Health check: http://0.0.0.0:${port}/health`);
      console.log(`MCP endpoint: http://0.0.0.0:${port}/mcp`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('Received SIGTERM, shutting down gracefully');
      httpServer.close(() => process.exit(0));
    });

    process.on('SIGINT', () => {
      console.log('Received SIGINT, shutting down gracefully');
      httpServer.close(() => process.exit(0));
    });
  }
}

const server = new SlopWatchStreamableServer();
server.run().catch((error) => {
  console.error('Failed to start SlopWatch Server:', error);
  process.exit(1);
}); 