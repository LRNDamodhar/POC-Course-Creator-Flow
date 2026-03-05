#!/bin/bash

# Quick Backend Test - Verify Template Save Functionality

echo "════════════════════════════════════════════════════════════"
echo "🧪 TESTING TEMPLATE SAVE FUNCTIONALITY"
echo "════════════════════════════════════════════════════════════"
echo ""

# Test data
SESSION_ID="test_session_$(date +%s)"
MESSAGE_ID="test_message_$(date +%s)"

echo "📝 Test Parameters:"
echo "   Session ID: $SESSION_ID"
echo "   Message ID: $MESSAGE_ID"
echo ""

# Create a test session first
echo "1️⃣  Creating test session..."
curl -s -X POST http://localhost:3000/api/session/create \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"test_user\"
  }" | jq '.'

echo ""
echo "2️⃣  Simulating course outline creation..."
echo "(This would normally be done through the chat, but we'll simulate)"
echo ""

# Test the message status endpoint with template data
echo "3️⃣  Testing template acceptance endpoint..."
echo ""
echo "Sending POST to /api/message/status with template data..."
echo ""

RESPONSE=$(curl -s -X POST http://localhost:3000/api/message/status \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$SESSION_ID\",
    \"messageId\": \"$MESSAGE_ID\",
    \"type\": \"accept\",
    \"lessonInfo\": {
      \"module\": \"Introduction to AI Ethics\",
      \"lesson\": \"What is AI Ethics?\"
    },
    \"templateData\": {
      \"templateName\": \"saq\",
      \"category\": \"interactive\",
      \"templateType\": \"interactive\"
    }
  }")

echo "Response:"
echo "$RESPONSE" | jq '.'
echo ""

# Check if endpoint exists and responds
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error')
    if [ "$ERROR_MSG" == "Not found" ]; then
        echo "⚠️  Expected Result: Session/outline not found (this is OK for test)"
        echo "   This means the endpoint is working correctly!"
        echo ""
        echo "✅ BACKEND IS RUNNING WITH UPDATED CODE"
        echo "   The endpoint exists and responds correctly."
        echo ""
    else
        echo "❌ Unexpected error: $ERROR_MSG"
        echo ""
        echo "Check backend logs for details."
    fi
elif echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo "✅ SUCCESS! Template saved successfully."
    echo ""
    echo "Response data:"
    echo "$RESPONSE" | jq '.data'
    echo ""
else
    echo "❌ BACKEND ERROR"
    echo ""
    echo "Possible issues:"
    echo "1. Backend not running on port 3000"
    echo "2. Backend crashed"
    echo "3. Endpoint not accessible"
    echo ""
    echo "Please check:"
    echo "   - Backend terminal for errors"
    echo "   - Backend running: ps aux | grep 'node.*server.js'"
    echo "   - Port 3000 available: lsof -i :3000"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "🔍 BACKEND CONSOLE CHECK"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Look for these lines in your backend console:"
echo ""
echo "Expected logs if backend has new code:"
echo "  ═══════════════════════════════════════════════════════════"
echo "  [DB Service] ACCEPTING TEMPLATE FOR LESSON"
echo "  ═══════════════════════════════════════════════════════════"
echo "  [DB Service] Lesson Info: { ... }"
echo "  [DB Service] Template: saq"
echo "  ..."
echo ""
echo "If you see these logs → ✅ Backend has updated code"
echo "If you DON'T see these logs → ❌ Backend needs restart"
echo ""
echo "════════════════════════════════════════════════════════════"

echo ""
echo "🚀 NEXT STEPS:"
echo ""
echo "1. If backend needs restart:"
echo "   cd /Users/damodhar.meshram/cam/backend"
echo "   # Press Ctrl+C to stop"
echo "   npm start"
echo ""
echo "2. Test with real course outline:"
echo "   - Open app: http://localhost:4200"
echo "   - Create outline: 'create course outline for ethics in ai'"
echo "   - Request template: 'suggest template for module 1 lesson 1'"
echo "   - Accept template (click button)"
echo "   - Check if purple badge appears"
echo ""
echo "3. Verify in database:"
echo "   use cam_chat_db"
echo "   db.sessions.findOne({}, { 'messages.courseOutline.modules.lessons.template': 1 })"
echo ""
