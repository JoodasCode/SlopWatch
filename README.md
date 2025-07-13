# 🎯 SlopWatch - AI Accountability MCP Server

**Stop AI from lying about what it implemented!** Track what AI claims vs what it actually does.

[![NPM Version](https://img.shields.io/npm/v/slopwatch-mcp-server)](https://www.npmjs.com/package/slopwatch-mcp-server)
[![NPM Downloads](https://img.shields.io/npm/dt/slopwatch-mcp-server)](https://www.npmjs.com/package/slopwatch-mcp-server)
[![NPM Downloads Weekly](https://img.shields.io/npm/dw/slopwatch-mcp-server?label=downloads&color=green)](https://www.npmjs.com/package/slopwatch-mcp-server)
[![Available on Smithery.ai](https://img.shields.io/badge/Available_on-Smithery.ai-orange)](https://smithery.ai/server/@JoodasCode/slopwatch)
[![Cursor MCP](https://img.shields.io/badge/Cursor-MCP_Compatible-blue)](https://cursor.directory/mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 What's New in v2.7.0

✨ **Ultra-Minimal Responses** - 90% less verbose output  
🔄 **Combined Tool** - Single call instead of 2 separate tools  
⚡ **Seamless Workflow** - Perfect for AI pair programming  
🎯 **Cursor MCP Compatible** - Works seamlessly with Cursor IDE

## 🤔 Why SlopWatch?

Ever had AI say *"I've added error handling to your function"* but it actually didn't? Or claim it *"implemented user authentication"* when it just added a comment?

**SlopWatch catches AI lies in real-time.**

## ⚡ Quick Start

### 🎯 Option 1: Smithery (Easiest - 1 click install)
1. Visit [smithery.ai/server/@JoodasCode/slopwatch](https://smithery.ai/server/@JoodasCode/slopwatch)
2. Click "Install to Cursor" or "Install to Claude"
3. Done! ✨

*Smithery handles hosting, authentication, and updates automatically*

### 🔧 Option 2: NPM Direct (Manual Setup)

**For Cursor IDE:**
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

**Manual Cursor Setup:**
1. Open Cursor Settings (`Cmd+Shift+J` on Mac, `Ctrl+Shift+J` on Windows)
2. Go to Features → Model Context Protocol
3. Click "Add New MCP Server"
4. Configure:
   - **Name**: SlopWatch
   - **Type**: stdio
   - **Command**: `npx slopwatch-mcp-server`

**For Claude Desktop:**
Add to your `claude_desktop_config.json`:
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

**Global NPM Install:**
```bash
npm install -g slopwatch-mcp-server
```

## 🎮 How to Use

### Method 1: Combined Tool (Recommended ⭐)
Perfect for when AI implements something and you want to verify it:

```javascript
// AI implements code, then verifies in ONE call:
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

### Method 2: Traditional 2-Step Process
For when you want to claim before implementing:

```javascript
// Step 1: Register claim
slopwatch_claim({
  claim: "Add error handling to user login",
  fileContents: {
    "auth.js": "function login(user) { return authenticate(user); }"
  }
});
// Response: "Claim ID: abc123"

// Step 2: Verify after implementation
slopwatch_verify({
  claimId: "abc123",
  updatedFileContents: {
    "auth.js": "function login(user) {\n  try {\n    return authenticate(user);\n  } catch (error) {\n    throw new Error('Login failed');\n  }\n}"
  }
});
// Response: "✅ PASSED (92%)"
```

## 🛠️ Available Tools

| Tool | Description | Response |
|------|-------------|----------|
| `slopwatch_claim_and_verify` | ⭐ **Recommended** - Claim and verify in one call | `✅ PASSED (87%)` |
| `slopwatch_status` | Get your accountability stats | `Accuracy: 95% (19/20)` |
| `slopwatch_setup_rules` | Generate .cursorrules for automatic enforcement | Minimal rules content |

## 🎯 Cursor IDE Integration

SlopWatch is designed specifically for **Cursor IDE** and AI pair programming:

### Automatic Detection
- Detects when AI claims to implement features
- Automatically suggests verification
- Integrates seamlessly with Cursor's Composer

### Smart Workflow
```
1. AI: "I'll add error handling to your function"
2. SlopWatch: Automatically tracks the claim
3. AI: Implements the code
4. SlopWatch: Verifies implementation matches claim
5. Result: ✅ PASSED (92%) or ❌ FAILED (23%)
```

### Perfect for:
- **Code reviews** - Verify AI actually implemented what it claimed
- **Pair programming** - Real-time accountability during development
- **Learning** - Understand what AI actually does vs what it says
- **Quality assurance** - Catch implementation gaps before they become bugs

## 💡 Real-World Examples

### Example 1: API Endpoint Enhancement
```javascript
// AI says: "I'll add rate limiting to your API endpoint"

slopwatch_claim_and_verify({
  claim: "Add rate limiting middleware to /api/users endpoint",
  originalFileContents: {
    "routes/users.js": "app.get('/api/users', (req, res) => { ... })"
  },
  updatedFileContents: {
    "routes/users.js": "const rateLimit = require('express-rate-limit');\nconst limiter = rateLimit({ windowMs: 15*60*1000, max: 100 });\napp.get('/api/users', limiter, (req, res) => { ... })"
  }
});
// Result: ✅ PASSED (94%)
```

### Example 2: React Component Update
```javascript
// AI claims: "Added responsive design with CSS Grid"

slopwatch_claim_and_verify({
  claim: "Make UserCard component responsive using CSS Grid",
  originalFileContents: {
    "components/UserCard.jsx": "const UserCard = () => <div className=\"user-card\">...</div>"
  },
  updatedFileContents: {
    "components/UserCard.jsx": "const UserCard = () => <div className=\"user-card grid-responsive\">...</div>",
    "styles/UserCard.css": ".grid-responsive { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }"
  }
});
// Result: ✅ PASSED (89%)
```

## 📊 Accountability Stats

Track your AI's honesty over time:

```javascript
slopwatch_status();
// Returns: "Accuracy: 95% (19/20)"
```

- **Accuracy Score**: Percentage of claims that were actually implemented
- **Claim Count**: Total number of implementation claims tracked
- **Success Rate**: How often AI delivers what it promises

## 🔧 Advanced Configuration

### Auto-Enforcement with .cursorrules
Generate automatic accountability rules:

```javascript
slopwatch_setup_rules();
```

This creates a `.cursorrules` file that automatically enforces SlopWatch verification for all AI implementations.

### Custom Verification
SlopWatch analyzes:
- **File changes** - Did the files actually get modified?
- **Code content** - Does the new code match the claim?
- **Implementation patterns** - Are the right patterns/libraries used?
- **Keyword matching** - Does the code contain relevant keywords?

## 🚀 Why Choose SlopWatch?

### For Developers:
- **Catch AI lies** before they become bugs
- **Learn faster** by seeing what AI actually does
- **Improve code quality** through automatic verification
- **Save time** with streamlined accountability

### For Teams:
- **Standardize AI interactions** across team members
- **Track AI reliability** over time
- **Reduce debugging** from AI implementation gaps
- **Build trust** in AI-assisted development

### For Cursor Users:
- **Native integration** with Cursor's Composer
- **Seamless workflow** - no context switching
- **Real-time feedback** during development
- **Ultra-minimal responses** - no verbose output

## 🎯 Getting Started with Cursor

1. **Install SlopWatch** using one of the methods above
2. **Open Cursor** and start a new chat with Composer
3. **Ask AI to implement something**: "Add input validation to my function"
4. **Watch SlopWatch work**: It automatically tracks and verifies the claim
5. **Get instant feedback**: ✅ PASSED (87%) or ❌ FAILED (23%)

## 🔍 Troubleshooting

### Common Issues:
- **Tools not showing**: Restart Cursor after installation
- **Verification failed**: Check if files were actually modified
- **NPM errors**: Try `npm cache clean --force` and reinstall

### Debug Mode:
Enable detailed logging by setting `DEBUG=true` in your environment.

## 📈 Roadmap

- [ ] **Visual dashboard** for accountability metrics
- [ ] **Integration with Git** for commit verification
- [ ] **Team analytics** for multi-developer projects
- [ ] **Custom verification rules** for specific frameworks
- [ ] **IDE extensions** for other editors

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🌟 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/JoodasCode/SlopWatch/issues)
- **Documentation**: [Full docs and examples](https://github.com/JoodasCode/SlopWatch#readme)
- **Community**: [Join the discussion](https://github.com/JoodasCode/SlopWatch/discussions)

---

**Made with ❤️ for the Cursor community**

*Stop AI from lying about what it implemented. Start using SlopWatch today!* 