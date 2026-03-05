#!/bin/bash

# Test script for session management API

BASE_URL="http://localhost:3000"

echo "=== Testing Session Management System ==="
echo ""

# 1. Create a new session
echo "1. Creating a new session..."
SESSION_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/session/create")
SESSION_ID=$(echo $SESSION_RESPONSE | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
echo "Response: $SESSION_RESPONSE"
echo "Session ID: $SESSION_ID"
echo ""

# 2. Get all sessions
echo "2. Listing all active sessions..."
curl -s "${BASE_URL}/api/sessions" | json_pp
echo ""

# 3. Get session statistics
echo "3. Getting session statistics..."
curl -s "${BASE_URL}/api/session/${SESSION_ID}/stats" | json_pp
echo ""

# 4. Get session history (should be empty)
echo "4. Getting session history (should be empty)..."
curl -s "${BASE_URL}/api/session/${SESSION_ID}/history" | json_pp
echo ""

echo "5. Sending a message to the session..."
echo "Note: This will use Server-Sent Events. Check the frontend or use a proper SSE client."
echo "curl command: curl -X POST -H 'Content-Type: application/json' -d '{\"input\":\"Hello\",\"sessionId\":\"${SESSION_ID}\"}' ${BASE_URL}/api/turn/stream"
echo ""

# 6. Get updated statistics (after manual testing)
echo "6. To get updated stats after chatting, run:"
echo "curl -s \"${BASE_URL}/api/session/${SESSION_ID}/stats\" | json_pp"
echo ""

# 7. Get history (after manual testing)
echo "7. To get history after chatting, run:"
echo "curl -s \"${BASE_URL}/api/session/${SESSION_ID}/history\" | json_pp"
echo ""

# 8. Clear history
echo "8. To clear session history, run:"
echo "curl -s -X POST \"${BASE_URL}/api/session/${SESSION_ID}/clear\" | json_pp"
echo ""

# 9. Delete session
echo "9. To delete the session, run:"
echo "curl -s -X DELETE \"${BASE_URL}/api/session/${SESSION_ID}\" | json_pp"
echo ""

echo "=== Test Complete ==="
echo "Your session ID is: ${SESSION_ID}"
echo "Use this in your frontend or API calls to maintain conversation context."
