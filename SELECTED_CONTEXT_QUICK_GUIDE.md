# 📋 Selected Context - Quick Frontend Guide

## ✅ Feature Ready!

The backend now accepts **selectedTopic**, **selectedLesson**, and **selectedModule** from the frontend. These values **override** auto-extraction.

---

## 🚀 Quick Start

### Basic Request (Before)
```typescript
{
  input: "create a template",
  sessionId: "session_123"
}
```

### Enhanced Request (Now)
```typescript
{
  input: "create a template",
  sessionId: "session_123",
  selectedTopic: "React Hooks",        // NEW - Optional
  selectedLesson: "useEffect Guide",   // NEW - Optional
  selectedModule: "Module 3"           // NEW - Optional
}
```

---

## 🎯 Priority Rules

1. **selectedTopic** provided → Use it (ignore extraction)
2. **selectedLesson** provided → Use it (ignore extraction)
3. **selectedModule** provided → Use it (ignore extraction)
4. **Not provided** → Auto-extract from message

**Partial context works!** You can provide only topic, or only module, etc.

---

## 💻 Frontend Code Examples

### Example 1: Dropdowns
```typescript
// chat.component.ts
export class ChatComponent {
  selectedTopic: string = '';
  selectedLesson: string = '';
  selectedModule: string = '';
  
  sendMessage() {
    const payload: any = {
      input: this.userMessage,
      sessionId: this.currentSessionId
    };
    
    // Add only if user selected something
    if (this.selectedTopic) payload.selectedTopic = this.selectedTopic;
    if (this.selectedLesson) payload.selectedLesson = this.selectedLesson;
    if (this.selectedModule) payload.selectedModule = this.selectedModule;
    
    this.chatService.streamChat(payload).subscribe(chunk => {
      this.handleChunk(chunk);
    });
  }
}
```

```html
<!-- chat.component.html -->
<div class="context-selectors">
  <select [(ngModel)]="selectedTopic">
    <option value="">Auto-detect topic</option>
    <option value="JavaScript">JavaScript</option>
    <option value="React">React</option>
    <option value="Python">Python</option>
  </select>
  
  <select [(ngModel)]="selectedModule">
    <option value="">Auto-detect module</option>
    <option value="Module 1">Module 1</option>
    <option value="Module 2">Module 2</option>
  </select>
</div>
```

### Example 2: From Course Context
```typescript
// lesson-builder.component.ts
createTemplateForLesson(lesson: Lesson) {
  const payload = {
    input: "create a template for this lesson",
    sessionId: this.sessionId,
    selectedTopic: lesson.topic,          // From lesson object
    selectedLesson: lesson.title,         // From lesson object
    selectedModule: lesson.moduleTitle    // From lesson object
  };
  
  this.chatService.streamChat(payload);
}
```

### Example 3: Chat Service Update
```typescript
// chat.service.ts
export interface ChatContext {
  selectedTopic?: string;
  selectedLesson?: string;
  selectedModule?: string;
}

streamChat(input: string, sessionId: string, context?: ChatContext) {
  const body: any = { input, sessionId };
  
  if (context) {
    if (context.selectedTopic) body.selectedTopic = context.selectedTopic;
    if (context.selectedLesson) body.selectedLesson = context.selectedLesson;
    if (context.selectedModule) body.selectedModule = context.selectedModule;
  }
  
  return this.http.post('/api/turn/stream', body, {
    responseType: 'text'
  });
}
```

---

## 📊 Example Flow

### Scenario: User Building Course

1. **User navigates to:** `/course/123/lesson/456/template`
2. **Component loads lesson context:**
   ```typescript
   ngOnInit() {
     this.lessonService.getLesson(this.lessonId).subscribe(lesson => {
       this.selectedTopic = lesson.topic;        // "React Hooks"
       this.selectedModule = lesson.moduleTitle; // "Module 3: Advanced"
     });
   }
   ```

3. **User types:** "create a template"

4. **Frontend sends:**
   ```json
   {
     "input": "create a template",
     "sessionId": "session_abc123",
     "selectedTopic": "React Hooks",
     "selectedModule": "Module 3: Advanced"
   }
   ```

5. **Backend responds with lessonInfo:**
   ```json
   {
     "type": "template_recommendations",
     "lessonInfo": {
       "topic": "React Hooks",           ← From selected
       "module": "Module 3: Advanced",   ← From selected
       "lesson": "create a template",    ← From message
       "complexity": "intermediate"
     },
     "recommendations": [...]
   }
   ```

---

## 🎨 UI Suggestions

### Show Selected Context
```html
<div *ngIf="hasSelectedContext()" class="context-badge">
  <span>📌 Using:</span>
  <span *ngIf="selectedTopic" class="badge">{{selectedTopic}}</span>
  <span *ngIf="selectedModule" class="badge">{{selectedModule}}</span>
  <button (click)="clearContext()">×</button>
</div>
```

### Context Panel
```html
<div class="context-panel">
  <h4>Lesson Context (Optional)</h4>
  <p>Select to override auto-detection</p>
  
  <div class="form-group">
    <label>Topic</label>
    <input [(ngModel)]="selectedTopic" placeholder="Leave empty for auto-detect">
  </div>
  
  <div class="form-group">
    <label>Lesson</label>
    <input [(ngModel)]="selectedLesson" placeholder="Leave empty for auto-detect">
  </div>
  
  <div class="form-group">
    <label>Module</label>
    <input [(ngModel)]="selectedModule" placeholder="Leave empty for auto-detect">
  </div>
</div>
```

---

## ✅ Testing

### Test 1: With Selected Context
```typescript
it('should send selected context', () => {
  const payload = {
    input: 'create template',
    sessionId: 'test_123',
    selectedTopic: 'JavaScript',
    selectedModule: 'Module 1'
  };
  
  chatService.streamChat(payload).subscribe();
  
  const req = httpMock.expectOne('/api/turn/stream');
  expect(req.request.body.selectedTopic).toBe('JavaScript');
  expect(req.request.body.selectedModule).toBe('Module 1');
});
```

### Test 2: Without Selected Context
```typescript
it('should work without selected context', () => {
  const payload = {
    input: 'create template',
    sessionId: 'test_123'
  };
  
  chatService.streamChat(payload).subscribe();
  
  const req = httpMock.expectOne('/api/turn/stream');
  expect(req.request.body.selectedTopic).toBeUndefined();
});
```

---

## 🔍 Debugging

### Check Request in DevTools
```javascript
// Network tab → Payload
{
  "input": "create template",
  "sessionId": "session_123",
  "selectedTopic": "React Hooks",      // Should see this
  "selectedModule": "Module 3"          // Should see this
}
```

### Check Server Logs
```
[Backend] Selected context received: {
  topic: 'React Hooks',
  lesson: undefined,
  module: 'Module 3'
}
[Template Integration] Using selected topic: React Hooks
[Template Integration] Using selected module: Module 3
```

---

## 📦 Complete TypeScript Interface

```typescript
// models/chat.model.ts
export interface ChatRequest {
  input: string;              // Required
  sessionId: string;          // Required
  selectedTopic?: string;     // Optional - override topic
  selectedLesson?: string;    // Optional - override lesson
  selectedModule?: string;    // Optional - override module
}

export interface LessonInfo {
  topic: string | null;
  lesson: string | null;
  module: string | null;
  complexity: 'basic' | 'intermediate' | 'advanced' | null;
  learningObjective: string | null;
}

export interface TemplateRecommendation {
  type: 'template_recommendations';
  delta: string;
  recommendations: any[];
  actions: any[];
  lessonInfo: LessonInfo;
}
```

---

## 🎯 Implementation Checklist

- [ ] Add `selectedTopic` input field or dropdown
- [ ] Add `selectedLesson` input field or dropdown
- [ ] Add `selectedModule` input field or dropdown
- [ ] Update `ChatService.streamChat()` to include selected context
- [ ] Display selected context in UI (optional)
- [ ] Add "Clear context" button (optional)
- [ ] Auto-populate from course/lesson context if available
- [ ] Test with selected context
- [ ] Test without selected context
- [ ] Verify lessonInfo in response matches selected values

---

## 📞 Support

**Backend Endpoint:** `POST /api/turn/stream`  
**Test Script:** `backend/test-selected-context.js`  
**Documentation:** `backend/SELECTED_CONTEXT_FEATURE.md`  

**Status:** ✅ Ready to use!

---

**Quick Summary:**
- Add `selectedTopic`, `selectedLesson`, `selectedModule` to your chat request
- All fields are **optional**
- Selected values **override** auto-extraction
- Works with partial context (e.g., only topic)
- Response includes final `lessonInfo` with your selected values
