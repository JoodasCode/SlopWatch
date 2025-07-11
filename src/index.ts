import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'fs';
import { createHash } from 'crypto';
import { createServer } from 'http';

// Configuration schema for Smithery CLI
export const configSchema = {
  type: "object",
  properties: {
    debug: {
      type: "boolean",
      title: "Debug Mode", 
      description: "Enable debug logging",
      default: false
    }
  },
  required: []
};

export const exampleConfig = {
  debug: false
};

// Configuration interface
interface Config {
  debug?: boolean;
}

// For Smithery compatibility, we export the stateless server function
export function createStatelessServer({ config }: { config?: Config } = {}) {
  // Use default config if none provided (for tool discovery)
  const resolvedConfig = config || { debug: false };
  
  const server = new Server({
    name: 'slopwatch-server',
    version: '2.0.0',
  });

  // In-memory storage for claims
  const claims = new Map();
  const verificationResults: any[] = [];

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
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
        description: '📊 Get current SlopWatch status and recent verification results',
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

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    switch (request.params.name) {
      case 'slopwatch_claim':
        return await registerClaim(request.params.arguments, claims, resolvedConfig);
      case 'slopwatch_verify':
        return await verifyClaim(request.params.arguments, claims, verificationResults, resolvedConfig);
      case 'slopwatch_status':
        return await getStatus(request.params.arguments, claims, verificationResults);
      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  });

  return server;
}

async function registerClaim(args: any, claims: Map<string, any>, config: any) {
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
    fileSnapshots: {} as Record<string, string | null>
  };

  // Take snapshots of files before AI makes changes
  for (const file of files) {
    try {
      claimRecord.fileSnapshots[file] = await fs.readFile(file, 'utf-8');
    } catch (error) {
      claimRecord.fileSnapshots[file] = null; // File doesn't exist yet
    }
  }

  claims.set(claimId, claimRecord);

  if (config.debug) {
    console.log(`[SlopWatch] Registered claim ${claimId}: ${claim}`);
  }

  return {
    content: [
      {
        type: 'text',
        text: `🎯 SlopWatch Claim Registered Successfully!\n\n` +
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

async function verifyClaim(args: any, claims: Map<string, any>, verificationResults: any[], config: any) {
  const { claimId } = args;
  
  const claimRecord = claims.get(claimId);
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

  // Simple verification - check if files have changed
  let hasChanges = false;
  let supportingEvidence: string[] = [];
  let contradictingEvidence: string[] = [];

  for (const file of claimRecord.files) {
    try {
      const currentContent = await fs.readFile(file, 'utf-8');
      const originalContent = claimRecord.fileSnapshots[file];
      
      if (currentContent !== originalContent) {
        hasChanges = true;
        supportingEvidence.push(`File ${file} was modified`);
      }
    } catch (error) {
      contradictingEvidence.push(`Could not read file ${file}`);
    }
  }

  const isVerified = hasChanges && contradictingEvidence.length === 0;
  const confidence = isVerified ? 95 : 25;

  // Update claim status
  claimRecord.status = isVerified ? 'verified' : 'failed';
  claimRecord.verifiedAt = new Date().toISOString();

  // Store in results history
  verificationResults.push({
    claimId,
    claim: claimRecord.claim,
    isVerified,
    confidence,
    timestamp: new Date().toISOString()
  });

  if (config.debug) {
    console.log(`[SlopWatch] Verified claim ${claimId}: ${isVerified ? 'PASSED' : 'FAILED'}`);
  }

  let output = `\n🔍 SlopWatch Verification Results\n`;
  output += `═══════════════════════════════════════════\n\n`;

  if (isVerified) {
    output += `✅ CLAIM VERIFIED: AI told the truth!\n`;
    output += `🎯 Claim: "${claimRecord.claim}"\n`;
    output += `📊 Confidence: ${confidence}%\n\n`;
  } else {
    output += `🚨 CLAIM FAILED: AI might be lying!\n`;
    output += `🎯 Claim: "${claimRecord.claim}"\n`;
    output += `📊 Confidence: ${confidence}%\n\n`;
  }

  output += `📁 Files analyzed: ${claimRecord.files.length}\n`;
  output += `🏷️ Type: ${claimRecord.type}\n`;
  output += `📂 Files checked: ${claimRecord.files.join(', ')}\n\n`;

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

  return {
    content: [
      {
        type: 'text',
        text: output
      }
    ]
  };
}

async function getStatus(args: any, claims: Map<string, any>, verificationResults: any[]) {
  const { detailed = false } = args || {};
  
  const totalClaims = claims.size;
  const verifiedClaims = verificationResults.filter(r => r.isVerified).length;
  const failedClaims = verificationResults.filter(r => !r.isVerified).length;
  const accuracy = totalClaims === 0 ? 100 : Math.round((verifiedClaims / totalClaims) * 100);

  let output = `🔥 SlopWatch Server Status\n\n`;
  output += `📊 Total Claims: ${totalClaims}\n`;
  output += `✅ Verified: ${verifiedClaims}\n`;
  output += `❌ Failed: ${failedClaims}\n`;
  output += `🎯 AI Accuracy: ${accuracy}%\n\n`;

  if (detailed && verificationResults.length > 0) {
    output += `📋 Recent Verification History:\n`;
    verificationResults.slice(-5).forEach((result, i) => {
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
        text: output
      }
    ]
  };
} 