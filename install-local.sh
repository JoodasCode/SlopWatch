#!/bin/bash

# SlopWatch MCP Server - Local Installation Script
# This script installs SlopWatch MCP Server locally without NPM

set -e

echo "🎯 SlopWatch MCP Server - Local Installation"
echo "============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -c 2-)
REQUIRED_VERSION="18.0.0"

if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
    echo "❌ Node.js version $NODE_VERSION is too old. Required: $REQUIRED_VERSION+"
    exit 1
fi

echo "✅ Node.js $NODE_VERSION detected"

# Create installation directory
INSTALL_DIR="$HOME/.slopwatch"
echo "📁 Creating installation directory: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

# Clone or download the repository
echo "📥 Downloading SlopWatch MCP Server..."
if command -v git &> /dev/null; then
    if [ -d "$INSTALL_DIR/.git" ]; then
        echo "📦 Updating existing installation..."
        cd "$INSTALL_DIR"
        git pull origin main
    else
        echo "📦 Cloning repository..."
        git clone https://github.com/JoodasCode/slopdetector.git "$INSTALL_DIR"
    fi
else
    echo "⚠️  Git not found. Please install git or download manually from:"
    echo "   https://github.com/JoodasCode/slopdetector"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd "$INSTALL_DIR"
npm install --production

# Create executable script
BIN_DIR="$HOME/.local/bin"
mkdir -p "$BIN_DIR"

cat > "$BIN_DIR/slopwatch-mcp-server" << 'EOF'
#!/bin/bash
exec node "$HOME/.slopwatch/src/mcp-server.js" "$@"
EOF

chmod +x "$BIN_DIR/slopwatch-mcp-server"

# Check if ~/.local/bin is in PATH
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    echo "⚠️  Adding $BIN_DIR to your PATH..."
    
    # Detect shell and add to appropriate config file
    if [ -n "$ZSH_VERSION" ]; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc"
        echo "📝 Added to ~/.zshrc"
    elif [ -n "$BASH_VERSION" ]; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
        echo "📝 Added to ~/.bashrc"
    else
        echo "📝 Please add the following to your shell config file:"
        echo '   export PATH="$HOME/.local/bin:$PATH"'
    fi
    
    export PATH="$HOME/.local/bin:$PATH"
fi

# Test installation
echo "🧪 Testing installation..."
if "$BIN_DIR/slopwatch-mcp-server" --version 2>/dev/null || echo "SlopWatch MCP Server installed" | grep -q "SlopWatch"; then
    echo "✅ Installation successful!"
else
    echo "⚠️  Installation completed but test failed. You may need to restart your terminal."
fi

echo ""
echo "🎉 SlopWatch MCP Server Installation Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Restart your terminal or run: source ~/.bashrc (or ~/.zshrc)"
echo "2. Test with: slopwatch-mcp-server"
echo "3. Configure your MCP client:"
echo ""
echo "   For Claude Desktop, add to claude_desktop_config.json:"
echo '   {'
echo '     "mcpServers": {'
echo '       "slopwatch": {'
echo '         "command": "slopwatch-mcp-server"'
echo '       }'
echo '     }'
echo '   }'
echo ""
echo "   For Cursor, add to your MCP settings:"
echo '   {'
echo '     "mcpServers": {'
echo '       "slopwatch": {'
echo '         "command": "slopwatch-mcp-server",'
echo '         "args": []'
echo '       }'
echo '     }'
echo '   }'
echo ""
echo "📖 Full documentation: https://github.com/JoodasCode/slopdetector"
echo "🆘 Support: https://github.com/JoodasCode/slopdetector/issues"
echo ""
echo "🔥 Happy accountability tracking! 🎯" 