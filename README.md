# 🔥 SlopWatch MCP Server

**Professional AI lie detection for Windsurf IDE & Claude Desktop**

SlopWatch is a production-ready Model Context Protocol (MCP) server that provides real-time AI lie detection for code development environments. It analyzes AI claims against actual code to catch false assertions and inconsistencies.

## ✨ Features

* **🚨 Real-time Lie Detection**: Automatically detects when AI makes false claims about code
* **📊 Multi-language Support**: JavaScript, TypeScript, Python, CSS, HTML, React
* **🎯 Pattern Matching**: Advanced regex patterns for different programming concepts
* **⚡ Fast Analysis**: Optimized for quick analysis of large codebases
* **🔌 MCP Integration**: Native support for Windsurf and Claude Desktop
* **📈 Analytics**: Track lies detected and accuracy metrics

## 🚀 Quick Start

### Prerequisites

* Node.js 18 or higher
* npm or yarn

### Installation

1. **Install the package:**
   ```bash
   npm install -g slopwatch-mcp-server
   ```

2. **Configure Windsurf:**
   Add to your `~/.windsurf/settings.json`:
   ```json
   {
     "mcpServers": {
       "slopwatch": {
         "command": "slopwatch-mcp-server",
         "args": [],
         "env": {}
       }
     }
   }
   ```

3. **Restart Windsurf** and start using SlopWatch!

## 📖 Usage

### Available Commands

#### `analyze_claim`

Analyze an AI claim against your actual code:

```
analyze_claim "I've added comprehensive error handling"
```

**Parameters:**
* `claim` (required): The AI claim to analyze
* `workspaceDir` (optional): Directory to analyze (defaults to current)
* `fileTypes` (optional): Specific file extensions to check
* `maxFiles` (optional): Maximum files to analyze (default: 100)

#### `get_status`

Get current SlopWatch statistics:

```
get_status
```

**Parameters:**
* `detailed` (optional): Show detailed statistics

## 🎯 Detection Capabilities

### JavaScript/TypeScript
* ❌ **Error Handling**: `try/catch` blocks, error objects
* ⚡ **Async/Await**: Promise handling, async functions
* ✅ **Validation**: Input validation, type checks
* 🔒 **Security**: Sanitization, CSRF protection

### CSS
* 📱 **Responsive Design**: Media queries, flexbox, grid
* 🌙 **Dark Mode**: Color scheme preferences
* ♿ **Accessibility**: Focus states, screen reader support
* 🎨 **Modern Features**: Custom properties, container queries

### Python
* 🛡️ **Error Handling**: try/except blocks
* 🏷️ **Type Hints**: Function annotations
* ⚡ **Async/Await**: Coroutines and async functions

## 🔍 How It Works

1. **Claim Analysis**: Parses AI claims to identify technical assertions
2. **Pattern Matching**: Uses language-specific regex patterns to scan code
3. **Evidence Collection**: Gathers supporting and contradicting evidence
4. **Confidence Scoring**: Calculates likelihood that claim is truthful
5. **Detailed Reporting**: Provides specific examples and file locations

## 📊 Example Output

```
🚨 LIE DETECTED: Found 3 contradicting and 0 supporting evidence. 
The code does not support the AI's claim.

📊 Analysis Details:
├─ Files analyzed: 23
├─ Confidence score: 15%
└─ Evidence found: 3 items

🔍 Evidence:
   1. ❌ Expected error_handling but none found in src/utils.js
   2. ❌ Expected error_handling but none found in src/api.js  
   3. ❌ Expected error_handling but none found in src/main.js
```

## 🛠️ Development

### Build from Source

```bash
git clone https://github.com/JoodasCode/slopwatch-mcp-server.git
cd slopwatch-mcp-server
npm install
npm start
```

### Testing

```bash
npm test
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 Configuration

### Environment Variables

* `SLOPWATCH_MAX_FILES`: Maximum files to analyze (default: 100)
* `SLOPWATCH_TIMEOUT`: Analysis timeout in ms (default: 30000)
* `SLOPWATCH_LOG_LEVEL`: Logging level (default: 'info')

### Custom Patterns

You can extend SlopWatch with custom detection patterns by modifying the patterns configuration.

## 🤝 Support

* **Issues**: [GitHub Issues](https://github.com/JoodasCode/slopwatch-mcp-server/issues)
* **Discussions**: [GitHub Discussions](https://github.com/JoodasCode/slopwatch-mcp-server/discussions)
* **Documentation**: [Full Documentation](https://github.com/JoodasCode/slopwatch-mcp-server/wiki)

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

* **Model Context Protocol**: Built on Anthropic's MCP standard
* **Windsurf IDE**: Primary integration target
* **Claude Desktop**: Secondary integration support

---

**🔥 Stop the slop. Start the accountability. SlopWatch is watching.** 