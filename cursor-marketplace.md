# SlopWatch MCP Server - Cursor Marketplace Submission

## 📋 Basic Information

**Name**: SlopWatch  
**Package**: `slopwatch-mcp-server`  
**Version**: 2.7.0  
**Author**: JoodasCode  
**License**: MIT  
**Category**: Development Tools / AI Accountability  

## 🎯 Description

**Short**: AI Accountability MCP Server - Track what AI claims vs what it actually implements  

**Long**: SlopWatch is an AI accountability system designed specifically for Cursor IDE that catches AI lies in real-time. When AI claims to implement features, SlopWatch automatically tracks and verifies that the code changes actually match what was promised. Perfect for pair programming, code reviews, and building trust in AI-assisted development.

## 🚀 Key Features

- **Real-time AI verification** - Automatically tracks AI implementation claims
- **Ultra-minimal responses** - Clean, non-verbose output (90% less clutter)
- **Combined tool workflow** - Single call instead of multiple steps
- **Cursor IDE optimized** - Native integration with Composer
- **Accountability tracking** - Monitor AI accuracy over time
- **Seamless workflow** - No context switching required

## 🛠️ Installation

### Option 1: Smithery (Recommended - 1 click)
1. Visit [smithery.ai/server/@JoodasCode/slopwatch](https://smithery.ai/server/@JoodasCode/slopwatch)
2. Click "Install to Cursor"
3. Done! ✨

*Smithery handles hosting and updates automatically*

### Option 2: NPM Direct
**Configuration:**
```json
{
  "mcpServers": {
    "slopwatch": {
      "command": "npx",
      "args": ["slopwatch-mcp-server"]
    }
  }
}
```

**Manual Setup:**
1. Open Cursor Settings (`Cmd+Shift+J`)
2. Go to Features → Model Context Protocol
3. Click "Add New MCP Server"
4. Configure:
   - Name: SlopWatch
   - Type: stdio
   - Command: `npx slopwatch-mcp-server`

## 🎮 Usage

### Basic Workflow
1. AI claims: "I'll add error handling to your function"
2. SlopWatch automatically tracks the claim
3. AI implements the code
4. SlopWatch verifies: ✅ PASSED (87%) or ❌ FAILED (23%)

### Available Tools
- `slopwatch_claim_and_verify` - Combined claim and verification (recommended)
- `slopwatch_status` - Get accountability statistics
- `slopwatch_setup_rules` - Generate .cursorrules for auto-enforcement

## 📊 Example Usage

```javascript
// AI implements code, SlopWatch verifies automatically
slopwatch_claim_and_verify({
  claim: "Add input validation to calculateSum function",
  originalFileContents: {
    "utils/math.js": "function calculateSum(a, b) { return a + b; }"
  },
  updatedFileContents: {
    "utils/math.js": "function calculateSum(a, b) {\n  if (typeof a !== 'number' || typeof b !== 'number') {\n    throw new Error('Invalid input');\n  }\n  return a + b;\n}"
  }
});
// Response: "✅ PASSED (87%)"
```

## 🎯 Why Use SlopWatch?

### For Developers
- Catch AI lies before they become bugs
- Learn what AI actually does vs what it claims
- Improve code quality through verification
- Save debugging time

### For Cursor Users
- Native Composer integration
- Real-time feedback during development
- No verbose output cluttering chat
- Seamless pair programming workflow

## 🔗 Links

- **NPM Package**: https://www.npmjs.com/package/slopwatch-mcp-server
- **GitHub Repository**: https://github.com/JoodasCode/SlopWatch
- **Documentation**: https://github.com/JoodasCode/SlopWatch#readme
- **Smithery Hosted**: https://smithery.ai/server/@JoodasCode/slopwatch

## 📈 Stats

- **Weekly Downloads**: 500+ (growing)
- **GitHub Stars**: 50+ (active community)
- **Version**: 2.7.0 (actively maintained)
- **Compatibility**: Node.js 18+, Cursor IDE, Claude Desktop

## 🏷️ Tags

`ai-accountability`, `cursor-ide`, `mcp-server`, `development-tools`, `code-verification`, `pair-programming`, `ai-assistant`, `quality-assurance`, `claude`, `anthropic`

## 📝 Submission Notes

- **Tested with**: Cursor IDE latest version
- **Dependencies**: @modelcontextprotocol/sdk, nanoid
- **Transport**: stdio (recommended for Cursor)
- **Security**: No external API calls, local verification only
- **Performance**: Ultra-minimal responses, fast verification
- **Maintenance**: Actively maintained, regular updates

## 🎯 Target Audience

- **Primary**: Cursor IDE users doing AI pair programming
- **Secondary**: Claude Desktop users, AI-assisted developers
- **Use Cases**: Code reviews, learning, quality assurance, debugging

---

**Ready for Cursor Marketplace Submission** ✅ 