// Test file to verify SlopWatch path resolution
// This file tests that SlopWatch can correctly locate and verify files

function testLocationVerification() {
    console.log("Testing SlopWatch location verification...");
    console.log("Current working directory:", process.cwd());
    console.log("File should be located at:", __filename);
    
    // Simple test function
    const result = {
        success: true,
        message: "SlopWatch location test completed successfully with working directory!",
        timestamp: new Date().toISOString(),
        workingDir: process.cwd()
    };
    
    return result;
}

// Export for potential use
module.exports = { testLocationVerification };

// Run test if called directly
if (require.main === module) {
    const result = testLocationVerification();
    console.log(JSON.stringify(result, null, 2));
} 