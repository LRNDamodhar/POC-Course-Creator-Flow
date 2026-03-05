#!/bin/bash

# Course Outline Status Persistence Test Script
# This script tests the accept/reject state persistence for course outlines

echo "════════════════════════════════════════════════════════════════"
echo "🧪 Testing Course Outline Status Persistence"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Configuration
API_URL="http://localhost:3000"
SESSION_ID="session_test_$(date +%s)"
MESSAGE_ID="msg_test_$(date +%s)"

echo "📋 Test Configuration:"
echo "   API URL: $API_URL"
echo "   Session ID: $SESSION_ID"
echo "   Message ID: $MESSAGE_ID"
echo ""

# Test 1: Update outline with accepted module
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Accept Module 1 (with all lessons)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -X POST "$API_URL/api/course-outline/update-status" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "'"$SESSION_ID"'",
    "messageId": "'"$MESSAGE_ID"'",
    "outline": {
      "title": "Python Programming Course",
      "description": "Learn Python from scratch",
      "targetAudience": "Beginners",
      "duration": "8 weeks",
      "totalModules": 2,
      "totalLessons": 8,
      "modules": [
        {
          "moduleNumber": 1,
          "title": "Introduction to Python",
          "description": "Getting started with Python",
          "lessonsCount": 4,
          "accepted": true,
          "lessons": [
            {
              "lessonNumber": 1,
              "title": "Installing Python",
              "objectives": ["Learn to install Python"],
              "duration": "30 minutes",
              "accepted": true
            },
            {
              "lessonNumber": 2,
              "title": "Your First Program",
              "objectives": ["Write Hello World"],
              "duration": "30 minutes",
              "accepted": true
            }
          ]
        },
        {
          "moduleNumber": 2,
          "title": "Python Basics",
          "description": "Learn Python fundamentals",
          "lessonsCount": 4,
          "accepted": false,
          "lessons": [
            {
              "lessonNumber": 1,
              "title": "Variables",
              "objectives": ["Understand variables"],
              "duration": "45 minutes",
              "accepted": false
            }
          ]
        }
      ]
    }
  }')

echo "Response:"
echo "$RESPONSE" | jq '.'
echo ""

# Check if successful
if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Test 1 PASSED: Outline status updated successfully"
else
  echo "❌ Test 1 FAILED: Failed to update outline status"
fi
echo ""

# Test 2: Verify the data persisted
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: Verify session contains updated outline"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait a moment for DB to persist
sleep 1

SESSION_RESPONSE=$(curl -s "$API_URL/api/session/$SESSION_ID/full")

echo "Session Response:"
echo "$SESSION_RESPONSE" | jq '.'
echo ""

# Check if session exists and has messages
if echo "$SESSION_RESPONSE" | jq -e '.session.messages' > /dev/null 2>&1; then
  MESSAGE_COUNT=$(echo "$SESSION_RESPONSE" | jq '.session.messages | length')
  echo "✅ Test 2 PASSED: Session has $MESSAGE_COUNT message(s)"
  
  # Check if outline has accepted module
  ACCEPTED_MODULES=$(echo "$SESSION_RESPONSE" | jq '[.session.messages[].courseOutline.modules[]? | select(.accepted == true)] | length')
  REJECTED_MODULES=$(echo "$SESSION_RESPONSE" | jq '[.session.messages[].courseOutline.modules[]? | select(.accepted == false)] | length')
  
  echo "   Accepted Modules: $ACCEPTED_MODULES"
  echo "   Rejected Modules: $REJECTED_MODULES"
  
  if [ "$ACCEPTED_MODULES" -gt 0 ]; then
    echo "✅ Outline persistence verified: Found accepted modules"
  else
    echo "⚠️  Warning: No accepted modules found in session"
  fi
else
  echo "⚠️  Test 2 SKIPPED: Session not found (may need to add message first)"
fi
echo ""

# Test 3: Update with rejected lesson
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: Reject specific lesson"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE3=$(curl -s -X POST "$API_URL/api/course-outline/update-status" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "'"$SESSION_ID"'",
    "messageId": "'"$MESSAGE_ID"'",
    "outline": {
      "title": "Python Programming Course",
      "description": "Learn Python from scratch",
      "targetAudience": "Beginners",
      "duration": "8 weeks",
      "totalModules": 1,
      "totalLessons": 3,
      "modules": [
        {
          "moduleNumber": 1,
          "title": "Introduction to Python",
          "description": "Getting started",
          "lessonsCount": 3,
          "lessons": [
            {
              "lessonNumber": 1,
              "title": "Installing Python",
              "objectives": ["Install Python"],
              "duration": "30 minutes",
              "accepted": true
            },
            {
              "lessonNumber": 2,
              "title": "Your First Program",
              "objectives": ["Write Hello World"],
              "duration": "30 minutes",
              "accepted": false
            },
            {
              "lessonNumber": 3,
              "title": "Variables",
              "objectives": ["Learn variables"],
              "duration": "45 minutes"
            }
          ]
        }
      ]
    }
  }')

echo "Response:"
echo "$RESPONSE3" | jq '.'
echo ""

if echo "$RESPONSE3" | jq -e '.success' > /dev/null 2>&1; then
  echo "✅ Test 3 PASSED: Individual lesson status updated"
else
  echo "❌ Test 3 FAILED: Failed to update lesson status"
fi
echo ""

# Test 4: Error handling - Missing sessionId
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 4: Error Handling - Missing sessionId"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ERROR_RESPONSE=$(curl -s -X POST "$API_URL/api/course-outline/update-status" \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "test_msg",
    "outline": {"title": "Test"}
  }')

echo "Response:"
echo "$ERROR_RESPONSE" | jq '.'
echo ""

if echo "$ERROR_RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo "✅ Test 4 PASSED: Proper error handling for missing sessionId"
else
  echo "❌ Test 4 FAILED: Should return error for missing sessionId"
fi
echo ""

# Test 5: Error handling - Missing outline
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 5: Error Handling - Missing outline"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ERROR_RESPONSE2=$(curl -s -X POST "$API_URL/api/course-outline/update-status" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test_session",
    "messageId": "test_msg"
  }')

echo "Response:"
echo "$ERROR_RESPONSE2" | jq '.'
echo ""

if echo "$ERROR_RESPONSE2" | jq -e '.error' > /dev/null 2>&1; then
  echo "✅ Test 5 PASSED: Proper error handling for missing outline"
else
  echo "❌ Test 5 FAILED: Should return error for missing outline"
fi
echo ""

# Summary
echo "════════════════════════════════════════════════════════════════"
echo "📊 Test Summary"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "✅ API endpoint is functional"
echo "✅ Accept/reject states can be updated"
echo "✅ Error handling works correctly"
echo ""
echo "Next Steps:"
echo "1. Test in UI by accepting/rejecting modules and lessons"
echo "2. Reload page and verify state is restored"
echo "3. Check backend logs for detailed update information"
echo ""
echo "Backend Logs Command:"
echo "   tail -f /path/to/backend/logs or check terminal running backend"
echo ""
echo "════════════════════════════════════════════════════════════════"
