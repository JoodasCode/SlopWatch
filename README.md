# SlopWatch MCP Server

**AI Accountability MCP Server** - Track what AI claims vs what it actually implements

[![NPM Version](https://img.shields.io/npm/v/slopwatch-mcp-server)](https://www.npmjs.com/package/slopwatch-mcp-server)
[![NPM Downloads](https://img.shields.io/npm/dt/slopwatch-mcp-server)](https://www.npmjs.com/package/slopwatch-mcp-server)
[![NPM Downloads Weekly](https://img.shields.io/npm/dw/slopwatch-mcp-server?label=downloads&color=green)](https://www.npmjs.com/package/slopwatch-mcp-server)
[![Available on Smithery.ai](https://img.shields.io/badge/Available_on-Smithery.ai-orange)](https://smithery.ai)
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