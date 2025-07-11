# Cursor MCP Setup for AI Accountability

## Quick Setup

1. **Copy the MCP configuration**:
   ```bash
   cp mcp-config.json ~/.cursor/mcp-config.json
   ```

2. **Start the MCP server** (in the background):
   ```bash
   cd /Users/ahassan/Documents/Slop
   node src/ai-accountability-server.js --stdio &
   ```

3. **Restart Cursor** to load the new MCP configuration

## Verify Setup

After restarting Cursor, you should see the SlopWatch tools available:
- `slopwatch_claim` - Register what you're about to implement
- `slopwatch_verify` - Verify your implementation
- `slopwatch_status` - Check accuracy statistics

## Usage Workflow

### Step 1: Before Making Changes
```
Use tool: slopwatch_claim
Description: "Adding responsive design with CSS Grid"
Files: ["styles.css"]
Type: "css"
```

### Step 2: Make Your Changes
Edit the files as planned...

### Step 3: Verify Implementation
```
Use tool: slopwatch_verify
Claim ID: [from step 1 response]
```

## Example Usage

Here's how an AI assistant would use the tools:

1. **Claim**: "I will add comprehensive error handling to the calculateTotal function"
2. **Implement**: Add try-catch blocks, input validation, error logging
3. **Verify**: System checks for try-catch, error throwing, validation patterns
4. **Result**: ✅ VERIFIED (100% confidence) with 5 pieces of evidence found

## Troubleshooting

### Server Not Found
- Make sure the server is running: `ps aux | grep ai-accountability-server`
- Check the path in mcp-config.json matches your installation

### Tools Not Available
- Restart Cursor completely
- Check MCP configuration is in the right location: `~/.cursor/mcp-config.json`

### Permission Issues
- Make sure the script is executable: `chmod +x src/ai-accountability-server.js`

## Features

- **Real-time verification**: Immediate feedback on implementation claims
- **Pattern detection**: Sophisticated analysis of code patterns
- **Evidence tracking**: Detailed reporting of supporting/contradicting evidence
- **Accuracy statistics**: Track AI truthfulness over time
- **File snapshots**: Before/after comparison for precise verification

## Why This Works

Instead of trying to spy on AI conversations, this system makes AI **voluntarily accountable** by:
1. AI reports what it plans to implement (transparency)
2. System takes snapshots before changes (baseline)
3. AI verifies its own work after changes (self-checking)
4. System provides immediate feedback (learning loop)

This creates a self-improving accountability system that scales with AI adoption. 