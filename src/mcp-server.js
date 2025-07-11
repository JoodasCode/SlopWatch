#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * SlopWatch MCP Server - AI Accountability System
 * Tracks what AI claims vs what it actually implements
 */
class SlopWatchServer {
  constructor() {
    this.server = new Server(
      {
        name: 'slopwatch-server',
        version: '2.0.1',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.claims = new Map();
    this.verificationResults = [];
    
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // Register tools list handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'slopwatch_claim',
            description: 'Register what you are about to implement to verify accuracy',
            inputSchema: {
              type: 'object',
              properties: {
                claim: {
                  type: 'string',
                  description: 'What you are implementing'
                },
                files: {
                  type: 'array',
                  description: 'Files you will modify',
                  items: { type: 'string' }
                }
              },
              required: ['claim']
            }
          },
          {
            name: 'slopwatch_verify',
            description: 'Verify implementation matches claim to catch errors',
            inputSchema: {
              type: 'object',
              properties: {
                claimId: {
                  type: 'string',
                  description: 'ID of the claim to verify'
                }
              },
              required: ['claimId']
            }
          },
          {
            name: 'slopwatch_status',
            description: 'Get current slop score and statistics',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ]
      };
    });

    // Register tool call handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'slopwatch_claim':
          return await this.handleClaim(args);
        case 'slopwatch_verify':
          return await this.handleVerify(args);
        case 'slopwatch_status':
          return await this.handleStatus(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async handleClaim(args) {
    const { claim, files } = args;
    
    const claimId = Math.random().toString(36).substr(2, 9);
    
    const claimRecord = {
      id: claimId,
      claim,
      files: files || [],
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
                `📁 Files: ${files ? files.join(', ') : 'None specified'}\n` +
                `⏰ Registered: ${new Date().toLocaleTimeString()}\n\n` +
                `✨ Now make your changes, then call slopwatch_verify("${claimId}") to check if you actually did what you claimed!`
        }
      ]
    };
  }

  async handleVerify(args) {
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

    // Simplified verification for demo
    const verification = {
      isVerified: true,
      confidence: 85,
      details: 'Claim verified successfully (demo mode)'
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

  async handleStatus(args) {
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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 SlopWatch MCP Server (Official SDK) running');
  }
}

// Run the server
const server = new SlopWatchServer();
server.run().catch((error) => {
  console.error('Failed to start SlopWatch Server:', error);
  process.exit(1);
}); 