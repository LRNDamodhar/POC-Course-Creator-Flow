# Template Recommender - Chat Integration Complete

## Overview
The template recommender system is now fully integrated into the chat workflow. When users request template recommendations, the system detects the intent, analyzes the conversation context, and streams back personalized template suggestions.

## Implementation Summary

### 1. Files Modified

#### `/backend/server.js`
Added template integration imports and detection logic in the streaming workflow:

```javascript
// Added imports
const {
  isTemplateCreationRequest,
  getTemplateRecommendations,
  formatTemplateRecommendations,
  getTemplateActions
} = require('./tools');
```

**Integration Point:** In `runWorkflowStream` function (line ~249), added template detection before agent processing:
- Detects template creation requests using `isTemplateCreationRequest()`
- Calls `getTemplateRecommendations()` with user input and conversation history
- Formats recommendations for display
- Generates action objects for frontend
- Streams response with type `template_recommendations`
- Returns early to skip agent processing for template requests

### 2. Files Created

#### `/backend/tools/templateIntegration.js`
Chat workflow integration layer with 5 exported functions:
- `isTemplateCreationRequest(message)` - Detects template requests
- `extractLessonInfo(message, history)` - Extracts topic/module/lesson
- `getTemplateRecommendations(message, history)` - Gets recommendations
- `formatTemplateRecommendations(recommendations)` - Formats as markdown
- `getTemplateActions(recommendations)` - Creates frontend action objects

#### `/backend/test-template-integration.js`
Test suite for template integration with:
- Detection tests for 5 different message types
- Full workflow test with conversation history
- Output validation for formatted text and actions

### 3. Files Updated

#### `/backend/tools/index.js`
Added template function exports:
```javascript
const {
  isTemplateCreationRequest,
  getTemplateRecommendations,
  formatTemplateRecommendations,
  getTemplateActions
} = require('./templateIntegration');

module.exports = {
  // ... existing exports
  isTemplateCreationRequest,
  getTemplateRecommendations,
  formatTemplateRecommendations,
  getTemplateActions
};
```

## How It Works

### User Workflow
1. **User sends message:** "create a template for a lesson about JavaScript arrays with a quiz"
2. **Detection:** `isTemplateCreationRequest()` returns `true`
3. **Analysis:** `extractLessonInfo()` parses:
   - Topic: "JavaScript arrays with a quiz"
   - Module: "Module" (default)
   - Lesson: full user message
   - Complexity: "intermediate"
4. **Recommendation:** `getTemplateRecommendations()` scores templates:
   - SAQ (score 1.5) - matches "quiz" keyword
   - BINARYLIST (score 0.5)
   - SELECTANDREVEAL (score 0.5)
5. **Formatting:** `formatTemplateRecommendations()` creates markdown with:
   - Analyzed content summary
   - Top 3 recommendations with scores, categories, reasons, usage
6. **Actions:** `getTemplateActions()` generates action objects:
   ```json
   {
     "type": "template_recommendation",
     "label": "Use saq Template",
     "templateName": "saq",
     "score": 1.5,
     "category": "interactive",
     "usage": "Use for single or multiple choice assessments",
     "reason": "Contains assessment-related keywords...",
     "templateData": {
       "templateName": "saq",
       "template": {...}
     }
   }
   ```
7. **Streaming:** Response streamed to frontend:
   ```json
   {
     "delta": "# Template Recommendations\n...",
     "type": "template_recommendations",
     "recommendations": [...],
     "actions": [...]
   }
   ```

### Detection Keywords
The system detects template requests containing:
- "create template"
- "suggest template"
- "recommend template"
- "what template"
- "which template"
- "template for"
- "show template"
- "list template"

### Response Format
```json
{
  "delta": "formatted markdown text",
  "type": "template_recommendations",
  "recommendations": [
    {
      "templateName": "saq",
      "score": 1.5,
      "category": "interactive",
      "usage": "Use for single or multiple choice assessments",
      "reason": "Contains assessment-related keywords...",
      "template": {...}
    }
  ],
  "actions": [
    {
      "type": "template_recommendation",
      "label": "Use saq Template",
      "templateName": "saq",
      "score": 1.5,
      "category": "interactive",
      "usage": "...",
      "reason": "...",
      "templateData": {...},
      "index": 0
    }
  ]
}
```

## Testing

### Run Integration Test
```bash
cd /Users/damodhar.meshram/cam/backend
node test-template-integration.js
```

### Expected Output
```
=== TEMPLATE DETECTION TESTS ===

Test 1: "create a template for a lesson about JavaScript arrays"
  → Template request: ✅ YES

Test 2: "suggest template for video lesson on photosynthesis"
  → Template request: ✅ YES

...

=== FULL WORKFLOW TEST ===

User Input: create a template for a lesson about JavaScript arrays with an interactive quiz
Conversation History: 3 messages

1. Getting recommendations...
   → Found 3 recommendations

2. Formatting recommendations...
   → Formatted text length: 978 chars

3. Getting template actions...
   → Generated 3 actions

--- TEMPLATE ACTIONS ---
1. Use saq Template
   Type: template_recommendation
   Template: saq
...

✅ Full workflow test completed successfully!
```

### Test API Endpoint
```bash
# Start server
cd /Users/damodhar.meshram/cam/backend
npm start

# In another terminal, test the chat endpoint
curl -X POST http://localhost:3000/api/turn/stream \
  -H "Content-Type: application/json" \
  -d '{
    "input_as_text": "create a template for a video lesson about photosynthesis",
    "sessionId": "test_session_123"
  }'
```

## Frontend Integration (Next Steps)

### 1. Update Chat Component
The frontend needs to handle the new response type:

```typescript
// In chat.component.ts
handleStreamChunk(chunk: any) {
  if (chunk.type === 'template_recommendations') {
    this.displayTemplateRecommendations(
      chunk.recommendations,
      chunk.actions
    );
  } else {
    // Handle regular content
  }
}

displayTemplateRecommendations(recommendations: any[], actions: any[]) {
  // Render template cards
  // Show scores, categories, usage
  // Add "Use This Template" buttons
}
```

### 2. Template Card UI
Create a component to display template recommendations:
- Template name with category badge
- Score visualization (stars or progress bar)
- Usage description
- Reason for recommendation
- "Use This Template" button
- "Preview Template" button

### 3. Template Selection
When user clicks "Use This Template":
- Extract template structure from `templateData.template`
- Populate with lesson-specific data
- Display in editor or preview modal
- Allow user to customize before saving

## Database Schema

Template recommendations are saved to MongoDB with metadata:

```javascript
{
  messageId: "msg_1234567890_assistant",
  content: "# Template Recommendations\n...",
  sender: "assistant",
  timestamp: new Date(),
  status: "sent",
  metadata: {
    type: "template_recommendations",
    recommendations: [...],
    actions: [...]
  }
}
```

## Configuration

### Enable/Disable Template Recommendations
In `/backend/server.js`, comment out the template detection block to disable:

```javascript
// Comment this block to disable template recommendations
// if (isTemplateCreationRequest(workflowInput.input_as_text)) {
//   ...
// }
```

### Adjust Detection Sensitivity
In `/backend/tools/templateIntegration.js`, modify the detection keywords:

```javascript
function isTemplateCreationRequest(message) {
  const templateKeywords = [
    'create template',
    'suggest template',
    // Add or remove keywords here
  ];
  ...
}
```

### Customize Recommendation Scoring
In `/backend/tools/templateRecommender.js`, adjust keyword weights:

```javascript
const keywordMapping = {
  video: ['video', 'watch', 'play'],  // Weight: 3.5
  quiz: ['quiz', 'test', 'assessment'],  // Weight: 3.5
  // Modify weights or add new keywords
};
```

## Status

✅ **COMPLETED:**
- Template detection in chat workflow
- Integration with streaming API
- Conversation history analysis
- Formatted markdown responses
- Action object generation
- Database persistence
- Comprehensive testing

🔄 **PENDING:**
- Frontend UI for template cards
- Template preview modal
- Template selection/application
- End-to-end UI testing

## Next Actions

1. **Update Frontend Chat Component**
   - Handle `template_recommendations` response type
   - Display template cards with scores and actions

2. **Create Template Card Component**
   - Visual design for recommendations
   - Interactive buttons (Use, Preview)

3. **Implement Template Preview**
   - Modal to show full template structure
   - Variable highlighting
   - Customization options

4. **Add Template Application Logic**
   - Populate template with lesson data
   - Save to course structure
   - Link to lesson editor

5. **End-to-End Testing**
   - Test full workflow from chat to template application
   - Verify database persistence
   - Validate template rendering

## References

- **Template Definitions:** `/backend/templates.json`
- **Recommendation Engine:** `/backend/tools/templateRecommender.js`
- **Chat Integration:** `/backend/tools/templateIntegration.js`
- **API Routes:** `/backend/tools/templateRoutes.js`
- **Main Server:** `/backend/server.js`
- **Documentation:** `/backend/TEMPLATE_RECOMMENDER_README.md`
- **Test Suite:** `/backend/test-template-integration.js`

---

**Implementation Date:** 2024
**Status:** Backend Integration Complete ✅
**Next Phase:** Frontend UI Development 🔄
