/**
 * Template Recommender Agent Tool
 * 
 * This tool allows the AI agent to recommend templates based on topic, lesson, and module.
 * The agent will automatically call this tool when users ask for template recommendations.
 */

const { tool } = require('@openai/agents');
const { recommendTemplates } = require('./templateRecommender');
const { getTemplateDisplayName } = require('../db/service');

/**
 * Get user-friendly match quality label
 */
function getMatchQuality(score) {
  if (score >= 5) return { label: 'Excellent Match', stars: '⭐⭐⭐⭐⭐', emoji: '🎯' };
  if (score >= 3) return { label: 'Very Good Match', stars: '⭐⭐⭐⭐', emoji: '✨' };
  if (score >= 2) return { label: 'Good Match', stars: '⭐⭐⭐', emoji: '👍' };
  if (score >= 1) return { label: 'Fair Match', stars: '⭐⭐', emoji: '👌' };
  return { label: 'Basic Match', stars: '⭐', emoji: '📝' };
}

/**
 * Recommend Templates Tool for Agent SDK
 * 
 * This tool is called by the agent when users ask for template recommendations.
 * The agent will extract topic, lesson, and module information and pass them to this tool.
 */
const recommendTemplatesAgentTool = tool({
  name: 'recommend_templates',
  description: `Recommends learning content templates based on lesson context. 
  
  WHEN TO USE THIS TOOL:
  - User asks to "create template", "suggest template", "recommend template", "add template"
  - User asks "what template should I use"
  - User wants to know which template fits their lesson
  - User mentions creating content for a specific topic, lesson, or module
  
  EXAMPLES:
  - "create a template for this lesson"
  - "suggest a template for a video lesson about photosynthesis"
  - "what template should I use for a quiz"
  - "add template for JavaScript arrays"
  - "I need a template for Module 3"
  
  This tool analyzes the lesson context and returns the best matching templates with scores and reasons.`,
  
  parameters: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'The main topic or subject of the lesson (e.g., "JavaScript arrays", "Photosynthesis", "Machine Learning"). Extract from user message or conversation context.'
      },
      lesson: {
        type: 'string',
        description: 'The lesson description or title. If not explicitly mentioned, use the user\'s full request as the lesson description.'
      },
      module: {
        type: 'string',
        description: 'The module name or number (e.g., "Module 3", "Introduction to Programming"). If not mentioned, use "General Module".'
      },
      complexity: {
        type: 'string',
        enum: ['basic', 'intermediate', 'advanced'],
        description: 'The difficulty level. Use "basic" for beginner/introduction content, "advanced" for expert content, "intermediate" as default.'
      }
    },
    required: ['topic', 'lesson', 'module', 'complexity'],
    additionalProperties: false
  },
  
  execute: async (args) => {
    try {
      console.log('[Template Tool] ===== RECOMMEND_TEMPLATES TOOL CALLED =====');
      console.log('[Template Tool] Input args:', JSON.stringify(args, null, 2));
      
      // Prepare lesson info for template recommender
      const lessonInfo = {
        topic: args.topic || 'General Topic',
        lesson: args.lesson || 'Lesson',
        module: args.module || 'General Module',
        complexity: args.complexity || 'intermediate',
        learningObjective: ''
      };
      
      // Add content_type to lesson description for better matching
      if (args.content_type) {
        lessonInfo.lesson = `${args.content_type} ${lessonInfo.lesson}`;
      }
      
      console.log('[Template Tool] Processed lesson info:', lessonInfo);
      
      // Get template recommendations
      const recommendations = recommendTemplates(lessonInfo);
      
      console.log('[Template Tool] Found recommendations:', recommendations.recommendations?.length || 0);
      
      // Format response for the agent - simplified, no technical details
      let response = `# Template Recommendations for "${args.topic}"\n\n`;
      
      if (recommendations.recommendations && recommendations.recommendations.length > 0) {
        response += `I found ${recommendations.recommendations.length} suitable template(s) for this lesson:\n\n`;
        
        recommendations.recommendations.forEach((template, index) => {
          const displayName = getTemplateDisplayName(template.templateName, template.category);
          
          response += `## ${index + 1}. ${displayName}\n`;
          // Removed: Match Quality stars and emoji
          response += `**Category:** ${template.category}\n`;
          response += `**Best For:** ${template.usage}\n`;
          response += `**Why This Template:** ${template.reason}\n\n`;
          
          // Removed: Template Structure preview (too technical)
          
          response += `\n---\n\n`;
        });
        
        response += `\n**How to use:**\n`;
        response += `1. Choose the template that best fits your needs\n`;
        response += `2. The template will be automatically populated with your lesson content\n`;
        response += `3. You can customize the template to match your specific requirements\n\n`;
        
        // Add metadata for frontend
        response += `\n<!-- TEMPLATE_DATA:${JSON.stringify({
          topic: args.topic,
          module: args.module,
          lesson: args.lesson,
          recommendations: recommendations.recommendations.map(r => ({
            templateName: r.templateName,
            score: r.score,
            category: r.category
          }))
        })} -->`;
        
      } else {
        response += `No specific templates matched your criteria. Here are general suggestions:\n\n`;
        response += `- **SAQ Template**: Best for assessments and quizzes\n`;
        response += `- **VIDEO Template**: Best for video-based content\n`;
        response += `- **TEXTGRAPHIC Template**: Best for text with images\n`;
        response += `- **CONSULT Template**: Best for case studies and scenarios\n\n`;
      }
      
      console.log('[Template Tool] Response length:', response.length);
      console.log('[Template Tool] ===== TOOL SUCCESS =====');
      
      return response;
      
    } catch (error) {
      console.error('[Template Tool] ===== TOOL ERROR =====');
      console.error('[Template Tool] Error:', error);
      
      return `I encountered an error while recommending templates: ${error.message}. Please try rephrasing your request with more details about the topic and lesson type.`;
    }
  }
});

/**
 * Execute template recommendation (used for manual invocation)
 */
function executeRecommendTemplatesTool(args) {
  const lessonInfo = {
    topic: args.topic || 'General Topic',
    lesson: args.lesson || 'Lesson',
    module: args.module || 'General Module',
    complexity: args.complexity || 'intermediate',
    learningObjective: ''
  };
  
  if (args.content_type) {
    lessonInfo.lesson = `${args.content_type} ${lessonInfo.lesson}`;
  }
  
  return recommendTemplates(lessonInfo);
}

module.exports = {
  recommendTemplatesAgentTool,
  executeRecommendTemplatesTool
};
