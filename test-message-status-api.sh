#!/bin/bash

# Message Status API Test Script
# Tests the new /api/message/status endpoint

API_URL="http://localhost:3001"
SESSION_ID="test_session_$(date +%s)"
MESSAGE_ID="msg_$(date +%s)_assistant"

echo "🧪 Testing Message Status API"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Missing sessionId
echo -e "${YELLOW}Test 1: Missing sessionId${NC}"
curl -X POST "$API_URL/api/message/status" \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "msg_123",
    "type": "accept"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""
echo "---"
echo ""

# Test 2: Missing messageId
echo -e "${YELLOW}Test 2: Missing messageId${NC}"
curl -X POST "$API_URL/api/message/status" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_123",
    "type": "accept"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""
echo "---"
echo ""

# Test 3: Invalid type
echo -e "${YELLOW}Test 3: Invalid type${NC}"
curl -X POST "$API_URL/api/message/status" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_123",
    "messageId": "msg_456",
    "type": "invalid"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""
echo "---"
echo ""

# Test 4: Session/Message not found
echo -e "${YELLOW}Test 4: Session/Message not found${NC}"
curl -X POST "$API_URL/api/message/status" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "nonexistent_session",
    "messageId": "nonexistent_message",
    "type": "accept"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""
echo "---"
echo ""

# Test 5: Valid accept request (will work if session/message exists)
echo -e "${YELLOW}Test 5: Valid accept request${NC}"
echo "Note: This will fail if session/message doesn't exist in database"
curl -X POST "$API_URL/api/message/status" \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"messageId\": \"$MESSAGE_ID\",
    \"type\": \"accept\"
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""
echo "---"
echo ""

# Test 6: Valid reject request
echo -e "${YELLOW}Test 6: Valid reject request${NC}"
echo "Note: This will fail if session/message doesn't exist in database"
curl -X POST "$API_URL/api/message/status" \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"messageId\": \"$MESSAGE_ID\",
    \"type\": \"reject\"
  }" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s
echo ""
echo "---"
echo ""

echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "To test with a real session/message:"
echo "1. Create a course in the UI"
echo "2. Get the sessionId and messageId from the browser console"
echo "3. Run:"
echo ""
echo "curl -X POST \"$API_URL/api/message/status\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{"
echo "    \"sessionId\": \"your_session_id\","
echo "    \"messageId\": \"your_message_id\","
echo "    \"type\": \"accept\""
echo "  }'"
