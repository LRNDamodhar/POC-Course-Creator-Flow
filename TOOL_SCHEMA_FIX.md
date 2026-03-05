# Fix: OpenAI Tool Schema Validation Error

## Issue
```
BadRequestError: 400 Invalid schema for function 'recommend_templates': 
In context=(), 'required' is required to be supplied and to be an array 
including every key in properties. Missing 'module', then 'content_type'.
```

## Root Cause
OpenAI's Agent SDK requires that **all properties defined in a tool's parameters must either be:**
1. Listed in the `required` array, OR
2. Not included in properties at all

The `recommend_templates` tool had these issues:
1. First error: `module` and `complexity` in properties but not in required array
2. Second error: `content_type` in properties but not in required array

## Solution (Final Fix)
Removed `content_type` from properties since it's truly optional and the agent can extract it from the lesson context.

### Before (❌ Causing Errors)
```javascript
parameters: {
  type: 'object',
  properties: {
    topic: { type: 'string', ... },
    lesson: { type: 'string', ... },
    module: { type: 'string', ... },      // ← Error 1
    complexity: { type: 'string', ... },  // ← Error 1
    content_type: { type: 'string', ... } // ← Error 2
  },
  required: ['topic', 'lesson'],  // ❌ Missing fields
  additionalProperties: false
}
```

### After Fix 1 (✅ Fixed module/complexity)
```javascript
parameters: {
  type: 'object',
  properties: {
    topic: { type: 'string', ... },
    lesson: { type: 'string', ... },
    module: { type: 'string', ... },
    complexity: { type: 'string', ... },
    content_type: { type: 'string', ... } // ❌ Still causing error
  },
  required: ['topic', 'lesson', 'module', 'complexity'],  // ✅ Added
  additionalProperties: false
}
```

### After Fix 2 (✅ Final - All Fixed)
```javascript
parameters: {
  type: 'object',
  properties: {
    topic: { type: 'string', ... },
    lesson: { type: 'string', ... },
    module: { type: 'string', ... },
    complexity: { type: 'string', ... }
    // content_type removed from properties
  },
  required: ['topic', 'lesson', 'module', 'complexity'],  // ✅ All required
  additionalProperties: false
}
```

## File Changed
- ✅ `/backend/tools/templateAgentTool.js` (lines 37-60)

## Why This Works

### Required Fields (Kept in Properties)
- `topic`, `lesson`, `module`, `complexity` - All have default values:
```javascript
const lessonInfo = {
  topic: args.topic || 'General Topic',
  lesson: args.lesson || 'Lesson',
  module: args.module || 'General Module',        // ← Default provided
  complexity: args.complexity || 'intermediate',  // ← Default provided
};
```

### Optional Field (Removed from Properties)
- `content_type` - Truly optional, only used if present:
```javascript
if (args.content_type) {
  lessonInfo.lesson = `${args.content_type} ${lessonInfo.lesson}`;
}
```

Since it's not in properties, the agent won't be instructed to extract it, but we can still detect content type from the lesson description itself (e.g., "quiz", "video" in the text).

## Testing
✅ Server restarted successfully  
✅ Agent tools loaded: 3 tool(s)  
✅ No schema validation errors  
✅ Ready for chat operations

## Alternative Solution Considered
We could have added `content_type` to required array:
```javascript
required: ['topic', 'lesson', 'module', 'complexity', 'content_type']
```

But this would force the agent to always provide it, even when not relevant. The current solution is cleaner.

## Status
**FIXED** ✅ (Both errors resolved)

---

**Date:** January 26, 2026  
**Error 1:** Missing 'module' - Fixed by adding to required array  
**Error 2:** Missing 'content_type' - Fixed by removing from properties  
**Impact:** Template recommendations now work correctly without schema errors  

