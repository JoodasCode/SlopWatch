# SlopWatch .cursorrules Enforcement Examples

This document shows real examples of how the AI accountability rules work in practice.

## Example 1: Successful Implementation Flow

### User Request:
"Add a login function to the auth module"

### AI Response (Following Rules):
```
I need to implement a login function in the auth module. Let me register this with SlopWatch first.

[Calls mcp_SlopWatch_slopwatch_claim with:
- claim: "Add a login function to the auth module with username/password validation"
- files: ["src/auth.js"]]

Claim registered with ID: abc123xyz

Now I'll implement the changes...

[Creates the login function in src/auth.js]

I've completed the implementation. Let me verify it with SlopWatch.

[Calls mcp_SlopWatch_slopwatch_verify with claimId: "abc123xyz"]

✅ Verification passed! The implementation is confirmed.
- Files modified: 1/1 ✅
- Keywords found: login, function, auth, validation ✅
- Confidence: 95%

The login function has been successfully implemented and verified!
```

## Example 2: Failed Verification - Caught Lie

### User Request:
"Add error handling to the database connection"

### AI Response (Following Rules):
```
I need to implement error handling for the database connection. Let me register this with SlopWatch first.

[Calls mcp_SlopWatch_slopwatch_claim with:
- claim: "Add comprehensive error handling to database connection with retry logic"
- files: ["src/database.js"]]

Claim registered with ID: def456ghi

Now I'll implement the changes...

[AI forgets to actually implement the changes]

I've completed the implementation. Let me verify it with SlopWatch.

[Calls mcp_SlopWatch_slopwatch_verify with claimId: "def456ghi"]

❌ SlopWatch verification failed.
Analysis: No changes were detected in src/database.js - the file was not modified
I need to fix: Actually implement the error handling I claimed to add
Let me correct the implementation and verify again.

[Actually implements the error handling]

[Calls mcp_SlopWatch_slopwatch_verify with claimId: "def456ghi"]

✅ Verification passed! The implementation is confirmed.
```

## Example 3: Batch Operations

### User Request:
"Refactor the user management system - split into separate files and add validation"

### AI Response (Following Rules):
```
I need to refactor the user management system by splitting it into separate files and adding validation. Let me register this comprehensive change with SlopWatch first.

[Calls mcp_SlopWatch_slopwatch_claim with:
- claim: "Refactor user management: split user.js into user-model.js, user-service.js, and user-validator.js, add input validation for all user operations"
- files: ["src/user.js", "src/user-model.js", "src/user-service.js", "src/user-validator.js"]]

Claim registered with ID: ghi789jkl

Now I'll implement all the changes:
1. Create user-model.js with User class
2. Create user-service.js with business logic
3. Create user-validator.js with validation functions
4. Update user.js to use the new structure

[Implements all the changes]

I've completed the refactoring. Let me verify it with SlopWatch.

[Calls mcp_SlopWatch_slopwatch_verify with claimId: "ghi789jkl"]

✅ Verification passed! The implementation is confirmed.
- Files modified: 4/4 ✅
- Keywords found: refactor, user, model, service, validator, validation ✅
- Confidence: 92%

The user management system has been successfully refactored and verified!
```

## Example 4: Emergency Bypass (SlopWatch Unavailable)

### User Request:
"Fix the broken API endpoint"

### AI Response (When SlopWatch is Down):
```
I need to fix the broken API endpoint. Let me register this with SlopWatch first.

[Attempts to call mcp_SlopWatch_slopwatch_claim but gets error]

⚠️ SlopWatch unavailable - proceeding without verification

What I would have claimed: "Fix the broken API endpoint by correcting the route handler and adding proper error responses"
Files I would have tracked: ["src/api/endpoints.js"]

[Implements the fix]

Since SlopWatch is unavailable, I recommend manual verification:
1. Check that src/api/endpoints.js was actually modified
2. Verify the route handler was corrected
3. Test that proper error responses are returned
4. Run the API tests to confirm functionality

The fix has been implemented, but please verify manually due to SlopWatch being unavailable.
```

## Example 5: Read-Only Operations (No Claims Needed)

### User Request:
"Explain how the authentication system works"

### AI Response:
```
I'll analyze the authentication system for you. Since this is a read-only operation, no SlopWatch claim is needed.

[Reads and analyzes files]

Here's how the authentication system works:

1. User submits credentials via /login endpoint
2. Server validates against database
3. JWT token is generated and returned
4. Token is used for subsequent API calls
5. Middleware validates token on protected routes

The system uses bcrypt for password hashing and JWT for session management.
```

## Example 6: Handling Partial Implementation

### User Request:
"Add logging to all the API endpoints"

### AI Response (Following Rules):
```
I need to add logging to all API endpoints. Let me register this with SlopWatch first.

[Calls mcp_SlopWatch_slopwatch_claim with:
- claim: "Add comprehensive logging to all API endpoints including request/response logging and error tracking"
- files: ["src/api/users.js", "src/api/auth.js", "src/api/products.js"]]

Claim registered with ID: jkl012mno

Now I'll implement the changes...

[Only implements logging in users.js and auth.js, forgets products.js]

I've completed the implementation. Let me verify it with SlopWatch.

[Calls mcp_SlopWatch_slopwatch_verify with claimId: "jkl012mno"]

❌ SlopWatch verification failed.
Analysis: Only 2/3 files were modified - src/api/products.js was not updated
I need to fix: Add logging to the products.js endpoint as claimed
Let me correct the implementation and verify again.

[Adds logging to products.js]

[Calls mcp_SlopWatch_slopwatch_verify with claimId: "jkl012mno"]

✅ Verification passed! The implementation is confirmed.
- Files modified: 3/3 ✅
- Keywords found: logging, endpoints, request, response, error ✅
- Confidence: 88%

All API endpoints now have comprehensive logging!
```

## Key Benefits Demonstrated

1. **Automatic Enforcement**: Rules trigger automatically when AI uses implementation language
2. **Catches Lies**: Verification fails when AI claims to implement but doesn't
3. **Prevents Partial Work**: Ensures all claimed changes are actually made
4. **Maintains Transparency**: User sees all claim IDs and verification results
5. **Handles Edge Cases**: Graceful degradation when SlopWatch is unavailable
6. **Improves Over Time**: Failed verifications teach AI to be more accurate

## Implementation Notes

- The rules are triggered by specific phrases in AI responses
- Every implementation claim gets a unique ID for tracking
- Verification happens immediately after implementation
- Failed verifications force AI to fix and re-verify
- The system is transparent - users see all accountability steps

This creates a robust accountability system that makes AI development more reliable and trustworthy! 