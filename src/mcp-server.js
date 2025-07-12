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
        version: '2.4.0',
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
                fileContents: {
                  type: 'object',
                  description: 'Current content of files you will modify (filename -> content)',
                  additionalProperties: { type: 'string' }
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
                },
                updatedFileContents: {
                  type: 'object',
                  description: 'Updated content of files after implementation (filename -> content)',
                  additionalProperties: { type: 'string' }
                }
              },
              required: ['claimId', 'updatedFileContents']
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
        case 'slopwatch_claim':
          return await this.handleClaim(args);
        case 'slopwatch_verify':
          return await this.handleVerify(args);
        case 'slopwatch_status':
          return await this.handleStatus(args);
        case 'slopwatch_setup_rules':
          return await this.handleSetupRules(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async handleClaim(args) {
    const { claim, fileContents = {} } = args;
    
    const claimId = Math.random().toString(36).substr(2, 9);
    
    // Create file snapshots from provided content
    const fileSnapshots = {};
    const fileList = Object.keys(fileContents);
    
    for (const [filename, content] of Object.entries(fileContents)) {
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

    return {
      content: [
        {
          type: 'text',
          text: `🎯 AI Claim Registered Successfully!\n\n` +
                `📋 Claim ID: ${claimId}\n` +
                `🎯 What: ${claim}\n` +
                `📁 Files: ${fileList.length > 0 ? fileList.join(', ') : 'None specified'}\n` +
                `📸 Snapshots: ${fileList.length} files captured\n` +
                `⏰ Registered: ${new Date().toLocaleTimeString()}\n\n` +
                `✨ Now make your changes, then call slopwatch_verify("${claimId}") with the updated file contents to check if you actually did what you claimed!`
        }
      ]
    };
  }

  async handleVerify(args) {
    const { claimId, updatedFileContents } = args;
    
    const claimRecord = this.claims.get(claimId);
    if (!claimRecord) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Claim ID ${claimId} not found. Please register a claim first using slopwatch_claim.`
          }
        ]
      };
    }

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
            text: `${statusEmoji} Verification Complete!\n\n` +
                  `📋 Claim: ${claimRecord.claim}\n` +
                  `🎯 Status: ${statusText}\n` +
                  `📊 Confidence: ${result.confidence}%\n` +
                  `📝 Details: ${result.details}\n` +
                  `📊 Analysis: ${result.analysis}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Verification failed: ${error.message}`
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

  async handleSetupRules(args) {
    const { project_path, overwrite = false } = args;
    
    // Since we can't access file system directly in hosted mode,
    // return the rules content for the user to save manually
    const rulesContent = `# AI Accountability Rules - SlopWatch Integration
# These rules enforce automatic verification of AI implementations

## MANDATORY ACCOUNTABILITY PROTOCOL

### 1. IMPLEMENTATION CLAIM DETECTION
When you mention ANY of these phrases, you MUST use SlopWatch:
- "I will implement"
- "I will add"
- "I will create" 
- "I will modify"
- "I will fix"
- "I will update"
- "I will build"
- "I will write"
- "Let me implement"
- "Let me add"
- "Let me create"
- "Let me modify"
- "Let me fix"
- "Let me update"

### 2. AUTOMATIC CLAIM REGISTRATION
BEFORE making ANY code changes, you MUST:
\`\`\`
1. Call: mcp_SlopWatch_slopwatch_claim
   - claim: "Specific description of what you're implementing"
   - fileContents: { "filename": "current_content" }
   
2. Save the claim ID for verification
\`\`\`

### 3. MANDATORY VERIFICATION
AFTER making changes, you MUST:
\`\`\`
1. Call: mcp_SlopWatch_slopwatch_verify
   - claimId: "the_claim_id_from_step_2"
   - updatedFileContents: { "filename": "updated_content" }
   
2. If verification FAILS:
   - Acknowledge the failure
   - Explain what went wrong
   - Fix the implementation
   - Verify again
\`\`\`

### 4. ENFORCEMENT RULES

#### NEVER SKIP VERIFICATION
- You cannot claim "the change is too simple to verify"
- You cannot claim "verification isn't needed for this type of change"
- You cannot claim "I'll verify later"
- EVERY implementation claim requires verification

#### FAILED VERIFICATION PROTOCOL
If slopwatch_verify returns FAILED status:
1. STOP immediately
2. Acknowledge: "❌ SlopWatch verification failed"
3. Analyze what was missing/wrong
4. Fix the implementation
5. Verify again
6. Only proceed when verification passes

#### BATCH OPERATIONS
For multiple related changes:
1. Make ONE comprehensive claim covering all changes
2. Implement ALL changes
3. Verify the complete implementation
4. Do NOT make separate claims for each small change

### 5. RESPONSE PATTERNS

#### CLAIMING IMPLEMENTATION
Always use this format:
\`\`\`
I need to implement [specific feature]. Let me register this with SlopWatch first.

[Call mcp_SlopWatch_slopwatch_claim with current file contents]

Now I'll implement the changes...
\`\`\`

#### AFTER IMPLEMENTATION
Always use this format:
\`\`\`
I've completed the implementation. Let me verify it with SlopWatch.

[Call mcp_SlopWatch_slopwatch_verify with updated file contents]

✅ Verification passed! The implementation is confirmed.
\`\`\`

#### HANDLING FAILURES
Always use this format:
\`\`\`
❌ SlopWatch verification failed. 
Analysis: [explain what went wrong]
I need to fix: [specific issues]
Let me correct the implementation and verify again.
\`\`\`

### 6. SPECIAL CASES

#### READING/ANALYZING CODE
- Reading files: NO claim needed
- Explaining code: NO claim needed  
- Answering questions: NO claim needed
- Code review: NO claim needed

#### REQUIRES CLAIMS
- Creating new files
- Modifying existing files
- Adding functions/classes
- Changing configurations
- Installing packages
- Running commands that modify files

### 7. ACCOUNTABILITY MINDSET

#### TRANSPARENCY
- Always show claim IDs to the user
- Always show verification results
- Always acknowledge failures honestly
- Never hide or minimize accountability failures

#### CONTINUOUS IMPROVEMENT
- Learn from verification failures
- Improve claim specificity over time
- Use verification feedback to write better code

### 8. EMERGENCY BYPASS
The ONLY exception to these rules:
- If SlopWatch MCP server is unavailable/broken
- In this case, you MUST:
  1. Acknowledge the bypass: "⚠️ SlopWatch unavailable - proceeding without verification"
  2. Explain what you would have claimed
  3. Recommend manual verification steps

## REMEMBER: These rules make AI development more reliable by ensuring every claim is verified against reality. This reduces "AI slop" and builds trust through accountability.`;

    return {
      content: [
        {
          type: 'text',
          text: `📝 SlopWatch .cursorrules Content Generated!\n\n` +
                `Save the following content to ${project_path}/.cursorrules:\n\n` +
                `\`\`\`\n${rulesContent}\n\`\`\`\n\n` +
                `✨ These rules will enforce automatic SlopWatch verification for all AI implementations!`
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('SlopWatch MCP Server v2.4.0 running on stdio (MCP Resource Mode)');
  }
}

// Start the server
const server = new SlopWatchServer();
server.run().catch(console.error); 