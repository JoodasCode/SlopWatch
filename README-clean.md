# SlopWatch MCP Server 🎯

**AI Accountability System** - Track what AI claims vs what it actually implements

[![NPM Version](https://img.shields.io/npm/v/slopwatch-mcp-server)](https://www.npmjs.com/package/slopwatch-mcp-server)
[![NPM Downloads](https://img.shields.io/npm/dt/slopwatch-mcp-server)](https://www.npmjs.com/package/slopwatch-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 What is SlopWatch?

SlopWatch is a Model Context Protocol (MCP) server that provides AI accountability tools. It helps track what AI systems claim they will implement versus what they actually deliver, reducing "AI slop" - the gap between promises and reality.

### Key Features

- **📋 Claim Registration**: Register what you're about to implement
- **✅ Implementation Verification**: Verify if claims match reality  
- **📊 Accountability Tracking**: Get statistics on AI accuracy
- **🔍 Real-time Monitoring**: Track implementation vs claims in real-time
- **⚙️ Auto-setup**: Automatically generate .cursorrules for enforcement

## 🚀 Installation

### Method 1: NPM Installation (Recommended)

```bash
# Install globally
npm install -g slopwatch-mcp-server

# Or use npx (no installation needed)
npx slopwatch-mcp-server
```

### Method 2: Quick Setup

```bash
# One-line install and setup
npx slopwatch-mcp-server && echo "SlopWatch installed!"
```

## ⚙️ Configuration

### For Claude Desktop

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

**Configuration file locations:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### For Cursor

Add to your Cursor MCP settings or `~/.cursor/mcp.json`:

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

## 🎯 Usage

### Step 1: Register a Claim

Before implementing anything, register what you plan to do:

```
I will add user authentication to the login page.
```

The AI will automatically call `slopwatch_claim` with:
- **Claim**: Description of what you're implementing
- **Files**: List of files you'll modify

### Step 2: Implement Your Changes

Make your code changes as planned.

### Step 3: Verify Implementation

After implementation, verify your work:

```
Verify my authentication implementation.
```

The AI will call `slopwatch_verify` and show:
- ✅ **VERIFIED** - Implementation matches claim
- ❌ **FAILED** - Implementation doesn't match claim
- **Confidence Score** - How well the implementation matches

### Step 4: Automatic Rules Setup

Set up automatic enforcement:

```
Set up SlopWatch accountability rules for this project.
```

This creates `.cursorrules` that automatically enforce the claim-verify workflow.

## 🔧 Available Tools

### `slopwatch_claim`
Register what you're about to implement
- **claim**: Description of implementation
- **files**: Array of files you'll modify

### `slopwatch_verify`
Verify implementation against claim
- **claimId**: ID from the claim registration

### `slopwatch_status`
Get current accuracy statistics
- **detailed**: Show detailed verification history

### `slopwatch_setup_rules`
Auto-generate .cursorrules for enforcement
- **project_path**: Project directory (optional)
- **overwrite**: Replace existing rules (optional)

## 📊 How It Works

1. **File Snapshots**: Takes snapshots of files before implementation
2. **Content Analysis**: Analyzes actual changes made to files
3. **Keyword Matching**: Checks for implementation-related keywords
4. **Confidence Scoring**: Calculates match confidence (0-100%)
5. **Verification**: Determines if implementation matches claim

## 🎯 Example Workflow

```bash
# 1. AI makes a claim
"I will add error handling to the API endpoints"

# 2. SlopWatch registers the claim
📋 Claim ID: abc123
📁 Files: api/users.js, api/posts.js
📸 Snapshots: 2 files captured

# 3. AI implements the changes
# ... adds try-catch blocks, error responses, etc.

# 4. SlopWatch verifies the implementation
✅ VERIFIED (85% confidence)
📊 Analysis: 2/2 files modified, 4/5 keywords found
```

## 🔒 Privacy & Security

- **Local Processing**: All analysis happens locally
- **No Data Collection**: No personal code is sent anywhere
- **Optional Analytics**: Anonymous usage statistics (can be disabled)
- **Open Source**: Full transparency in how it works

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🐛 Issues & Support

- **Bug Reports**: [GitHub Issues](https://github.com/Slopdetector/slop/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/Slopdetector/slop/discussions)
- **Documentation**: [GitHub Wiki](https://github.com/Slopdetector/slop/wiki)

## 🚀 What's Next?

- **Team Collaboration**: Multi-user accountability tracking
- **Advanced Analytics**: Detailed performance metrics
- **IDE Integrations**: Support for more editors
- **Custom Rules**: Configurable verification criteria

---

**Built with ❤️ by the SlopWatch team**

*Reducing AI slop, one verification at a time.* 🎯 