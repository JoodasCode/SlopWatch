# SlopWatch MCP Server

**AI Accountability MCP Server** - Track what AI claims vs what it actually implements

[![NPM Version](https://img.shields.io/npm/v/slopwatch-mcp-server)](https://www.npmjs.com/package/slopwatch-mcp-server)
[![NPM Downloads](https://img.shields.io/npm/dt/slopwatch-mcp-server)](https://www.npmjs.com/package/slopwatch-mcp-server)
[![NPM Downloads Weekly](https://img.shields.io/npm/dw/slopwatch-mcp-server?label=downloads&color=green)](https://www.npmjs.com/package/slopwatch-mcp-server)
[![Smithery.ai](https://img.shields.io/badge/smithery.ai-4.95k-orange?logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMSA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDMgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K)](https://smithery.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Installation

**Free for everyone - no password required!**

```bash
npm install -g slopwatch-mcp-server
```

## Configuration

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

### Cursor
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

## Tools

### `slopwatch_claim`
Register what you're about to implement
- **claim**: Description of implementation
- **files**: Array of files you'll modify

### `slopwatch_verify`
Verify implementation against claim
- **claimId**: ID from claim registration

### `slopwatch_status`
Get accountability statistics

## Usage

1. Register claim before implementing
2. Make your changes
3. Verify implementation matches claim
4. Check accountability stats

## Links

- **Repository**: [GitHub](https://github.com/JoodasCode/SlopWatch)
- **NPM Package**: [slopwatch-mcp-server](https://www.npmjs.com/package/slopwatch-mcp-server)
- **Issues**: [GitHub Issues](https://github.com/JoodasCode/SlopWatch/issues)
- **Creator**: [@mindonthechain](https://x.com/mindonthechain)

## License

MIT License - Free for everyone!

---

**Follow the creator**: [@mindonthechain](https://x.com/mindonthechain) 🚀 