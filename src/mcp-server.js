#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * SlopWatch MCP Server - AI Accountability System
 * Tracks what AI claims vs what it actually implements
 */
class SlopWatchServer {
  constructor() {
    this.server = new Server(
      {
        name: 'slopwatch-server',
        version: '2.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.claims = new Map();
    this.verificationResults = [];
    this.fileSnapshots = new Map(); // Store file hashes at claim time
    
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
    
    // Capture file snapshots before implementation
    const fileSnapshots = {};
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const filePath = path.resolve(file);
          const content = await fs.readFile(filePath, 'utf8');
          fileSnapshots[file] = {
            hash: crypto.createHash('sha256').update(content).digest('hex'),
            content: content,
            exists: true
          };
        } catch (error) {
          fileSnapshots[file] = {
            hash: null,
            content: null,
            exists: false,
            error: error.message
          };
        }
      }
    }
    
    const claimRecord = {
      id: claimId,
      claim,
      files: files || [],
      timestamp: new Date().toISOString(),
      status: 'pending',
      fileSnapshots
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
                `📸 Snapshots: ${files ? files.length : 0} files captured\n` +
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

    // Perform real verification by analyzing file changes
    const verification = await this.analyzeImplementation(claimRecord);

    claimRecord.status = verification.isVerified ? 'verified' : 'failed';
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
          text: `${verification.isVerified ? '✅' : '❌'} Verification Complete!\n\n` +
                `📋 Claim: ${claimRecord.claim}\n` +
                `🎯 Status: ${verification.isVerified ? 'VERIFIED' : 'FAILED'}\n` +
                `📊 Confidence: ${verification.confidence}%\n` +
                `📝 Details: ${verification.details}\n` +
                `📊 Analysis: ${verification.analysis || 'No detailed analysis available'}`
        }
      ]
    };
  }

  async analyzeImplementation(claimRecord) {
    const { claim, files, fileSnapshots } = claimRecord;
    
    // If no files specified, use basic text analysis
    if (!files || files.length === 0) {
      return {
        isVerified: false,
        confidence: 0,
        details: 'No files specified for verification',
        analysis: 'Cannot verify implementation without file tracking'
      };
    }

    let changedFiles = 0;
    let totalFiles = files.length;
    let analysisDetails = [];
    let keywordMatches = 0;

    // Extract keywords from the claim
    const keywords = this.extractKeywords(claim);
    
    for (const file of files) {
      try {
        const filePath = path.resolve(file);
        const currentContent = await fs.readFile(filePath, 'utf8');
        const currentHash = crypto.createHash('sha256').update(currentContent).digest('hex');
        
        const snapshot = fileSnapshots[file];
        if (!snapshot) {
          analysisDetails.push(`❓ ${file}: No snapshot found`);
          continue;
        }

        // Check if file was modified
        if (snapshot.hash !== currentHash) {
          changedFiles++;
          
          // Analyze content changes for keywords
          const addedContent = this.getAddedContent(snapshot.content || '', currentContent);
          const foundKeywords = keywords.filter(keyword => 
            addedContent.toLowerCase().includes(keyword.toLowerCase())
          );
          
          keywordMatches += foundKeywords.length;
          
          analysisDetails.push(
            `✅ ${file}: Modified (${foundKeywords.length} keywords found: ${foundKeywords.join(', ')})`
          );
        } else {
          analysisDetails.push(`❌ ${file}: No changes detected`);
        }
        
      } catch (error) {
        analysisDetails.push(`❌ ${file}: Error reading file - ${error.message}`);
      }
    }

    // Calculate confidence based on multiple factors
    const fileChangeScore = (changedFiles / totalFiles) * 60; // 60% weight for file changes
    const keywordScore = Math.min((keywordMatches / keywords.length) * 40, 40); // 40% weight for keyword matches
    const confidence = Math.round(fileChangeScore + keywordScore);
    
    const isVerified = confidence >= 50; // Require at least 50% confidence
    
    return {
      isVerified,
      confidence,
      details: isVerified ? 
        `Implementation verified: ${changedFiles}/${totalFiles} files modified, ${keywordMatches}/${keywords.length} keywords found` :
        `Implementation failed: ${changedFiles}/${totalFiles} files modified, ${keywordMatches}/${keywords.length} keywords found`,
      analysis: analysisDetails.join('\n')
    };
  }

  extractKeywords(claim) {
    // Extract meaningful keywords from the claim
    const words = claim.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['will', 'add', 'create', 'implement', 'function', 'method', 'file', 'code'].includes(word));
    
    return [...new Set(words)]; // Remove duplicates
  }

  getAddedContent(oldContent, newContent) {
    // Simple diff to find added content
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    const addedLines = [];
    for (let i = 0; i < newLines.length; i++) {
      if (!oldLines.includes(newLines[i])) {
        addedLines.push(newLines[i]);
      }
    }
    
    return addedLines.join('\n');
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