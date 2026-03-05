# Lesson Info Stream API - Visual Examples

## Example 1: Simple Topic Extraction

### User Types:
```
"create a template for a quiz about JavaScript"
```

### Frontend Receives:
```json
{
  "type": "template_recommendations",
  "delta": "# Template Recommendations...",
  "recommendations": [
    {
      "templateName": "saq",
      "score": 3.5,
      "category": "interactive"
    }
  ],
  "actions": [...],
  "lessonInfo": {
    "topic": "JavaScript",           ← Extracted from "about JavaScript"
    "module": "Module",               ← Default value
    "lesson": "create a template for a quiz about JavaScript",
    "complexity": "intermediate",     ← Default (no keywords found)
    "learningObjective": null         ← Not specified
  }
}
```

### Frontend Can Use:
```typescript
// Auto-fill lesson form
this.lessonForm.setValue({
  title: chunk.lessonInfo.topic,     // "JavaScript"
  module: chunk.lessonInfo.module,   // "Module"
  level: chunk.lessonInfo.complexity // "intermediate"
});
```

---

## Example 2: With Complexity Detection

### User Types:
```
"create a beginner template for introduction to Python"
```

### Frontend Receives:
```json
{
  "lessonInfo": {
    "topic": "introduction to Python",  ← From "for X"
    "module": "Module",
    "lesson": "create a beginner template for introduction to Python",
    "complexity": "basic",              ← From "beginner" keyword ✨
    "learningObjective": null
  }
}
```

### User Types (Advanced):
```
"create an advanced template for machine learning"
```

### Frontend Receives:
```json
{
  "lessonInfo": {
    "topic": "machine learning",
    "module": "Module",
    "lesson": "create an advanced template for machine learning",
    "complexity": "advanced",           ← From "advanced" keyword ✨
    "learningObjective": null
  }
}
```

---

## Example 3: With Conversation Context

### Conversation Flow:
```
👤 User: "I'm working on Module 3: JavaScript Fundamentals"
🤖 Assistant: "Great! What would you like to create?"
👤 User: "create a template for a quiz"
```

### Frontend Receives:
```json
{
  "lessonInfo": {
    "topic": "quiz",
    "module": "3: javascript fundamentals", ← From conversation history ✨
    "lesson": "create a template for a quiz",
    "complexity": "intermediate",
    "learningObjective": null
  }
}
```

---

## Example 4: Full Context with Learning Objective

### Conversation Flow:
```
👤 User: "Topic: Data Structures"
🤖 Assistant: "What type of content would you like?"
👤 User: "Learning objective: Understand arrays and linked lists"
🤖 Assistant: "Great! What format?"
👤 User: "create a template"
```

### Frontend Receives:
```json
{
  "lessonInfo": {
    "topic": "data structures",                          ← From conversation
    "module": "Module",
    "lesson": "create a template",
    "complexity": "intermediate",
    "learningObjective": "understand arrays and linked lists" ← From conversation ✨
  }
}
```

---

## Example 5: Video Lesson

### User Types:
```
"suggest a template for a video lesson about photosynthesis"
```

### Frontend Receives:
```json
{
  "type": "template_recommendations",
  "recommendations": [
    {
      "templateName": "video",
      "score": 3.5,
      "category": "multimedia",
      "usage": "Use for video-based learning"
    }
  ],
  "lessonInfo": {
    "topic": "photosynthesis",        ← Extracted
    "module": "Module",
    "lesson": "suggest a template for a video lesson about photosynthesis",
    "complexity": "intermediate",
    "learningObjective": null
  }
}
```

### Frontend Auto-Fill Example:
```typescript
// Lesson creation form auto-filled:
Title: "photosynthesis"                    ← From topic
Module: "Module"                           ← From module
Type: "Video Lesson"                       ← From template recommendation
Complexity: "Intermediate"                 ← From complexity
Template: VIDEO template with variables    ← From recommendations
```

---

## Complexity Detection Keywords

| User Input Contains | Complexity Level |
|---------------------|------------------|
| "beginner", "basic", "introduction" | **basic** |
| "advanced", "expert", "complex" | **advanced** |
| (no keywords) | **intermediate** (default) |

### Examples:
- "create a **beginner** course" → `complexity: "basic"`
- "**advanced** machine learning" → `complexity: "advanced"`
- "create a quiz" → `complexity: "intermediate"` (default)

---

## Frontend Integration Patterns

### Pattern 1: Auto-Fill Form
```typescript
if (chunk.lessonInfo) {
  document.getElementById('topic').value = chunk.lessonInfo.topic;
  document.getElementById('module').value = chunk.lessonInfo.module;
  document.getElementById('complexity').value = chunk.lessonInfo.complexity;
}
```

### Pattern 2: Show Extracted Info
```html
<div class="extracted-info">
  <h4>📋 Detected Lesson Info:</h4>
  <p><strong>Topic:</strong> {{ lessonInfo.topic }}</p>
  <p><strong>Module:</strong> {{ lessonInfo.module }}</p>
  <p><strong>Complexity:</strong> {{ lessonInfo.complexity }}</p>
  <button (click)="confirmAndApply()">Use This Info</button>
</div>
```

### Pattern 3: Smart Template Population
```typescript
applyTemplate(template: any, lessonInfo: any) {
  // Replace template variables with lesson info
  const populatedTemplate = {
    ...template,
    title: lessonInfo.topic,
    module: lessonInfo.module,
    difficulty: lessonInfo.complexity,
    objective: lessonInfo.learningObjective || 'To be defined'
  };
  
  this.navigateToEditor(populatedTemplate);
}
```

---

## Database Storage

```javascript
// Stored in MongoDB
{
  messageId: "msg_1738012345_assistant",
  content: "# Template Recommendations...",
  sender: "assistant",
  timestamp: "2026-01-26T10:30:00.000Z",
  metadata: {
    type: "template_recommendations",
    recommendations: [...],
    actions: [...],
    lessonInfo: {                    ← Saved for future reference
      topic: "photosynthesis",
      module: "Module",
      lesson: "suggest a template for a video lesson about photosynthesis",
      complexity: "intermediate",
      learningObjective: null
    }
  }
}
```

---

## Complete Flow Diagram

```
User Input
    ↓
"create a template for an advanced quiz about JavaScript arrays"
    ↓
Backend: Extract Lesson Info
    ├─ Topic: "JavaScript arrays"           (from "about X")
    ├─ Module: "Module"                     (default)
    ├─ Lesson: (full message)
    ├─ Complexity: "advanced"               (from "advanced" keyword)
    └─ Learning Objective: null
    ↓
Backend: Get Template Recommendations
    ↓
Backend: Format Response
    ↓
Stream to Frontend (SSE)
    ↓
Frontend Receives:
    {
      type: "template_recommendations",
      recommendations: [SAQ, BINARYLIST],
      actions: ["Use saq Template", ...],
      lessonInfo: {
        topic: "JavaScript arrays",
        module: "Module",
        lesson: "...",
        complexity: "advanced",
        learningObjective: null
      }
    }
    ↓
Frontend: Auto-fill form with lessonInfo
Frontend: Display template cards
Frontend: User selects template
    ↓
Lesson Editor opens with:
    - Title: "JavaScript arrays"
    - Module: "Module"
    - Complexity: "Advanced"
    - Template: SAQ structure pre-loaded
```

---

## Testing

### Quick Test Command
```bash
node test-lesson-info-stream.js
```

### Expected Output
```
✅ Test 1: Video lesson with topic
   Topic: "photosynthesis" ✅
   Complexity: "intermediate" ✅

✅ Test 2: Quiz with module context
   Topic: "quiz" ✅
   Module: extracted from history ✅

✅ Test 3: Advanced lesson
   Topic: "machine learning" ✅
   Complexity: "advanced" ✅

✅ Test 4: Beginner lesson
   Topic: "introduction to Python" ✅
   Complexity: "basic" ✅

✅ Test 5: With learning objective
   Topic: "data structures" ✅
   Objective: extracted from history ✅
```

---

## Status

✅ **Feature Complete**  
✅ **All Tests Passing**  
✅ **Ready for Frontend Integration**  

---

**Next Step:** Update frontend chat component to use `lessonInfo` from stream chunks! 🚀
