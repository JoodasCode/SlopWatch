#!/bin/bash

echo "🔥 SlopWatch MCP Server Installation"
echo "====================================="

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    echo "   Please install Node.js 18 or higher from https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
    echo "✅ Node.js $NODE_VERSION detected"
else
    echo "❌ Node.js 18 or higher required, found $NODE_VERSION"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Make server executable
chmod +x src/server.js

# Test the server
echo "🧪 Testing server..."
if npm test; then
    echo "✅ Server test passed!"
else
    echo "❌ Server test failed"
    exit 1
fi

echo ""
echo "🎉 SlopWatch MCP Server installed successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Add to your Windsurf settings:"
echo "      ~/.windsurf/settings.json"
echo ""
echo "   2. Add this configuration:"
echo '      "mcpServers": {'
echo '        "slopwatch": {'
echo '          "command": "node",'
echo '          "args": ["'$(pwd)'/src/server.js"],'
echo '          "env": {}'
echo '        }'
echo '      }'
echo ""
echo "   3. Restart Windsurf and start catching AI lies!"
echo ""
echo "🔍 Test with: npm test"
echo "🚀 Start HTTP server: npm run http" 