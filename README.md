# SlopWatch MCP Server 🎯

**AI Accountability System** - Track what AI claims vs what it actually implements

[![NPM Version](https://img.shields.io/npm/v/slopwatch-mcp-server)](https://www.npmjs.com/package/slopwatch-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 What is SlopWatch?

SlopWatch is a Model Context Protocol (MCP) server that provides AI accountability tools. It helps track what AI systems claim they will implement versus what they actually deliver, reducing "AI slop" - the gap between promises and reality.

### Key Features

- **📋 Claim Registration**: Register what you're about to implement
- **✅ Implementation Verification**: Verify if claims match reality  
- **📊 Accountability Tracking**: Get statistics on AI accuracy
- **🔍 Real-time Monitoring**: Track implementation vs claims in real-time

## 🚀 Installation

### Method 1: NPM Installation (Recommended)

```bash
# Install globally
npm install -g slopwatch-mcp-server

# Or install locally in your project
npm install slopwatch-mcp-server
```

### Method 2: Direct from GitHub

```bash
git clone https://github.com/JoodasCode/slopdetector.git
cd slopdetector
npm install
```

## ⚙️ Configuration

### For Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "slopwatch": {
      "command": "slopwatch-mcp-server"
    }
  }
}
```

**Configuration file locations:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### For Cursor

Add to your MCP settings in Cursor:

```json
{
  "mcpServers": {
    "slopwatch": {
      "command": "slopwatch-mcp-server",
      "args": []
    }
  }
}
```

### For Other MCP Clients

Use the command: `slopwatch-mcp-server` or the full path to the installed binary.

## 🛠️ Available Tools

### 1. `slopwatch_claim`
Register what you're about to implement.

**Parameters:**
- `claim` (string): What you are implementing
- `files` (array, optional): Files you will modify

**Example:**
```json
{
  "claim": "Add user authentication with JWT tokens",
  "files": ["auth.js", "middleware.js", "routes/user.js"]
}
```

### 2. `slopwatch_verify` 
Verify if your implementation matches your claim.

**Parameters:**
- `claimId` (string): ID of the claim to verify

**Example:**
```json
{
  "claimId": "abc123def"
}
```

### 3. `slopwatch_status`
Get current accountability statistics and recent activity.

**Returns:**
- Total claims made
- Verified implementations  
- Accuracy percentage
- Recent activity summary

## 📖 Usage Examples

### Basic Workflow

1. **Make a Claim**:
   ```
   "I'm going to implement user authentication with JWT tokens"
   ```

2. **Implement Your Code**:
   ```javascript
   // Your actual implementation
   ```

3. **Verify Implementation**:
   ```
   "Verify my authentication implementation (claim ID: abc123)"
   ```

4. **Check Your Stats**:
   ```
   "Show my SlopWatch accountability status"
   ```

### Sample Conversation

```
User: I'm going to add a dark mode toggle to the settings page
AI: 🎯 AI Claim Registered Successfully!
    📋 Claim ID: x7k9m2p
    🎯 What: Add dark mode toggle to the settings page
    ⏰ Registered: 2:30 PM
    
    ✨ Now make your changes, then call slopwatch_verify("x7k9m2p")

[After implementation]

User: Verify my dark mode implementation  
AI: ✅ Verification Complete!
    📋 Claim: Add dark mode toggle to the settings page
    🎯 Status: VERIFIED
    📊 Confidence: 92%
    📝 Details: Implementation matches claim requirements
```

## 🔧 Development

### Local Development

```bash
# Clone the repository
git clone https://github.com/JoodasCode/slopdetector.git
cd slopdetector

# Install dependencies
npm install

# Run the server
npm start
```

### Testing

```bash
# Run the MCP server locally
node src/mcp-server.js

# Test with MCP Inspector (if available)
# The server will be available on stdio transport
```

## 📊 Why Use SlopWatch?

- **🎯 Accountability**: Keep AI implementations honest
- **📈 Improvement**: Track and improve AI accuracy over time  
- **🔍 Transparency**: Clear visibility into what was promised vs delivered
- **⚡ Real-time**: Immediate feedback on implementation quality
- **📝 Documentation**: Automatic tracking of development claims

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Repository**: https://github.com/JoodasCode/slopdetector
- **NPM Package**: https://www.npmjs.com/package/slopwatch-mcp-server
- **Issues**: https://github.com/JoodasCode/slopdetector/issues

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/JoodasCode/slopdetector/issues) page
2. Create a new issue with detailed information
3. Include your configuration and error messages

---

**Made with ❤️ for AI accountability** 