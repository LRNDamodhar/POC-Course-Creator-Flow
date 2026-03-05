/**
 * Create Course Outline Tool
 * 
 * This tool creates a detailed course outline with modules, lessons, and learning objectives.
 * Used when users want to structure a course with specific modules and lessons.
 */

// Tool definition in OpenAI function calling format
const createCourseOutlineToolDefinition = {
  type: "function",
  function: {
    name: "create_course_outline",
    description: "Creates a detailed course outline with modules, lessons, and learning objectives. Use this when the user wants to structure a course or create a curriculum with specific topics and modules.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        course_title: {
          type: "string",
          description: "The title of the course"
        },
        course_description: {
          type: "string",
          description: "A brief description of the course"
        },
        target_audience: {
          type: "string",
          description: "The target audience for this course (e.g., 'Beginners', 'Intermediate developers', 'Business professionals')"
        },
        duration: {
          type: "string",
          description: "Estimated duration of the course (e.g., '4 weeks', '10 hours', '3 months')"
        },
        modules: {
          type: "array",
          description: "Array of course modules",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              module_number: {
                type: "number",
                description: "Module number (1, 2, 3, etc.)"
              },
              module_title: {
                type: "string",
                description: "Title of the module"
              },
              module_description: {
                type: "string",
                description: "Brief description of what this module covers"
              },
              lessons: {
                type: "array",
                description: "Array of lessons within this module",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    lesson_number: {
                      type: "number",
                      description: "Lesson number within the module"
                    },
                    lesson_title: {
                      type: "string",
                      description: "Title of the lesson"
                    },
                    lesson_objectives: {
                      type: "array",
                      description: "Learning objectives for this lesson",
                      items: {
                        type: "string"
                      }
                    },
                    estimated_duration: {
                      type: "string",
                      description: "Estimated time to complete this lesson (e.g., '30 minutes', '1 hour')"
                    }
                  },
                  required: ["lesson_number", "lesson_title", "lesson_objectives", "estimated_duration"]
                }
              }
            },
            required: ["module_number", "module_title", "module_description", "lessons"]
          }
        }
      },
      required: ["course_title", "course_description", "target_audience", "duration", "modules"]
    }
  }
};

/**
 * Execute the create course outline tool
 * @param {Object} args - Tool arguments
 * @returns {Object} Course outline data object
 */
function executeCreateCourseOutlineTool(args) {
  console.log('[Tool] create_course_outline called with:', args);
  
  // Calculate total lessons
  const totalLessons = args.modules.reduce((total, module) => {
    return total + (module.lessons ? module.lessons.length : 0);
  }, 0);
  
  const courseOutline = {
    title: args.course_title,
    description: args.course_description,
    targetAudience: args.target_audience,
    duration: args.duration || 'Self-paced',
    totalModules: args.modules.length,
    totalLessons: totalLessons,
    modules: args.modules.map(module => ({
      moduleNumber: module.module_number,
      title: module.module_title,
      description: module.module_description || '',
      lessonsCount: module.lessons ? module.lessons.length : 0,
      lessons: module.lessons ? module.lessons.map(lesson => ({
        lessonNumber: lesson.lesson_number,
        title: lesson.lesson_title,
        objectives: lesson.lesson_objectives || [],
        duration: lesson.estimated_duration || 'Variable'
      })) : []
    })),
    created_at: new Date().toISOString(),
    status: 'outlined'
  };
  
  console.log('[Tool] Course outline created successfully:', {
    title: courseOutline.title,
    modules: courseOutline.totalModules,
    lessons: courseOutline.totalLessons
  });
  
  return courseOutline;
}

module.exports = {
  createCourseOutlineToolDefinition,
  executeCreateCourseOutlineTool
};
