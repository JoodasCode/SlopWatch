#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { createHash } from 'crypto';
import { createServer } from 'http';

/**
 * AI Accountability MCP Server
 * Revolutionary approach: AI voluntarily reports what it's doing
 * and we verify in real-time!
 */
class AIAccountabilityServer {
  constructor() {
    this.claims = new Map(); // Track active claims
    this.verificationResults = [];
    
    // Only initialize MCP server for STDIO mode
    const args = process.argv.slice(2);
    if (!args.includes('--http')) {
      this.server = new Server(
        {
          name: 'ai-accountability-server',
          version: '2.0.0',
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );
      this.setupTools();
      this.setupErrorHandling();
    }
  }

  setupTools() {
    if (!this.server) return; // Skip if in HTTP mode
    
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'slopwatch_claim',
          description: '🎯 Register what you are about to implement (AI should call this BEFORE making changes)',
          inputSchema: {
            type: 'object',
            properties: {
              claim: {
                type: 'string',
                description: 'What you are implementing (e.g., "Adding responsive design with CSS Grid")',
              },
              files: {
                type: 'array',
                items: { type: 'string' },
                description: 'Files you will modify (e.g., ["styles.css", "index.html"])',
              },
              type: {
                type: 'string',
                description: 'Implementation type (css, js, react, python, etc.)',
              },
              details: {
                type: 'string',
                description: 'Additional implementation details (optional)',
              }
            },
            required: ['claim', 'files', 'type'],
          },
        },
        {
          name: 'slopwatch_verify',
          description: '✅ Verify that your implementation matches your claim (AI should call this AFTER making changes)',
          inputSchema: {
            type: 'object',
            properties: {
              claimId: {
                type: 'string',
                description: 'The claim ID returned from slopwatch_claim',
              }
            },
            required: ['claimId'],
          },
        },
        {
          name: 'slopwatch_status',
          description: '📊 Get current AI accountability status and recent verification results',
          inputSchema: {
            type: 'object',
            properties: {
              detailed: {
                type: 'boolean',
                description: 'Show detailed verification history',
              }
            },
          },
        }
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'slopwatch_claim':
          return this.registerClaim(request.params.arguments);
        case 'slopwatch_verify':
          return this.verifyClaim(request.params.arguments);
        case 'slopwatch_status':
          return this.getStatus(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async registerClaim(args) {
    const { claim, files, type, details } = args;
    
    // Generate unique claim ID
    const claimId = createHash('md5')
      .update(`${claim}-${Date.now()}-${Math.random()}`)
      .digest('hex')
      .slice(0, 8);

    // Store claim with metadata
    const claimRecord = {
      id: claimId,
      claim,
      files,
      type,
      details,
      timestamp: new Date().toISOString(),
      status: 'pending',
      fileSnapshots: {}
    };

    // Take snapshots of files before AI makes changes
    for (const file of files) {
      try {
        claimRecord.fileSnapshots[file] = await fs.readFile(file, 'utf-8');
      } catch (error) {
        claimRecord.fileSnapshots[file] = null; // File doesn't exist yet
      }
    }

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
                `✨ Now make your changes, then call slopwatch_verify("${claimId}") to check if you actually did what you claimed!`,
        },
      ],
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
            text: `❌ Claim ID ${claimId} not found. Use slopwatch_claim first to register what you're implementing.`,
          },
        ],
      };
    }

    // Verify the claim against actual changes
    const verification = await this.performVerification(claimRecord);
    
    // Update claim status
    claimRecord.status = verification.isVerified ? 'verified' : 'failed';
    claimRecord.verification = verification;
    claimRecord.verifiedAt = new Date().toISOString();

    // Store in results history
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
          text: this.formatVerificationResult(claimRecord, verification),
        },
      ],
    };
  }

  async performVerification(claimRecord) {
    const { claim, files, type, fileSnapshots } = claimRecord;
    
    let supportingEvidence = [];
    let contradictingEvidence = [];
    let filesAnalyzed = 0;

    // Check each file for changes and verify against claim
    for (const file of files) {
      try {
        const currentContent = await fs.readFile(file, 'utf-8');
        const previousContent = fileSnapshots[file] || '';
        
        if (currentContent === previousContent) {
          contradictingEvidence.push(`❌ No changes detected in ${file}`);
          continue;
        }

        filesAnalyzed++;
        
        // Analyze the actual changes made
        const changes = this.analyzeFileChanges(previousContent, currentContent, file);
        const claimPatterns = this.getDetectionPatterns(claim, type);
        
        // Verify if changes match the claim
        for (const pattern of claimPatterns) {
          const matches = currentContent.match(pattern.regex);
          if (matches) {
            supportingEvidence.push(`✅ Found ${pattern.description} in ${file}: ${matches.length} instances`);
          } else {
            contradictingEvidence.push(`❌ Expected ${pattern.description} but not found in ${file}`);
          }
        }

      } catch (error) {
        contradictingEvidence.push(`❌ Could not analyze ${file}: ${error.message}`);
      }
    }

    // Calculate confidence
    const totalEvidence = supportingEvidence.length + contradictingEvidence.length;
    const confidence = totalEvidence === 0 ? 50 : Math.round((supportingEvidence.length / totalEvidence) * 100);
    const isVerified = confidence >= 60; // 60% threshold for verification

    return {
      isVerified,
      confidence,
      supportingEvidence,
      contradictingEvidence,
      filesAnalyzed
    };
  }

  getDetectionPatterns(claim, type) {
    const lowerClaim = claim.toLowerCase();
    const patterns = [];

    // Type-specific patterns
    if (type === 'css' || lowerClaim.includes('css') || lowerClaim.includes('styling')) {
      if (lowerClaim.includes('responsive') || lowerClaim.includes('media')) {
        patterns.push({
          regex: /@media\s*\([^)]+\)/g,
          description: 'responsive media queries'
        });
      }
      if (lowerClaim.includes('grid')) {
        patterns.push({
          regex: /display:\s*grid|grid-template/g,
          description: 'CSS Grid layout'
        });
      }
      if (lowerClaim.includes('flex')) {
        patterns.push({
          regex: /display:\s*flex|flex-/g,
          description: 'Flexbox layout'
        });
      }
    }

    if (type === 'js' || type === 'javascript' || lowerClaim.includes('javascript')) {
      if (lowerClaim.includes('error') && lowerClaim.includes('handling')) {
        patterns.push({
          regex: /try\s*\{[\s\S]*?\}\s*catch/g,
          description: 'error handling (try-catch)'
        });
      }
      if (lowerClaim.includes('async') || lowerClaim.includes('await')) {
        patterns.push({
          regex: /async\s+function|await\s+/g,
          description: 'async/await operations'
        });
      }
    }

    if (type === 'react' || lowerClaim.includes('react')) {
      if (lowerClaim.includes('hook') || lowerClaim.includes('state')) {
        patterns.push({
          regex: /useState|useEffect|useContext/g,
          description: 'React hooks'
        });
      }
    }

    // Generic patterns based on claim keywords
    if (lowerClaim.includes('function') || lowerClaim.includes('method')) {
      patterns.push({
        regex: /function\s+\w+|const\s+\w+\s*=\s*\(/g,
        description: 'function definitions'
      });
    }

    return patterns;
  }

  analyzeFileChanges(before, after, filename) {
    // Simple diff analysis - count lines added/removed
    const beforeLines = before.split('\n').length;
    const afterLines = after.split('\n').length;
    
    return {
      filename,
      linesAdded: Math.max(0, afterLines - beforeLines),
      linesRemoved: Math.max(0, beforeLines - afterLines),
      hasChanges: before !== after
    };
  }

  formatVerificationResult(claimRecord, verification) {
    const { claim, files, type } = claimRecord;
    const { isVerified, confidence, supportingEvidence, contradictingEvidence, filesAnalyzed } = verification;

    let output = `\n🔍 AI Accountability Verification Results\n`;
    output += `═══════════════════════════════════════════\n\n`;

    if (isVerified) {
      output += `✅ CLAIM VERIFIED: AI told the truth!\n`;
      output += `🎯 Claim: "${claim}"\n`;
      output += `📊 Confidence: ${confidence}%\n\n`;
    } else {
      output += `🚨 CLAIM FAILED: AI might be lying!\n`;
      output += `🎯 Claim: "${claim}"\n`;
      output += `📊 Confidence: ${confidence}%\n\n`;
    }

    output += `📁 Files analyzed: ${filesAnalyzed}\n`;
    output += `🏷️ Type: ${type}\n`;
    output += `📂 Files checked: ${files.join(', ')}\n\n`;

    if (supportingEvidence.length > 0) {
      output += `✅ Supporting Evidence:\n`;
      supportingEvidence.forEach((evidence, i) => {
        output += `   ${i + 1}. ${evidence}\n`;
      });
      output += `\n`;
    }

    if (contradictingEvidence.length > 0) {
      output += `❌ Issues Found:\n`;
      contradictingEvidence.forEach((evidence, i) => {
        output += `   ${i + 1}. ${evidence}\n`;
      });
      output += `\n`;
    }

    if (!isVerified) {
      output += `💡 Suggestion: Check if you actually implemented what you claimed, or revise your claim to match what you actually did.\n`;
    }

    return output;
  }

  async getStatus(args) {
    const { detailed = false } = args || {};
    
    const totalClaims = this.claims.size;
    const verifiedClaims = this.verificationResults.filter(r => r.isVerified).length;
    const failedClaims = this.verificationResults.filter(r => !r.isVerified).length;
    const accuracy = totalClaims === 0 ? 100 : Math.round((verifiedClaims / totalClaims) * 100);

    let output = `🔥 AI Accountability Server Status\n\n`;
    output += `📊 Total Claims: ${totalClaims}\n`;
    output += `✅ Verified: ${verifiedClaims}\n`;
    output += `❌ Failed: ${failedClaims}\n`;
    output += `🎯 AI Accuracy: ${accuracy}%\n\n`;

    if (detailed && this.verificationResults.length > 0) {
      output += `📋 Recent Verification History:\n`;
      this.verificationResults.slice(-5).forEach((result, i) => {
        const status = result.isVerified ? '✅' : '❌';
        output += `   ${status} "${result.claim}" (${result.confidence}%)\n`;
      });
    }

    output += `\n💡 How to use:\n`;
    output += `1. AI calls slopwatch_claim("what I'm implementing", ["file1.js"], "js")\n`;
    output += `2. AI makes the changes\n`;
    output += `3. AI calls slopwatch_verify(claimId)\n`;
    output += `4. Get instant lie detection results!\n`;

    return {
      content: [
        {
          type: 'text',
          text: output,
        },
      ],
    };
  }

  setupErrorHandling() {
    if (this.server) { // Only setup if server was initialized
      this.server.onerror = (error) => {
        console.error('[AI Accountability Server Error]:', error);
      };

      process.on('SIGINT', async () => {
        await this.server.close();
        process.exit(0);
      });
    }
  }

  setupHttpServer() {
    const httpServer = createServer((req, res) => {
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'healthy',
          name: 'AI Accountability Server',
          version: '2.0.0',
          claims: this.claims.size,
          accuracy: this.calculateAccuracy()
        }));
        return;
      }

      if (req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          totalClaims: this.claims.size,
          verifiedClaims: this.verificationResults.filter(r => r.isVerified).length,
          failedClaims: this.verificationResults.filter(r => !r.isVerified).length,
          accuracy: this.calculateAccuracy(),
          recentResults: this.verificationResults.slice(-5)
        }));
        return;
      }

      // Default response
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <head><title>AI Accountability Server</title></head>
          <body>
            <h1>🔥 AI Accountability Server</h1>
            <p>Server is running! Use MCP clients to connect.</p>
            <ul>
              <li><a href="/health">Health Check</a></li>
              <li><a href="/status">Status Dashboard</a></li>
            </ul>
          </body>
        </html>
      `);
    });

    return httpServer;
  }

  calculateAccuracy() {
    const totalClaims = this.verificationResults.length;
    if (totalClaims === 0) return 100;
    const verifiedClaims = this.verificationResults.filter(r => r.isVerified).length;
    return Math.round((verifiedClaims / totalClaims) * 100);
  }

  async run() {
    const args = process.argv.slice(2);
    
    if (args.includes('--http')) {
      // HTTP mode for Smithery deployment
      const httpServer = this.setupHttpServer();
      const port = process.env.PORT || 3001;
      
      httpServer.listen(port, () => {
        console.log(`🚀 AI Accountability Server running on HTTP port ${port}`);
        console.log(`Health check: http://localhost:${port}/health`);
        console.log(`Status: http://localhost:${port}/status`);
      });
      
      // Keep the process alive in HTTP mode
      process.on('SIGTERM', () => {
        console.log('Received SIGTERM, shutting down gracefully');
        httpServer.close(() => {
          process.exit(0);
        });
      });
      
      // Keep the process alive in HTTP mode
      process.on('SIGTERM', () => {
        console.log('Received SIGTERM, shutting down gracefully');
        httpServer.close(() => {
          process.exit(0);
        });
      });
      
    } else {
      // STDIO mode for MCP clients
      if (this.server) { // Only connect if server was initialized
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('🚀 AI Accountability Server running - AI can now report its claims!');
      } else {
        console.error('MCP server not initialized. Please run without --http for STDIO mode.');
      }
    }
  }
}

const server = new AIAccountabilityServer();
server.run().catch(console.error); 