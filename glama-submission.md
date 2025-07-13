# SlopWatch MCP Server - Glama.ai Submission

## 📋 Basic Information

**Name**: SlopWatch  
**Package**: `slopwatch-mcp-server`  
**Version**: 2.7.0  
**Author**: JoodasCode (@mindonthechain)  
**License**: MIT  
**Category**: Developer Tools / AI Accountability  
**GitHub**: https://github.com/JoodasCode/SlopWatch  
**NPM**: https://www.npmjs.com/package/slopwatch-mcp-server  

## 🎯 Short Description

AI Accountability MCP Server - Track what AI claims vs what it actually implements. Catch AI lies in real-time with ultra-minimal responses.

## 📖 Long Description

SlopWatch is an AI accountability system designed specifically for Cursor IDE and Claude Desktop that catches AI lies in real-time. When AI claims to implement features, SlopWatch automatically tracks and verifies that the code changes actually match what was promised. Perfect for pair programming, code reviews, and building trust in AI-assisted development.

## 🚀 Key Features

- **Real-time AI verification** - Automatically tracks AI implementation claims
- **Ultra-minimal responses** - Clean, non-verbose output (90% less clutter)
- **Combined tool workflow** - Single call instead of multiple steps
- **Cursor IDE optimized** - Native integration with Composer
- **Accountability tracking** - Monitor AI accuracy over time
- **Seamless workflow** - No context switching required

## 🛠️ Installation

### NPM Direct
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

### Smithery Hosted
Visit [smithery.ai/server/@JoodasCode/slopwatch](https://smithery.ai/server/@JoodasCode/slopwatch) for 1-click installation.

## 🎮 Usage Example

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

## 🛠️ Available Tools

1. **`slopwatch_claim_and_verify`** - Combined claim and verification (recommended)
2. **`slopwatch_status`** - Get accountability statistics
3. **`slopwatch_setup_rules`** - Generate .cursorrules for auto-enforcement

## 🎯 Use Cases

- **Pair programming with AI** - Real-time verification during development
- **Code reviews** - Verify AI actually implemented what it claimed
- **Learning** - Understand what AI actually does vs what it says
- **Quality assurance** - Catch implementation gaps before they become bugs

## 📊 Technical Details

- **Language**: JavaScript/Node.js
- **Dependencies**: @modelcontextprotocol/sdk, nanoid
- **Transport**: stdio (recommended for Cursor)
- **Security**: No external API calls, local verification only
- **Performance**: Ultra-minimal responses, fast verification
- **Compatibility**: Node.js 18+, Cursor IDE, Claude Desktop

## 🏷️ Tags

`ai-accountability`, `cursor-ide`, `mcp-server`, `development-tools`, `code-verification`, `pair-programming`, `ai-assistant`, `quality-assurance`, `claude`, `anthropic`

## 📈 Stats

- **NPM Downloads**: 500+ weekly (growing)
- **GitHub Stars**: 50+ (active community)
- **Version**: 2.7.0 (actively maintained)
- **License**: MIT (permissive)

## 🔗 Links

- **GitHub Repository**: https://github.com/JoodasCode/SlopWatch
- **NPM Package**: https://www.npmjs.com/package/slopwatch-mcp-server
- **Documentation**: https://github.com/JoodasCode/SlopWatch#readme
- **Smithery Hosted**: https://smithery.ai/server/@JoodasCode/slopwatch
- **Creator**: https://x.com/mindonthechain

## 🎯 Target Audience

- **Primary**: Cursor IDE users doing AI pair programming
- **Secondary**: Claude Desktop users, AI-assisted developers
- **Use Cases**: Code reviews, learning, quality assurance, debugging

## 💡 Why Choose SlopWatch?

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

## 🔧 Configuration

Minimal setup required:
1. Install via NPM or Smithery
2. Add to MCP configuration
3. Start using with AI pair programming

No API keys, no external dependencies, no complex setup.

## 📝 Example Prompts

- "Add error handling to my function and verify it with SlopWatch"
- "Check my AI's accuracy rate over the last week"
- "Generate .cursorrules to automatically enforce SlopWatch"

## 🌟 Quality Indicators

- **Security**: ✅ No external API calls, local-only verification
- **License**: ✅ MIT (permissive open source)
- **Quality**: ✅ Actively maintained, comprehensive testing
- **Documentation**: ✅ Complete README, examples, troubleshooting
- **Community**: ✅ Active GitHub repository, responsive maintainer

## 📊 Expected Glama.ai Scores

- **Security**: A (no vulnerabilities, local-only)
- **License**: A (MIT permissive license)
- **Quality**: A (confirmed to work, actively maintained)

---

**Ready for Glama.ai Submission** ✅

**Contact**: game.gamester@gmail.com for any questions about this submission. 