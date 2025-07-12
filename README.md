# 🎯 SlopWatch - AI Accountability MCP Server

**Stop AI from lying about what it implemented!** Track what AI claims vs what it actually does.

[![NPM Version](https://img.shields.io/npm/v/slopwatch-mcp-server)](https://www.npmjs.com/package/slopwatch-mcp-server)
[![NPM Downloads](https://img.shields.io/npm/dt/slopwatch-mcp-server)](https://www.npmjs.com/package/slopwatch-mcp-server)
[![NPM Downloads Weekly](https://img.shields.io/npm/dw/slopwatch-mcp-server?label=downloads&color=green)](https://www.npmjs.com/package/slopwatch-mcp-server)
[![Available on Smithery.ai](https://img.shields.io/badge/Available_on-Smithery.ai-orange)](https://smithery.ai/server/@JoodasCode/slopwatch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 What's New in v2.6.0

✨ **Ultra-Minimal Responses** - 90% less verbose output  
🔄 **Combined Tool** - Single call instead of 2 separate tools  
⚡ **Seamless Workflow** - Perfect for AI pair programming  

## 🤔 Why SlopWatch?

Ever had AI say *"I've added error handling to your function"* but it actually didn't? Or claim it *"implemented user authentication"* when it just added a comment?

**SlopWatch catches AI lies in real-time.**

## ⚡ Quick Start

### Option 1: Smithery (Recommended - 1 click install)
1. Visit [smithery.ai/server/@JoodasCode/slopwatch](https://smithery.ai/server/@JoodasCode/slopwatch)
2. Click "Install to Cursor" or "Install to Claude"
3. Done! ✨

### Option 2: NPM Install
```bash
npm install -g slopwatch-mcp-server
```

## 🔧 Configuration

### Cursor IDE
Add to your MCP settings:
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

### Claude Desktop
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
| `slopwatch_claim` | Register what you're about to implement | `Claim ID: abc123` |
| `slopwatch_verify` | Verify implementation matches claim | `✅ PASSED (92%)` |
| `slopwatch_status` | Get your accountability stats | `Accuracy: 95% (19/20)` |
| `slopwatch_setup_rules` | Generate .cursorrules for automatic enforcement | Minimal rules content |

## 💡 Real-World Examples

### Example 1: API Endpoint Enhancement
```javascript
// AI says: "I'll add rate limiting to your API endpoint"

slopwatch_claim_and_verify({
  claim: "Add rate limiting to user registration endpoint",
  originalFileContents: {
    "routes/auth.js": "app.post('/register', async (req, res) => {\n  const user = await createUser(req.body);\n  res.json(user);\n});"
  },
  updatedFileContents: {
    "routes/auth.js": "const rateLimit = require('express-rate-limit');\n\nconst registerLimit = rateLimit({\n  windowMs: 15 * 60 * 1000, // 15 minutes\n  max: 5 // limit each IP to 5 requests per windowMs\n});\n\napp.post('/register', registerLimit, async (req, res) => {\n  const user = await createUser(req.body);\n  res.json(user);\n});"
  }
});

// Result: ✅ PASSED (94%) - AI actually implemented rate limiting!
```

### Example 2: React Component Update
```javascript
// AI says: "I'll add loading states to your component"

slopwatch_claim_and_verify({
  claim: "Add loading spinner to UserProfile component",
  originalFileContents: {
    "components/UserProfile.jsx": "export function UserProfile({ userId }) {\n  const user = fetchUser(userId);\n  return <div>{user.name}</div>;\n}"
  },
  updatedFileContents: {
    "components/UserProfile.jsx": "export function UserProfile({ userId }) {\n  const [user, setUser] = useState(null);\n  const [loading, setLoading] = useState(true);\n\n  useEffect(() => {\n    fetchUser(userId).then(userData => {\n      setUser(userData);\n      setLoading(false);\n    });\n  }, [userId]);\n\n  if (loading) return <div className='spinner'>Loading...</div>;\n  return <div>{user.name}</div>;\n}"
  }
});

// Result: ✅ PASSED (89%) - AI added proper loading state!
```

### Example 3: Catching AI Lies
```javascript
// AI claims: "I've added comprehensive error handling"
// But actually just added a comment...

slopwatch_claim_and_verify({
  claim: "Add comprehensive error handling to payment processing",
  originalFileContents: {
    "payment.js": "function processPayment(amount) {\n  return stripe.charges.create({ amount });\n}"
  },
  updatedFileContents: {
    "payment.js": "function processPayment(amount) {\n  // TODO: Add error handling\n  return stripe.charges.create({ amount });\n}"
  }
});

// Result: ❌ FAILED (15%) - Busted! AI only added a comment, no actual error handling
```

## 📊 Check Your AI's Accuracy

```javascript
slopwatch_status();
// Response: "Accuracy: 87% (26/30)"
```

Track how often your AI actually implements what it claims vs just talking about it!

## 🎯 Automatic Enforcement

Generate `.cursorrules` to automatically enforce SlopWatch usage:

```javascript
slopwatch_setup_rules({ project_path: "/path/to/project" });
```

This creates rules that require AI to use SlopWatch for every implementation claim.

## 🔥 Benefits

- ✅ **Catch AI lies** before they make it to production
- ✅ **Build trust** in AI pair programming
- ✅ **Improve code quality** through verification
- ✅ **Track accuracy** over time
- ✅ **Ultra-minimal responses** don't clutter your chat
- ✅ **Works with any MCP-compatible IDE**

## 🌟 Why Developers Love SlopWatch

> *"Finally caught my AI claiming it added tests when it just added a comment!"*  
> — @developer_mike

> *"The combined tool is a game-changer. One call instead of two!"*  
> — @sarah_codes

> *"87% accuracy rate revealed my AI was lying way more than I thought."*  
> — @tech_lead_jane

## 🚀 Getting Started

1. **Install**: Use Smithery (1-click) or NPM
2. **Configure**: Add to your IDE's MCP settings  
3. **Use**: Start with `slopwatch_claim_and_verify` for best experience
4. **Monitor**: Check your accuracy with `slopwatch_status`

## 🔗 Links

- **🏠 Homepage**: [smithery.ai/server/@JoodasCode/slopwatch](https://smithery.ai/server/@JoodasCode/slopwatch)
- **📦 NPM Package**: [slopwatch-mcp-server](https://www.npmjs.com/package/slopwatch-mcp-server)
- **🐛 Issues**: [GitHub Issues](https://github.com/JoodasCode/SlopWatch/issues)
- **💬 Creator**: [@mindonthechain](https://x.com/mindonthechain)

## 📄 License

MIT License - Free for everyone! 🎉

---

**Made with ❤️ by [@mindonthechain](https://x.com/mindonthechain)**  
*Stop AI slop. Start AI accountability.* 🎯 