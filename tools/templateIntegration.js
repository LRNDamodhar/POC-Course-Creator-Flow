/**
 * Template Recommender Tool Integration
 * Detects template creation requests and recommends appropriate templates
 */

const { recommendTemplates } = require('./templateRecommender');
const { generateFilledTemplate } = require('./templatePopulator');
const { generateAIFilledTemplate } = require('./aiTemplatePopulator');
const { getTemplateDisplayName } = require('../db/service');

/**
 * Check if the user message is requesting template creation
 */
function isTemplateCreationRequest(message) {
  const lowerMessage = message.toLowerCase();
  
  const templateKeywords = [
    'create template',
    'generate template',
    'suggest template',
    'recommend template',
    'what template',
    'which template',
    'template for',
    'need template',
    'show template',
    'find template',
    'best template'
  ];
  
  return templateKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Extract lesson information from the message
 */
function extractLessonInfo(message, conversationHistory = []) {
  // Try to extract topic, module, and lesson from the current message
  const info = {
    topic: '',
    module: '',
    lesson: message,
    learningObjective: '',
    complexity: 'intermediate'
  };
  
  // Check previous messages for context
  if (conversationHistory.length > 0) {
    const recentMessages = conversationHistory.slice(-5).map(msg => {
      if (typeof msg === 'string') return msg;
      if (msg.content) {
        if (Array.isArray(msg.content)) {
          return msg.content.map(c => c.text || '').join(' ');
        }
        return msg.content;
      }
      return '';
    }).join(' ').toLowerCase();
    
    // Try to find topic mentions
    const topicMatch = recentMessages.match(/topic[:\s]+([^.,\n]+)/i);
    if (topicMatch) info.topic = topicMatch[1].trim();
    
    // Try to find module mentions
    const moduleMatch = recentMessages.match(/module[:\s]+([^.,\n]+)/i);
    if (moduleMatch) info.module = moduleMatch[1].trim();
    
    // Try to find learning objective
    const objectiveMatch = recentMessages.match(/objective[:\s]+([^.,\n]+)/i);
    if (objectiveMatch) info.learningObjective = objectiveMatch[1].trim();
  }
  
  // Try to extract from current message if not found
  if (!info.topic) {
    const topicMatch = message.match(/topic[:\s]+([^.,\n]+)/i) || 
                       message.match(/about[:\s]+([^.,\n]+)/i) ||
                       message.match(/for[:\s]+([^.,\n]+)/i);
    if (topicMatch) info.topic = topicMatch[1].trim();
  }
  
  if (!info.module) {
    const moduleMatch = message.match(/module[:\s]+([^.,\n]+)/i);
    if (moduleMatch) info.module = moduleMatch[1].trim();
  }
  
  // Detect complexity from keywords
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('beginner') || lowerMessage.includes('basic') || lowerMessage.includes('introduction')) {
    info.complexity = 'basic';
  } else if (lowerMessage.includes('advanced') || lowerMessage.includes('expert') || lowerMessage.includes('complex')) {
    info.complexity = 'advanced';
  }
  
  return info;
}

/**
 * Get template recommendations
 */
function getTemplateRecommendations(message, conversationHistory = [], selectedContext = {}) {
  const lessonInfo = extractLessonInfo(message, conversationHistory);
  
  // Merge with selected context from frontend (selectedContext takes priority)
  if (selectedContext.topic) {
    lessonInfo.topic = selectedContext.topic;
    console.log('[Template Integration] Using selected topic:', selectedContext.topic);
  }
  
  if (selectedContext.lesson) {
    lessonInfo.lesson = selectedContext.lesson;
    console.log('[Template Integration] Using selected lesson:', selectedContext.lesson);
  }
  
  if (selectedContext.module) {
    lessonInfo.module = selectedContext.module;
    console.log('[Template Integration] Using selected module:', selectedContext.module);
  }
  
  // If we don't have a topic, use a generic one
  if (!lessonInfo.topic) {
    lessonInfo.topic = 'General Learning Content';
  }
  
  if (!lessonInfo.module) {
    lessonInfo.module = 'Module';
  }
  
  const recommendations = recommendTemplates(lessonInfo);
  
  return {
    ...recommendations,
    extractedInfo: lessonInfo
  };
}

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
 * Format template recommendations for display
 */
function formatTemplateRecommendations(recommendations) {
  const { input, recommendations: templates, totalTemplatesAvailable } = recommendations;
  
  let response = `# Template Recommendation\n\n`;
  
  // Don't show analyzed content details to users
  // Removed: Topic, Module, Lesson, Complexity details
  
  // For single template (which is now the default)
  if (templates.length === 1) {
    const template = templates[0];
    // Don't show match quality or best match label
    // Just show the template exists
    const displayName = getTemplateDisplayName(template.templateName, template.category);
    response += `I've selected a template for this lesson.\n\n`;
    response += `**Template:** ${displayName}\n`;
    response += `**Category:** ${template.category}  \n`;
    response += `**Why this template?** ${template.reason}  \n`;
    response += `**How to use it:** ${template.usage}  \n\n`;
  } else if (templates.length > 1) {
    // Fallback for multiple templates (shouldn't happen now)
    response += `## Available Templates (${templates.length})\n\n`;
    templates.forEach((template, index) => {
      const displayName = getTemplateDisplayName(template.templateName, template.category);
      response += `### ${index + 1}. ${displayName}\n`;
      response += `**Category:** ${template.category}  \n`;
      response += `**Why:** ${template.reason}  \n`;
      response += `**Usage:** ${template.usage}  \n\n`;
    });
  } else {
    // No templates
    response += `## Default Recommendation\n\n`;
    response += `No specific templates matched your criteria. Here are some general suggestions:\n`;
    response += `- For assessments, use **SAQ** template\n`;
    response += `- For video content, use **VIDEO** template\n`;
    response += `- For text content, use **TEXTGRAPHIC** template\n`;
  }
  
  // Don't show total templates available
  
  return response;
}

/**
 * Get template actions for frontend
 */
async function getTemplateActions(recommendations) {
  const actions = [];
  
  if (recommendations.recommendations && recommendations.recommendations.length > 0) {
    // Generate AI-filled templates for all recommendations
    const templatePromises = recommendations.recommendations.map(async (template, index) => {
      // Generate AI-filled template JSON for this recommendation
      let filledTemplate = null;
      try {
        const lessonInfo = recommendations.extractedInfo || recommendations.input;
        
        // Try AI-powered template filling first
        console.log(`[Template Integration] Generating AI-filled content for ${template.templateName}...`);
        filledTemplate = await generateAIFilledTemplate({
          templateName: template.templateName,
          templateStructure: template.template,
          topic: lessonInfo.topic || '',
          module: lessonInfo.module || '',
          lesson: lessonInfo.lesson || '',
          complexity: lessonInfo.complexity || 'intermediate'
        });
        
        console.log(`[Template Integration] ✓ Successfully generated AI content for ${template.templateName}`);
      } catch (error) {
        console.error(`[Template Integration] AI generation failed, using basic filling:`, error.message);
        
        // Fallback to basic template filling
        try {
          const lessonInfo = recommendations.extractedInfo || recommendations.input;
          filledTemplate = generateFilledTemplate({
            templateName: template.templateName,
            topic: lessonInfo.topic,
            lesson: lessonInfo.lesson,
            module: lessonInfo.module,
            complexity: lessonInfo.complexity
          });
          console.log(`[Template Integration] Generated basic filled JSON for ${template.templateName}`);
        } catch (fallbackError) {
          console.error(`[Template Integration] Fallback generation also failed:`, fallbackError.message);
        }
      }
      
      return {
        type: 'template_recommendation',
        label: `Use ${template.templateName} Template`,
        templateName: template.templateName,
        score: template.score,
        category: template.category,
        usage: template.usage,
        reason: template.reason,
        templateData: {
          templateName: template.templateName,
          template: template.template,
          filledTemplate: filledTemplate  // Add AI-filled JSON
        },
        lessonInfo: recommendations.extractedInfo || recommendations.input,
        index: index
      };
    });

    // Wait for all AI template generation to complete
    const generatedActions = await Promise.all(templatePromises);
    actions.push(...generatedActions);
    
    // Add Accept and Reject buttons with lesson info
    const lessonInfo = recommendations.extractedInfo || recommendations.input;
    
    actions.push({
      type: 'accept',
      label: 'Accept',
      description: 'Accept these template recommendations',
      lessonInfo: lessonInfo  // Include lesson info for linking
    });
    
    actions.push({
      type: 'reject',
      label: 'Reject',
      description: 'Reject and request different templates'
    });
  }
  
  return actions;
}

module.exports = {
  isTemplateCreationRequest,
  extractLessonInfo,
  getTemplateRecommendations,
  formatTemplateRecommendations,
  getTemplateActions
};
