#!/bin/bash

echo "🔥 SlopWatch MCP Installation for Windsurf"
echo "=========================================="

# Get the current directory (where the script is run from)
SLOPWATCH_PATH=$(pwd)

# Create Windsurf settings directory if it doesn't exist
mkdir -p ~/.windsurf

# Create the MCP settings
cat > ~/.windsurf/settings.json << EOF
{
  "mcpServers": {
    "slopwatch": {
      "command": "node",
      "args": ["$SLOPWATCH_PATH/mcp-simple.js"],
      "cwd": "$SLOPWATCH_PATH",
      "env": {}
    }
  }
}
EOF

echo "✅ Windsurf MCP configuration created!"
echo "📍 Config location: ~/.windsurf/settings.json"
echo "📁 SlopWatch path: $SLOPWATCH_PATH"
echo ""
echo "🚀 Next steps:"
echo "1. Restart Windsurf"
echo "2. Use these commands in any Windsurf chat:"
echo "   - slopwatch_start"
echo "   - slopwatch_analyze \"AI claim here\""
echo "   - slopwatch_status"
echo ""
echo "🎯 Test with: slopwatch_analyze \"I added error handling\""
echo "🔥 Expected: 🚨 LIE DETECTED! (if no try-catch in your code)" 