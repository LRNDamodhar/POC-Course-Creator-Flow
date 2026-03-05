# Backend Tools

This directory contains all the tool definitions and handlers used by the AI assistant.

## Structure

```
tools/
├── index.js              # Central export point for all tools
├── createCourseTool.js   # Course creation tool
└── README.md            # This file
```

## Available Tools

### 1. Create Course Tool (`createCourseTool.js`)

Creates a new course structure with title, description, and topic area.

**Exports:**
- `createCourseToolDefinition` - OpenAI function calling tool definition
- `executeCreateCourseTool(args)` - Execute the tool and return course data
- `getCourseActions()` - Get accept/reject actions for course
- `formatCourseContent(courseData)` - Format course data for display
- `isCourseCreationRequest(input)` - Detect if user wants to create a course

**Usage in server.js:**
```javascript
const {
  createCourseToolDefinition,
  executeCreateCourseTool,
  getCourseActions,
  formatCourseContent,
  isCourseCreationRequest
} = require('./tools');

// Check if course creation request
if (isCourseCreationRequest(input)) {
  // Use the tool
  const courseData = executeCreateCourseTool(args);
  const content = formatCourseContent(courseData);
  const actions = getCourseActions();
}
```

## Adding New Tools

To add a new tool:

1. **Create a new tool file** (e.g., `generateLessonTool.js`):

```javascript
const generateLessonToolDefinition = {
  type: "function",
  function: {
    name: "generate_lesson",
    description: "Generates a lesson for a course",
    parameters: {
      type: "object",
      properties: {
        lesson_title: {
          type: "string",
          description: "The title of the lesson"
        },
        // ... other properties
      },
      required: ["lesson_title"]
    }
  }
};

function executeGenerateLessonTool(args) {
  // Implementation
  return lessonData;
}

function isLessonGenerationRequest(input) {
  return input.toLowerCase().includes('create lesson');
}

module.exports = {
  generateLessonToolDefinition,
  executeGenerateLessonTool,
  isLessonGenerationRequest
};
```

2. **Export from index.js**:

```javascript
const {
  generateLessonToolDefinition,
  executeGenerateLessonTool,
  isLessonGenerationRequest
} = require('./generateLessonTool');

module.exports = {
  // ... existing exports
  generateLessonToolDefinition,
  executeGenerateLessonTool,
  isLessonGenerationRequest,
  
  allToolDefinitions: [
    createCourseToolDefinition,
    generateLessonToolDefinition // Add to array
  ],
  
  toolExecutors: {
    'create_course': executeCreateCourseTool,
    'generate_lesson': executeGenerateLessonTool // Add mapping
  },
  
  toolDetectors: {
    'create_course': isCourseCreationRequest,
    'generate_lesson': isLessonGenerationRequest // Add detector
  }
};
```

3. **Import and use in server.js**:

```javascript
const {
  generateLessonToolDefinition,
  executeGenerateLessonTool,
  isLessonGenerationRequest
} = require('./tools');
```

## Tool Definition Format

All tools use the OpenAI function calling format:

```javascript
{
  type: "function",
  function: {
    name: "tool_name",
    description: "What the tool does",
    parameters: {
      type: "object",
      properties: {
        param_name: {
          type: "string|number|boolean|array|object",
          description: "What this parameter is for"
        }
      },
      required: ["param_name"]
    }
  }
}
```

## Best Practices

1. **Keep tool files focused** - One tool per file
2. **Export helper functions** - Detection, formatting, actions
3. **Add JSDoc comments** - Document parameters and return types
4. **Use consistent naming** - `[action][Entity]Tool.js`
5. **Log tool execution** - Use `console.log('[Tool] ...')` for debugging
6. **Return structured data** - Consistent data shapes for frontend
7. **Include timestamps** - Add `created_at` or similar fields

## Tool Lifecycle

1. **Detection** - `isCourseCreationRequest(input)` checks user input
2. **Definition** - `createCourseToolDefinition` passed to OpenAI API
3. **OpenAI decides** - Model decides whether to call the tool
4. **Execution** - `executeCreateCourseTool(args)` processes the call
5. **Formatting** - `formatCourseContent(data)` creates display text
6. **Actions** - `getCourseActions()` provides user action buttons
7. **Response** - Data sent back to frontend with actions

## Integration Points

### Server.js Endpoints:
- `/api/turn/stream` - Detects and uses tools in streaming mode
- `/api/create-course` - Dedicated course creation endpoint
- `/api/action/accept` - Handles accept actions
- `/api/action/reject` - Handles reject actions

### Frontend:
- Receives `courseData` and `actions` in response
- Displays action buttons (accept/reject)
- Sends action requests back to server

## Testing Tools

To test a tool:

```bash
# From backend directory
node
> const { executeCreateCourseTool } = require('./tools');
> const result = executeCreateCourseTool({
    course_title: "Test Course",
    short_description: "A test course description",
    topic_area: "Testing"
  });
> console.log(result);
```

## Environment Variables

No additional environment variables needed for tools. They use the same OpenAI API key configured in `.env`.

## Future Enhancements

Possible tools to add:
- `generateLessonTool` - Generate individual lessons
- `createQuizTool` - Create quizzes for courses
- `generateAssessmentTool` - Create assessments
- `analyzeCourseStructureTool` - Analyze course structure
- `suggestImprovementsTool` - Suggest course improvements
