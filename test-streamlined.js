#!/usr/bin/env node

// Simple test for streamlined SlopWatch MCP server
import { spawn } from 'child_process';

console.log('🧪 Testing SlopWatch v2.7.0 (Streamlined)...\n');

// Test 1: Start server and check tools
console.log('1. Testing server startup...');
const server = spawn('node', ['src/mcp-server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Send list tools request
const listToolsRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {}
};

server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

let responseBuffer = '';
server.stdout.on('data', (data) => {
  responseBuffer += data.toString();
  
  try {
    const response = JSON.parse(responseBuffer.trim());
    if (response.result && response.result.tools) {
      console.log('✅ Server started successfully');
      console.log(`✅ Found ${response.result.tools.length} tools:`);
      
      response.result.tools.forEach(tool => {
        console.log(`   - ${tool.name}: ${tool.description}`);
      });
      
      // Verify we have exactly 3 tools
      const expectedTools = ['slopwatch_claim_and_verify', 'slopwatch_status', 'slopwatch_setup_rules'];
      const actualTools = response.result.tools.map(t => t.name);
      
      const hasAllExpected = expectedTools.every(tool => actualTools.includes(tool));
      const hasNoExtra = actualTools.length === expectedTools.length;
      
      if (hasAllExpected && hasNoExtra) {
        console.log('✅ Tool cleanup successful - only streamlined tools present');
      } else {
        console.log('❌ Tool cleanup failed - unexpected tools found');
        console.log('Expected:', expectedTools);
        console.log('Actual:', actualTools);
      }
      
      server.kill();
      process.exit(0);
    }
  } catch (e) {
    // Response might be incomplete, continue reading
  }
});

server.stderr.on('data', (data) => {
  const message = data.toString();
  if (message.includes('SlopWatch MCP Server v2.7.0')) {
    console.log('✅ Version updated to v2.7.0');
  }
});

server.on('close', (code) => {
  if (code !== 0) {
    console.log(`❌ Server exited with code ${code}`);
  }
});

// Timeout after 5 seconds
setTimeout(() => {
  console.log('❌ Test timed out');
  server.kill();
  process.exit(1);
}, 5000); 