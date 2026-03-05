/**
 * Tools Index
 * 
 * Central export point for all tools used in the application.
 * Import this file to access all available tools.
 */

const {
  createCourseToolDefinition,
  executeCreateCourseTool,
  getCourseActions,
  formatCourseContent,
  isCourseCreationRequest
} = require('./createCourseTool');

const {
  createCourseOutlineToolDefinition,
  executeCreateCourseOutlineTool
} = require('./createCourseOutlineTool');

const {
  createCourseAgentTool,
  createCourseOutlineAgentTool
} = require('./agentTools');

const {
  recommendTemplatesAgentTool,
  executeRecommendTemplatesTool
} = require('./templateAgentTool');

const {
  isTemplateCreationRequest,
  extractLessonInfo,
  getTemplateRecommendations,
  formatTemplateRecommendations,
  getTemplateActions
} = require('./templateIntegration');

// Export all tools
module.exports = {
  // Create Course Tool - OpenAI Format
  createCourseToolDefinition,
  executeCreateCourseTool,
  getCourseActions,
  formatCourseContent,
  isCourseCreationRequest,
  
  // Create Course Outline Tool
  createCourseOutlineToolDefinition,
  executeCreateCourseOutlineTool,
  
  // Agent SDK Tools
  createCourseAgentTool,
  createCourseOutlineAgentTool,
  recommendTemplatesAgentTool,
  
  // Array of all Agent SDK tool instances (for Agent configuration)
  agentTools: [
    createCourseAgentTool,
    createCourseOutlineAgentTool,
    recommendTemplatesAgentTool
  ],
  
  // Array of all tool definitions (for OpenAI API direct calls)
  allToolDefinitions: [
    createCourseToolDefinition,
    createCourseOutlineToolDefinition
  ],
  
  // Tool name to execution function mapping
  toolExecutors: {
    'create_course': executeCreateCourseTool,
    'create_course_outline': executeCreateCourseOutlineTool,
    'recommend_templates': executeRecommendTemplatesTool
  },
  
  // Tool detection functions
  toolDetectors: {
    'create_course': isCourseCreationRequest
  },
  
  // Template tools
  isTemplateCreationRequest,
  extractLessonInfo,
  getTemplateRecommendations,
  formatTemplateRecommendations,
  getTemplateActions
};
