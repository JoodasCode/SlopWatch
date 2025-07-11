#!/usr/bin/env node

/**
 * Direct MCP Server Test
 * Tests the AI accountability server by simulating MCP tool calls
 */

import { spawn } from 'child_process';
import fs from 'fs';

async function testMCPServer() {
    console.log("🧪 TESTING MCP SERVER DIRECTLY");
    console.log("===============================");
    
    // Start the MCP server
    const server = spawn('node', ['src/ai-accountability-server.js', '--stdio'], {
        stdio: ['pipe', 'pipe', 'pipe']
    });
    
    console.log("🚀 MCP Server started");
    
    // Test 1: slopwatch_claim
    console.log("\n1️⃣ Testing slopwatch_claim tool...");
    
    const claimRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
            name: "slopwatch_claim",
            arguments: {
                description: "Adding comprehensive error handling with try-catch blocks",
                files: ["test-demo.js"],
                type: "javascript"
            }
        }
    };
    
    server.stdin.write(JSON.stringify(claimRequest) + '\n');
    
    // Listen for response
    let responseData = '';
    server.stdout.on('data', (data) => {
        responseData += data.toString();
        console.log("📤 Server response:", data.toString());
    });
    
    server.stderr.on('data', (data) => {
        console.error("❌ Server error:", data.toString());
    });
    
    // Give it some time to respond
    setTimeout(() => {
        console.log("\n2️⃣ Testing slopwatch_status tool...");
        
        const statusRequest = {
            jsonrpc: "2.0",
            id: 2,
            method: "tools/call",
            params: {
                name: "slopwatch_status",
                arguments: {}
            }
        };
        
        server.stdin.write(JSON.stringify(statusRequest) + '\n');
        
        setTimeout(() => {
            console.log("\n✅ MCP Server test completed");
            server.kill();
        }, 2000);
        
    }, 2000);
}

// Run test
testMCPServer().catch(console.error); 