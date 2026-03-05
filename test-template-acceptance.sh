#!/bin/bash

# Template Acceptance API Test Script
# Tests the new /api/message/status endpoint with template acceptance for lessons

BASE_URL="http://localhost:3000"
SESSION_ID="session_test_$(date +%s)"

echo "========================================="
echo "Template Acceptance API Test"
echo "========================================="
echo ""
echo "Session ID: $SESSION_ID"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Accept template for a specific lesson
echo -e "${YELLOW}Test 1: Accept Template for Lesson${NC}"
echo "POST /api/message/status (with lessonInfo and templateData)"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/api/message/status" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "'"$SESSION_ID"'",
    "messageId": "msg_template_123",
    "type": "accept",
    "lessonInfo": {
      "moduleNumber": 1,
      "module": "Introduction to Python",
      "lessonNumber": 2,
      "lesson": "Variables and Data Types"
    },
    "templateData": {
      "templateName": "video-lesson-template",
      "category": "Video Content",
      "templateType": "Video",
      "filledTemplate": {
        "title": "Understanding Variables in Python",
        "duration": "15 minutes",
        "objectives": [
          "Learn what variables are",
          "Understand data types",
          "Practice variable assignment"
        ],
        "sections": [
          { "title": "Introduction", "duration": "3 min" },
          { "title": "Variable Basics", "duration": "5 min" },
          { "title": "Data Types", "duration": "4 min" },
          { "title": "Practice", "duration": "3 min" }
        ]
      },
      "score": 4.5,
      "reason": "Perfect for beginner video content about variables"
    }
  }')

echo "$RESPONSE" | jq '.'
echo ""

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Test 1 PASSED: Template accepted for lesson${NC}"
else
  echo -e "${RED}✗ Test 1 FAILED${NC}"
fi
echo ""
echo "========================================="
echo ""

# Test 2: Reject template for a lesson
echo -e "${YELLOW}Test 2: Reject Template for Lesson${NC}"
echo "POST /api/message/status (reject)"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/api/message/status" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "'"$SESSION_ID"'",
    "messageId": "msg_template_456",
    "type": "reject",
    "lessonInfo": {
      "moduleNumber": 1,
      "module": "Introduction to Python",
      "lessonNumber": 3,
      "lesson": "Functions"
    },
    "templateData": {
      "templateName": "quiz-template",
      "category": "Quiz",
      "templateType": "Assessment"
    }
  }')

echo "$RESPONSE" | jq '.'
echo ""

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Test 2 PASSED: Template rejected for lesson${NC}"
else
  echo -e "${RED}✗ Test 2 FAILED${NC}"
fi
echo ""
echo "========================================="
echo ""

# Test 3: Regular message acceptance (without lesson/template)
echo -e "${YELLOW}Test 3: Regular Message Accept (No Lesson)${NC}"
echo "POST /api/message/status (regular message)"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/api/message/status" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "'"$SESSION_ID"'",
    "messageId": "msg_regular_789",
    "type": "accept"
  }')

echo "$RESPONSE" | jq '.'
echo ""

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Test 3 PASSED: Regular message accepted${NC}"
else
  echo -e "${RED}✗ Test 3 FAILED${NC}"
fi
echo ""
echo "========================================="
echo ""

# Test 4: Error handling - missing lessonInfo fields
echo -e "${YELLOW}Test 4: Error Handling - Invalid lessonInfo${NC}"
echo "POST /api/message/status (missing lessonNumber)"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/api/message/status" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "'"$SESSION_ID"'",
    "messageId": "msg_template_error",
    "type": "accept",
    "lessonInfo": {
      "moduleNumber": 1
    },
    "templateData": {
      "templateName": "test-template"
    }
  }')

echo "$RESPONSE" | jq '.'
echo ""

if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Test 4 PASSED: Error correctly returned for invalid lessonInfo${NC}"
else
  echo -e "${RED}✗ Test 4 FAILED${NC}"
fi
echo ""
echo "========================================="
echo ""

# Test 5: Error handling - missing templateData
echo -e "${YELLOW}Test 5: Error Handling - Missing templateData${NC}"
echo "POST /api/message/status (lessonInfo but no templateData)"
echo ""

RESPONSE=$(curl -s -X POST "$BASE_URL/api/message/status" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "'"$SESSION_ID"'",
    "messageId": "msg_template_error2",
    "type": "accept",
    "lessonInfo": {
      "moduleNumber": 1,
      "lessonNumber": 1
    }
  }')

echo "$RESPONSE" | jq '.'
echo ""

# This should work as regular message accept since templateData is missing
if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Test 5 PASSED: Falls back to regular message accept${NC}"
else
  echo -e "${RED}✗ Test 5 FAILED${NC}"
fi
echo ""
echo "========================================="
echo ""

echo -e "${YELLOW}Summary:${NC}"
echo "All tests completed. Check the results above."
echo ""
echo "Note: Tests 1 and 2 may fail with 'Session not found' if there's no"
echo "course outline in the database for the test session. This is expected"
echo "behavior - the API correctly validates that the session exists and"
echo "has a course outline before attempting to link templates."
echo ""
echo "To test with a real session:"
echo "1. Create a course outline first"
echo "2. Get template recommendations"
echo "3. Use the real sessionId and messageId in the test"
