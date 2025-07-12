// AI Access Test - Both AI and MCP server should access the same files
// If I (AI) can create this file, SlopWatch should be able to read it

console.log("🤖 AI created this file successfully");
console.log("📁 Location: /Users/ahassan/Documents/Slop/ai-access-test.js");
console.log("🔍 SlopWatch should be able to read this same file");
console.log("💡 We're both running in the same Cursor environment");

const testData = {
    createdBy: "AI Assistant",
    location: __filename,
    timestamp: new Date().toISOString(),
    expectation: "SlopWatch should read this file successfully"
};

console.log("Test data:", JSON.stringify(testData, null, 2)); 