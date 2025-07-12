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
        version: '2.2.0',
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

  async handleSetupRules(args) {
    const { project_path, overwrite = false } = args;
    
    const rulesPath = path.join(project_path, '.cursorrules');
    
    try {
      // Check if file exists
      const fileExists = await fs.access(rulesPath).then(() => true).catch(() => false);
      
      if (fileExists && !overwrite) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ .cursorrules file already exists at ${rulesPath}\n\n` +
                    `Use overwrite: true to replace it, or manually merge the rules.\n\n` +
                    `Current file preserved to avoid overwriting your existing rules.`
            }
          ]
        };
      }

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
   - files: ["list", "of", "files", "you'll", "modify"]
   
2. Save the claim ID for verification
\`\`\`

### 3. MANDATORY VERIFICATION
AFTER making changes, you MUST:
\`\`\`
1. Call: mcp_SlopWatch_slopwatch_verify
   - claimId: "the_claim_id_from_step_2"
   
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

[Call mcp_SlopWatch_slopwatch_claim]

Now I'll implement the changes...
\`\`\`

#### AFTER IMPLEMENTATION
Always use this format:
\`\`\`
I've completed the implementation. Let me verify it with SlopWatch.

[Call mcp_SlopWatch_slopwatch_verify]

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

      await fs.writeFile(rulesPath, rulesContent, 'utf8');
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ SlopWatch .cursorrules file created successfully!\n\n` +
                  `📁 Location: ${rulesPath}\n` +
                  `📋 Rules: AI accountability enforcement enabled\n` +
                  `🎯 Effect: All AI implementations will now be automatically verified\n\n` +
                  `The rules are now active for this project. AI assistants will automatically:\n` +
                  `• Register claims before implementing\n` +
                  `• Verify implementations after changes\n` +
                  `• Fix failed verifications\n\n` +
                  `🚀 Your project now has automatic AI accountability!`
          }
        ]
      };
      
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Error creating .cursorrules file: ${error.message}\n\n` +
                  `Please check that:\n` +
                  `• The project path exists: ${project_path}\n` +
                  `• You have write permissions\n` +
                  `• The path is accessible\n\n` +
                  `You can also manually create the file using the setup guide.`
          }
        ]
      };
    }
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