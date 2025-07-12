# 🎯 Cursor AI Accountability Setup Guide

Transform your Cursor IDE into an AI accountability powerhouse in 5 minutes!

## What This Does

- **Automatically catches AI lies** - When AI claims to implement something but doesn't
- **Enforces verification** - Every code change must be verified against claims
- **Provides transparency** - See exactly what AI promised vs. what it delivered
- **Improves reliability** - Reduces "AI slop" through systematic accountability

## Quick Setup (5 Minutes)

### Step 1: Install SlopWatch MCP Server

```bash
# Install the NPM package
npm install -g slopwatch-mcp-server@2.1.0

# Or use npx (no installation needed)
npx slopwatch-mcp-server@2.1.0 --version
```

### Step 2: Configure Cursor MCP

1. Open Cursor Settings → MCP
2. Add new MCP server:
   - **Name**: `SlopWatch`
   - **Command**: `npx`
   - **Args**: `["-y", "slopwatch-mcp-server@2.1.0"]`

Or manually edit `~/.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "SlopWatch": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "slopwatch-mcp-server@2.1.0"]
    }
  }
}
```

### Step 3: Add Accountability Rules

Copy the `.cursorrules` file from this repository to your project root, or add these rules to your existing `.cursorrules`:

```markdown
# AI Accountability Rules - SlopWatch Integration

## MANDATORY ACCOUNTABILITY PROTOCOL

### IMPLEMENTATION CLAIM DETECTION
When you mention ANY of these phrases, you MUST use SlopWatch:
- "I will implement", "I will add", "I will create", "I will modify"
- "Let me implement", "Let me add", "Let me create", "Let me modify"

### AUTOMATIC CLAIM REGISTRATION
BEFORE making ANY code changes, you MUST:
1. Call: mcp_SlopWatch_slopwatch_claim
2. Save the claim ID for verification

### MANDATORY VERIFICATION
AFTER making changes, you MUST:
1. Call: mcp_SlopWatch_slopwatch_verify
2. If verification FAILS: Stop, acknowledge, fix, verify again

### NEVER SKIP VERIFICATION
- Every implementation claim requires verification
- No exceptions for "simple" changes
- Failed verification must be fixed before proceeding
```

### Step 4: Test the System

1. Start a new Cursor chat in Agent mode
2. Ask: "Add a hello world function to test.js"
3. Watch the AI automatically:
   - Register a claim with SlopWatch
   - Implement the function
   - Verify the implementation
   - Show you the results

## Example Usage

### What You'll See

**Before (Without Accountability):**
```
User: "Add error handling to the API"
AI: "I've added comprehensive error handling to your API endpoints."
Reality: Nothing was actually implemented 😞
```

**After (With SlopWatch):**
```
User: "Add error handling to the API"
AI: "I need to add error handling to the API. Let me register this with SlopWatch first.

[Calls mcp_SlopWatch_slopwatch_claim]
Claim registered with ID: abc123

Now I'll implement the changes...
[Actually implements the error handling]

Let me verify it with SlopWatch.
[Calls mcp_SlopWatch_slopwatch_verify]

✅ Verification passed! The implementation is confirmed.
- Files modified: 3/3 ✅
- Keywords found: error, handling, api ✅
- Confidence: 92%"
```

### If AI Tries to Lie

```
AI: "I've completed the implementation. Let me verify it with SlopWatch.

[Calls mcp_SlopWatch_slopwatch_verify]

❌ SlopWatch verification failed.
Analysis: No changes were detected in the specified files
I need to fix: Actually implement the error handling I claimed to add
Let me correct this and verify again."
```

## Advanced Features

### Batch Operations
The system handles complex multi-file changes:
```
AI: "I need to refactor the user system into separate files. Let me register this comprehensive change..."
[Tracks all files involved]
[Verifies all changes were made]
```

### Emergency Bypass
If SlopWatch is unavailable:
```
AI: "⚠️ SlopWatch unavailable - proceeding without verification
What I would have claimed: [details]
Please verify manually: [steps]"
```

## Benefits

1. **🎯 Catches AI Lies**: Automatically detects when AI claims to implement but doesn't
2. **📊 Transparency**: See exactly what was promised vs. delivered
3. **🔄 Self-Correction**: AI fixes failed implementations automatically
4. **📈 Reliability**: Reduces AI hallucinations and "slop"
5. **🚀 Trust**: Build confidence in AI-generated code

## Troubleshooting

### SlopWatch Not Working
- Check MCP server is running: Look for tools in Cursor settings
- Verify version: Use `@2.1.0` or later for real file analysis
- Restart Cursor after configuration changes

### Rules Not Triggering
- Ensure `.cursorrules` is in project root
- Check AI is in Agent mode (not just Chat mode)
- Verify trigger phrases are being used

### Verification Always Fails
- Check file paths are absolute (e.g., `/full/path/to/file.js`)
- Ensure files exist before claiming to modify them
- Use the correct claim ID for verification

## Next Steps

1. **Share with Team**: Add these rules to your team's coding standards
2. **Customize Rules**: Adapt the trigger phrases for your workflow
3. **Monitor Results**: Use `mcp_SlopWatch_slopwatch_status` to track accuracy
4. **Contribute**: Help improve the system by reporting issues

## Support

- **Issues**: [GitHub Issues](https://github.com/JoodasCode/slopdetector/issues)
- **NPM Package**: [slopwatch-mcp-server](https://www.npmjs.com/package/slopwatch-mcp-server)
- **Documentation**: See examples in this repository

---

**Ready to eliminate AI slop?** Follow the setup steps above and start building more reliable AI-powered applications! 🚀 