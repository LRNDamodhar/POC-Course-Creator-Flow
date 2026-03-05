/**
 * Agent SDK Tool Wrapper for Create Course
 * 
 * This file provides the tool in the format required by @openai/agents SDK
 * The Agent SDK expects tools to be created using the 'tool' helper function
 */

const { tool } = require('@openai/agents');

// Import the base tool logic
const {
  executeCreateCourseTool
} = require('./createCourseTool');

const {
  executeCreateCourseOutlineTool
} = require('./createCourseOutlineTool');

/**
 * Create Course Tool for Agent SDK
 * Using the tool() helper from @openai/agents SDK
 */
const createCourseAgentTool = tool({
  name: 'create_course',
  description: 'Creates a new course with structured information. ALWAYS use this tool when the user asks to create, make, or generate a course. Required parameters: course_title, short_description, topic_area.',
  parameters: {
    type: 'object',
    properties: {
      course_title: {
        type: 'string',
        description: 'The title of the course'
      },
      short_description: {
        type: 'string',
        description: 'A brief description of the course (2-3 sentences)'
      },
      topic_area: {
        type: 'string',
        description: 'The main topic area or subject of the course (e.g., Web Development, Machine Learning)'
      }
    },
    required: ['course_title', 'short_description', 'topic_area'],
    additionalProperties: false
  },
  // The SDK expects 'execute' not 'handler'
  execute: async (args) => {
    try {
      console.log('[Tool Execute] ===== TOOL CALLED =====');
      console.log('[Tool Execute] create_course called with:', JSON.stringify(args, null, 2));
      
      const result = executeCreateCourseTool(args);
      console.log('[Tool Execute] create_course result:', JSON.stringify(result, null, 2));
      console.log('[Tool Execute] ===== TOOL SUCCESS =====');
      
      return JSON.stringify(result);
    } catch (error) {
      console.error('[Tool Execute] ===== TOOL ERROR =====');
      console.error('[Tool Execute] Error:', error);
      throw error;
    }
  }
});

/**
 * Create Course Outline Tool for Agent SDK
 * Creates detailed course structure with modules and lessons
 */
const createCourseOutlineAgentTool = tool({
  name: 'create_course_outline',
  description: 'Creates a detailed course outline with modules, lessons, and learning objectives. Use this when the user wants to structure a course curriculum with specific modules, lessons, and learning paths.',
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      course_title: {
        type: 'string',
        description: 'The title of the course'
      },
      course_description: {
        type: 'string',
        description: 'A brief description of the course'
      },
      target_audience: {
        type: 'string',
        description: 'The target audience (e.g., Beginners, Intermediate, Advanced)'
      },
      duration: {
        type: 'string',
        description: 'Estimated course duration (e.g., 4 weeks, 10 hours)'
      },
      modules: {
        type: 'array',
        description: 'Array of course modules with lessons',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            module_number: {
              type: 'number',
              description: 'Module number'
            },
            module_title: {
              type: 'string',
              description: 'Module title'
            },
            module_description: {
              type: 'string',
              description: 'Module description'
            },
            lessons: {
              type: 'array',
              description: 'Array of lessons within this module',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  lesson_number: {
                    type: 'number',
                    description: 'Lesson number within the module'
                  },
                  lesson_title: {
                    type: 'string',
                    description: 'Title of the lesson'
                  },
                  lesson_objectives: {
                    type: 'array',
                    description: 'Learning objectives for this lesson',
                    items: {
                      type: 'string'
                    }
                  },
                  estimated_duration: {
                    type: 'string',
                    description: 'Estimated time to complete this lesson'
                  }
                },
                required: ['lesson_number', 'lesson_title', 'lesson_objectives', 'estimated_duration']
              }
            }
          },
          required: ['module_number', 'module_title', 'module_description', 'lessons']
        }
      }
    },
    required: ['course_title', 'course_description', 'target_audience', 'duration', 'modules']
  },
  execute: async (args) => {
    try {
      console.log('[Tool Execute] ===== CREATE COURSE OUTLINE CALLED =====');
      console.log('[Tool Execute] create_course_outline args:', JSON.stringify(args, null, 2));
      
      const result = executeCreateCourseOutlineTool(args);
      console.log('[Tool Execute] create_course_outline result:', JSON.stringify(result, null, 2));
      console.log('[Tool Execute] ===== OUTLINE TOOL SUCCESS =====');
      
      return JSON.stringify(result);
    } catch (error) {
      console.error('[Tool Execute] ===== OUTLINE TOOL ERROR =====');
      console.error('[Tool Execute] Error:', error);
      throw error;
    }
  }
});

module.exports = {
  createCourseAgentTool,
  createCourseOutlineAgentTool,
  executeCreateCourseTool,  // Export handler for manual execution if needed
  executeCreateCourseOutlineTool
};
