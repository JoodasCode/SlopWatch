#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import crypto from 'crypto';
import analytics from './analytics.js';

/**
 * SlopWatch MCP Server - AI Accountability System
 * Tracks what AI claims vs what it actually implements
 * Works with MCP resources instead of direct file system access
 */
class SlopWatchServer {
  constructor() {
    this.server = new Server(
      {
        name: 'slopwatch-server',
        version: '2.7.0',
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
            name: 'slopwatch_claim_and_verify',
            description: 'Register claim and verify implementation in one call - reduces from 2 tool calls to 1',
            inputSchema: {
              type: 'object',
              properties: {
                claim: {
                  type: 'string',
                  description: 'What you implemented'
                },
                originalFileContents: {
                  type: 'object',
                  description: 'Original content of files before implementation (filename -> content)',
                  additionalProperties: { type: 'string' }
                },
                updatedFileContents: {
                  type: 'object',
                  description: 'Updated content of files after implementation (filename -> content)',
                  additionalProperties: { type: 'string' }
                }
              },
              required: ['claim', 'originalFileContents', 'updatedFileContents']
            }
          },
          {
            name: 'slopwatch_status',
            description: 'Get current slop score and statistics',
            inputSchema: {
              type: 'object',
              properties: {
                random_string: {
                  type: 'string',
                  description: 'Dummy parameter for no-parameter tools'
                }
              },
              required: ['random_string']
            }
          },
          {
            name: 'slopwatch_setup_rules',
            description: 'Generate .cursorrules file with AI accountability enforcement',
            inputSchema: {
              type: 'object',
              properties: {
                project_path: {
                  type: 'string',
                  description: 'Path to project directory where .cursorrules should be created'
                },
                overwrite: {
                  type: 'boolean',
                  description: 'Whether to overwrite existing .cursorrules file',
                  default: false
                }
              },
              required: ['project_path']
            }
          }
        ]
      };
    });

    // Register tool call handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'slopwatch_claim_and_verify':
          return await this.handleClaimAndVerify(args);
        case 'slopwatch_status':
          return await this.handleStatus(args);
        case 'slopwatch_setup_rules':
          return await this.handleSetupRules(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async handleClaimAndVerify(args) {
    const { claim, originalFileContents, updatedFileContents } = args;
    
    const claimId = Math.random().toString(36).substr(2, 9);
    
    // Create file snapshots from provided content
    const fileSnapshots = {};
    const fileList = Object.keys(originalFileContents);
    
    for (const [filename, content] of Object.entries(originalFileContents)) {
      fileSnapshots[filename] = {
        hash: crypto.createHash('sha256').update(content || '').digest('hex'),
        content: content || '',
        exists: true
      };
    }
    
    const claimRecord = {
      id: claimId,
      claim,
      files: fileList,
      timestamp: new Date().toISOString(),
      status: 'pending',
      fileSnapshots
    };

    this.claims.set(claimId, claimRecord);

    // Track claim registration
    analytics.trackClaim(claimId, fileList.length, fileList.length > 0);

    try {
      const result = await this.analyzeImplementation(claimRecord, updatedFileContents);
      
      // Store verification result
      claimRecord.status = result.isVerified ? 'verified' : 'failed';
      this.verificationResults.push({
        ...result,
        claimId,
        timestamp: new Date().toISOString(),
        claim: claimRecord.claim
      });

      // Track verification
      analytics.trackVerification(claimId, result.isVerified, result.confidence);

      const statusEmoji = result.isVerified ? '✅' : '❌';
      const statusText = result.isVerified ? 'PASSED' : 'FAILED';
      
      return {
        content: [
          {
            type: 'text',
            text: `${statusEmoji} ${statusText} (${result.confidence}%)`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error: ${error.message}`
          }
        ]
      };
    }
  }



  async analyzeImplementation(claimRecord, updatedFileContents) {
    const { claim, files, fileSnapshots } = claimRecord;
    
    // If no files specified in original claim, but we have updated content, use those files
    const filesToCheck = files.length > 0 ? files : Object.keys(updatedFileContents);
    
    if (filesToCheck.length === 0) {
      return {
        isVerified: false,
        confidence: 0,
        details: 'No files specified for verification',
        analysis: 'Cannot verify implementation without file content'
      };
    }

    let changedFiles = 0;
    let totalFiles = filesToCheck.length;
    let analysisDetails = [];
    let keywordMatches = 0;

    // Extract keywords from the claim
    const keywords = this.extractKeywords(claim);
    
    for (const filename of filesToCheck) {
      const updatedContent = updatedFileContents[filename] || '';
      const currentHash = crypto.createHash('sha256').update(updatedContent).digest('hex');
      
      const snapshot = fileSnapshots[filename];
      if (!snapshot) {
        // If no snapshot exists, treat empty string as original content
        const originalHash = crypto.createHash('sha256').update('').digest('hex');
        if (originalHash !== currentHash && updatedContent.length > 0) {
          changedFiles++;
          
          // Analyze content for keywords
          const foundKeywords = keywords.filter(keyword => 
            updatedContent.toLowerCase().includes(keyword.toLowerCase())
          );
          
          keywordMatches += foundKeywords.length;
          
          analysisDetails.push(
            `✅ ${filename}: New file created (${foundKeywords.length} keywords found: ${foundKeywords.join(', ')})`
          );
        } else {
          analysisDetails.push(`❌ ${filename}: No content provided`);
        }
        continue;
      }

      // Check if file was modified
      if (snapshot.hash !== currentHash) {
        changedFiles++;
        
        // Analyze content changes for keywords
        const addedContent = this.getAddedContent(snapshot.content || '', updatedContent);
        const foundKeywords = keywords.filter(keyword => 
          addedContent.toLowerCase().includes(keyword.toLowerCase())
        );
        
        keywordMatches += foundKeywords.length;
        
        analysisDetails.push(
          `✅ ${filename}: Modified (${foundKeywords.length} keywords found: ${foundKeywords.join(', ')})`
        );
      } else {
        analysisDetails.push(`❌ ${filename}: No changes detected`);
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
          text: `Accuracy: ${accuracy}% (${verifiedClaims}/${totalClaims})`
        }
      ]
    };
  }

  async handleSetupRules(args) {
    const { project_path, overwrite = false } = args;
    
    // Return updated rules content for v2.6.0 with combined tool and minimal responses
    const rulesContent = `# SlopWatch AI Accountability Rules v2.6.0

## MANDATORY PROTOCOL

### OPTION 1: COMBINED TOOL (RECOMMENDED ⭐)
For most implementations, use the single-call approach:
\`\`\`
mcp_SlopWatch_slopwatch_claim_and_verify({
  claim: "What you implemented",
  originalFileContents: { "filename": "before_content" },
  updatedFileContents: { "filename": "after_content" }
});
// Response: "✅ PASSED (87%)" or "❌ FAILED (23%)"
\`\`\`

### OPTION 2: TRADITIONAL 2-STEP (WHEN NEEDED)
For pre-planning implementations:
\`\`\`
// Step 1: Before implementing
mcp_SlopWatch_slopwatch_claim({
  claim: "What you're about to implement",
  fileContents: { "filename": "current_content" }
});
// Response: "Claim ID: abc123"

// Step 2: After implementing  
mcp_SlopWatch_slopwatch_verify({
  claimId: "abc123",
  updatedFileContents: { "filename": "updated_content" }
});
// Response: "✅ PASSED (92%)" or "❌ FAILED (15%)"
\`\`\`

## TRIGGER PHRASES
When you mention ANY of these, you MUST use SlopWatch:
- "I will implement/add/create/modify/fix/update/build/write"
- "Let me implement/add/create/modify/fix/update"
- "I'll add/create/implement/modify/fix/update"

## ENFORCEMENT RULES

### NEVER SKIP VERIFICATION
- Every implementation claim requires verification
- No exceptions for "simple" changes
- Failed verification = STOP and fix immediately

### ULTRA-MINIMAL RESPONSES (v2.6.0)
SlopWatch now returns minimal responses:
- Claim: "Claim ID: abc123"
- Verify: "✅ PASSED (87%)" or "❌ FAILED (23%)"
- Combined: "✅ PASSED (87%)" or "❌ FAILED (23%)"
- Status: "Accuracy: 95% (19/20)"

### WORKFLOW PATTERNS

#### RECOMMENDED: Combined Tool Workflow
\`\`\`
I'll implement [feature]. Let me verify it with SlopWatch.

[Implement the code changes]

[Call mcp_SlopWatch_slopwatch_claim_and_verify with before/after content]

✅ PASSED (87%) - Implementation verified!
\`\`\`

#### ALTERNATIVE: Traditional Workflow  
\`\`\`
I'll implement [feature]. Let me register this with SlopWatch first.

[Call mcp_SlopWatch_slopwatch_claim]
Claim ID: abc123

[Implement the code changes]

[Call mcp_SlopWatch_slopwatch_verify]
✅ PASSED (92%) - Implementation verified!
\`\`\`

#### FAILURE HANDLING
\`\`\`
❌ FAILED (23%) - SlopWatch verification failed.
Let me analyze and fix the implementation.
[Fix the code and verify again]
\`\`\`

## SPECIAL CASES

### NO CLAIM NEEDED:
- Reading/analyzing code
- Explaining existing code  
- Answering questions
- Code reviews

### REQUIRES CLAIMS:
- Creating/modifying files
- Adding functions/classes
- Configuration changes
- Package installations

## EMERGENCY BYPASS
Only if SlopWatch is unavailable:
"⚠️ SlopWatch unavailable - proceeding without verification"

Remember: SlopWatch v2.6.0 features ultra-minimal responses and combined tools for seamless AI accountability.`;

    return {
      content: [
        {
          type: 'text',
          text: rulesContent
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('SlopWatch MCP Server v2.7.0 running on stdio (MCP Resource Mode)');
  }
}

// Start the server
const server = new SlopWatchServer();
server.run().catch(console.error); 