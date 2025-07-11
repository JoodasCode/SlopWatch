# 🚀 SlopWatch MCP Server Installation Guide

This guide provides multiple ways to install and use SlopWatch MCP Server.

## 📋 Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org)
- **NPM** (comes with Node.js)
- **MCP-compatible client** (Claude Desktop, Cursor, etc.)

## 🎯 Installation Methods

### Method 1: NPM Installation (Recommended)

#### Global Installation
```bash
npm install -g slopwatch-mcp-server
```

#### Local Project Installation
```bash
npm install slopwatch-mcp-server
```

### Method 2: Local Installation Script

For users who prefer not to use NPM or want a local installation:

```bash
curl -fsSL https://raw.githubusercontent.com/JoodasCode/slopdetector/main/install-local.sh | bash
```

Or download and run manually:
```bash
wget https://raw.githubusercontent.com/JoodasCode/slopdetector/main/install-local.sh
chmod +x install-local.sh
./install-local.sh
```

### Method 3: Manual Installation

```bash
# Clone the repository
git clone https://github.com/JoodasCode/slopdetector.git
cd slopdetector

# Install dependencies
npm install

# Run directly
node src/mcp-server.js
```

## ⚙️ Configuration

### Claude Desktop

1. **Find your config file:**
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. **Add SlopWatch configuration:**
   ```json
   {
     "mcpServers": {
       "slopwatch": {
         "command": "slopwatch-mcp-server"
       }
     }
   }
   ```

3. **Restart Claude Desktop**

### Cursor

1. **Open Cursor Settings** → **Tools & Integrations** → **MCP Servers**

2. **Add new server:**
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

3. **Restart Cursor**

### Other MCP Clients

Use the command `slopwatch-mcp-server` or the full path to the binary.

## 🧪 Testing Installation

### Test the Server
```bash
# Test if the command is available
slopwatch-mcp-server --help

# Or run directly
node src/mcp-server.js
```

### Test in MCP Client

1. **Start your MCP client** (Claude Desktop, Cursor, etc.)
2. **Try these commands:**
   - "Register a claim that I'm going to add user authentication"
   - "Show my SlopWatch status"

You should see SlopWatch respond with claim registration and status information.

## 🔧 Troubleshooting

### Command Not Found

If you get "command not found" error:

1. **Check if the binary is in your PATH:**
   ```bash
   which slopwatch-mcp-server
   ```

2. **Add to PATH if needed:**
   ```bash
   # For bash
   echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc
   
   # For zsh
   echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

3. **Use full path in MCP config:**
   ```json
   {
     "mcpServers": {
       "slopwatch": {
         "command": "/full/path/to/slopwatch-mcp-server"
       }
     }
   }
   ```

### Permission Errors

If you get permission errors:

```bash
# Make sure the script is executable
chmod +x ~/.local/bin/slopwatch-mcp-server

# Or for manual installation
chmod +x /path/to/slopdetector/src/mcp-server.js
```

### Node.js Version Issues

Ensure you have Node.js 18 or higher:

```bash
node --version
# Should show v18.x.x or higher
```

If your version is too old, update Node.js from [nodejs.org](https://nodejs.org).

### MCP Client Not Recognizing Server

1. **Check the configuration file syntax** (valid JSON)
2. **Restart your MCP client completely**
3. **Check the client's logs** for error messages
4. **Try running the server manually** to test if it works

## 📁 File Locations

### NPM Global Installation
- **Binary**: Usually in `/usr/local/bin/slopwatch-mcp-server` or similar
- **Source**: In your global node_modules

### Local Installation Script
- **Installation**: `~/.slopwatch/`
- **Binary**: `~/.local/bin/slopwatch-mcp-server`

### Manual Installation
- **Source**: Where you cloned the repository
- **Binary**: Run directly with `node src/mcp-server.js`

## 🔄 Updating

### NPM Installation
```bash
npm update -g slopwatch-mcp-server
```

### Local Installation
```bash
# Re-run the installation script
curl -fsSL https://raw.githubusercontent.com/JoodasCode/slopdetector/main/install-local.sh | bash
```

### Manual Installation
```bash
cd /path/to/slopdetector
git pull origin main
npm install
```

## 🆘 Getting Help

If you're still having issues:

1. **Check our [Issues page](https://github.com/JoodasCode/slopdetector/issues)**
2. **Create a new issue** with:
   - Your operating system
   - Node.js version (`node --version`)
   - Installation method used
   - Error messages
   - MCP client you're using

## 🎉 Success!

Once installed and configured, you should be able to:

- **Register claims**: "I'm going to implement user authentication"
- **Verify implementations**: "Verify my authentication claim"
- **Check status**: "Show my SlopWatch accountability stats"

Welcome to AI accountability! 🎯 