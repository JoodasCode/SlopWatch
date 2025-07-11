#!/usr/bin/env node

/**
 * Demo: AI Accountability Workflow
 * 
 * This demonstrates how an AI would use the SlopWatch MCP tools:
 * 1. AI claims what it's about to implement
 * 2. AI makes the actual changes
 * 3. AI verifies its implementation
 */

import fs from 'fs';
import path from 'path';

// Simulate MCP tool calls (in real usage, these would be called by the AI through MCP)
async function simulateAIWorkflow() {
    console.log("🤖 AI ACCOUNTABILITY DEMO");
    console.log("=" * 50);
    
    // Step 1: AI claims what it's about to implement
    console.log("\n1️⃣ AI CLAIMS IMPLEMENTATION:");
    console.log("AI: 'I will add comprehensive error handling to the calculateTotal function'");
    
    const claim = {
        description: "Adding comprehensive error handling with try-catch blocks and input validation",
        files: ["test-demo.js"],
        type: "javascript"
    };
    
    console.log(`📝 Claim registered: ${claim.description}`);
    console.log(`📂 Files to modify: ${claim.files.join(', ')}`);
    
    // Step 2: AI makes actual changes (simulate this)
    console.log("\n2️⃣ AI MAKES CHANGES:");
    console.log("AI is now modifying the files...");
    
    const updatedCode = `// Simple test file for AI accountability demo with error handling
function calculateTotal(items) {
    try {
        // Input validation
        if (!Array.isArray(items)) {
            throw new Error('Items must be an array');
        }
        
        let total = 0;
        for (let item of items) {
            if (!item || typeof item.price !== 'number') {
                throw new Error('Invalid item: missing or invalid price');
            }
            total += item.price;
        }
        return total;
    } catch (error) {
        console.error('Error calculating total:', error.message);
        throw error;
    }
}

module.exports = { calculateTotal };`;
    
    // Write the updated code
    fs.writeFileSync('test-demo.js', updatedCode);
    console.log("✅ Changes applied to test-demo.js");
    
    // Step 3: AI verifies implementation
    console.log("\n3️⃣ AI VERIFICATION:");
    console.log("AI: 'Let me verify my implementation against my claim'");
    
    // Simulate verification logic
    const verification = analyzeImplementation(claim, updatedCode);
    
    console.log(`\n📊 VERIFICATION RESULTS:`);
    console.log(`Status: ${verification.verified ? '✅ VERIFIED' : '❌ FAILED'}`);
    console.log(`Confidence: ${verification.confidence}%`);
    console.log(`Evidence found: ${verification.evidence.length} items`);
    
    verification.evidence.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item}`);
    });
    
    if (verification.verified) {
        console.log("\n🎉 AI successfully implemented what it claimed!");
    } else {
        console.log("\n⚠️  AI claim not fully verified - potential lie detected!");
    }
}

function analyzeImplementation(claim, code) {
    const evidence = [];
    let confidence = 0;
    
    // Look for error handling patterns
    if (code.includes('try {') && code.includes('catch')) {
        evidence.push('✅ try-catch block found');
        confidence += 30;
    }
    
    if (code.includes('throw new Error')) {
        evidence.push('✅ Error throwing for invalid input');
        confidence += 25;
    }
    
    if (code.includes('Array.isArray')) {
        evidence.push('✅ Input validation for array type');
        confidence += 20;
    }
    
    if (code.includes('typeof') && code.includes('number')) {
        evidence.push('✅ Type checking for numeric values');
        confidence += 15;
    }
    
    if (code.includes('console.error')) {
        evidence.push('✅ Error logging implemented');
        confidence += 10;
    }
    
    return {
        verified: confidence >= 70,
        confidence: Math.min(confidence, 100),
        evidence
    };
}

// Run the demo
simulateAIWorkflow().catch(console.error); 