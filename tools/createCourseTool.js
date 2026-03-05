/**
 * Create Course Tool
 * 
 * This tool creates a new course structure with title, description, and topic area.
 * Used when users want to create a new course.
 */

// Tool definition in OpenAI function calling format
const createCourseToolDefinition = {
  type: "function",
  function: {
    name: "create_course",
    description: "Creates a new course structure with title, short description, and topic area. Use this when the user wants to create a new course.",
    parameters: {
      type: "object",
      properties: {
        course_title: {
          type: "string",
          description: "The title of the course"
        },
        short_description: {
          type: "string",
          description: "A brief description of the course (2-3 sentences)"
        },
        topic_area: {
          type: "string",
          description: "The main topic area or subject of the course (e.g., 'Web Development', 'Machine Learning', 'Business Management')"
        }
      },
      required: ["course_title", "short_description", "topic_area"]
    }
  }
};

/**
 * Execute the create course tool
 * @param {Object} args - Tool arguments
 * @param {string} args.course_title - The title of the course
 * @param {string} args.short_description - Brief description of the course
 * @param {string} args.topic_area - Main topic area of the course
 * @returns {Object} Course data object
 */
function executeCreateCourseTool(args) {
  console.log('[Tool] create_course called with:', args);
  
  const courseData = {
    title: args.course_title,
    description: args.short_description,
    topicArea: args.topic_area,
    created_at: new Date().toISOString(),
    status: "draft"
  };
  
  console.log('[Tool] Course created:', courseData);
  return courseData;
}

/**
 * Get the actions available after course creation
 * @returns {Array} Array of action button configurations
 */
function getCourseActions() {
  return [
    {
      type: "accept",
      label: "Accept Course",
      description: "Accept and save this course"
    },
    {
      type: "reject",
      label: "Reject",
      description: "Reject and modify the course details"
    }
  ];
}

/**
 * Format course data for display
 * @param {Object} courseData - Course data object
 * @returns {string} Formatted course content
 */
function formatCourseContent(courseData) {
  return `I've created a course for you:\n\n**${courseData.title}**\n\n${courseData.description}\n\n**Topic Area:** ${courseData.topicArea}`;
}

/**
 * Detect if user input is requesting course creation
 * @param {string} input - User input text
 * @returns {boolean} True if course creation is detected
 */
function isCourseCreationRequest(input) {
  const lowerInput = input.toLowerCase();
  return lowerInput.includes('create course') || 
         lowerInput.includes('create a course') ||
         lowerInput.includes('new course') ||
         lowerInput.includes('make a course') ||
         lowerInput.includes('design a course') ||
         lowerInput.includes('build a course');
}

module.exports = {
  createCourseToolDefinition,
  executeCreateCourseTool,
  getCourseActions,
  formatCourseContent,
  isCourseCreationRequest
};
