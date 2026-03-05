/**
 * Smart Recommendations System
 * Provides contextual follow-up action recommendations based on the conversation context
 */

/**
 * Generate contextual recommendations based on the user's query and agent's response
 * @param {string} userMessage - The user's message
 * @param {string} agentResponse - The agent's response
 * @param {Object} context - Additional context (courseOutline, templates, etc.)
 * @returns {Array<Object>} - Array of 3 recommendation objects
 */
function generateSmartRecommendations(userMessage, agentResponse, context = {}) {
  console.log('[Smart Recommendations] Generating recommendations based on context');
  
  const lowerMessage = userMessage.toLowerCase();
  const lowerResponse = agentResponse.toLowerCase();
  
  // Detect what the agent just did
  const actionType = detectActionType(lowerMessage, lowerResponse, context);
  
  console.log(`[Smart Recommendations] Detected action type: ${actionType}`);
  
  // Get recommendations based on action type
  const recommendations = getRecommendationsForAction(actionType, context);
  
  return recommendations;
}

/**
 * Detect what action the agent just performed
 */
function detectActionType(userMessage, agentResponse, context) {
  // Check for course creation
  if (
    (userMessage.includes('create course') || 
     userMessage.includes('generate course') ||
     userMessage.includes('design course')) &&
    (agentResponse.includes('course') || 
     agentResponse.includes('topic') ||
     agentResponse.includes('learning objectives'))
  ) {
    return 'COURSE_CREATED';
  }
  
  // Check for outline creation
  if (
    (userMessage.includes('create outline') || 
     userMessage.includes('generate outline') ||
     userMessage.includes('course outline') ||
     userMessage.includes('structure')) &&
    (agentResponse.includes('module') || 
     agentResponse.includes('lesson') ||
     context.courseOutline)
  ) {
    return 'OUTLINE_CREATED';
  }
  
  // Check for template recommendation
  if (
    (userMessage.includes('template') || 
     userMessage.includes('suggest template') ||
     userMessage.includes('recommend template')) &&
    (agentResponse.includes('template') || 
     agentResponse.includes('quiz') ||
     agentResponse.includes('category'))
  ) {
    return 'TEMPLATE_RECOMMENDED';
  }
  
  // Check for template acceptance
  if (
    userMessage.includes('accept') ||
    userMessage.includes('approve') ||
    agentResponse.includes('accepted') ||
    agentResponse.includes('linked')
  ) {
    return 'TEMPLATE_ACCEPTED';
  }
  
  // Check for module/lesson addition
  if (
    userMessage.includes('add module') ||
    userMessage.includes('add lesson') ||
    userMessage.includes('new module') ||
    userMessage.includes('new lesson')
  ) {
    return 'MODULE_LESSON_ADDED';
  }
  
  // Check for general questions
  if (
    userMessage.includes('?') ||
    userMessage.includes('what') ||
    userMessage.includes('how') ||
    userMessage.includes('why') ||
    userMessage.includes('explain')
  ) {
    return 'QUESTION_ANSWERED';
  }
  
  // Check for modifications
  if (
    userMessage.includes('modify') ||
    userMessage.includes('change') ||
    userMessage.includes('update') ||
    userMessage.includes('edit')
  ) {
    return 'CONTENT_MODIFIED';
  }
  
  // Default: general conversation
  return 'GENERAL';
}

/**
 * Get 3 contextual recommendations based on action type
 */
function getRecommendationsForAction(actionType, context) {
  const recommendationMap = {
    'COURSE_CREATED': [
      {
        id: 'create-outline',
        text: 'Create course outline',
        description: 'Generate a detailed outline with modules and lessons',
        icon: '📋',
        priority: 1
      },
      {
        id: 'regenerate-course',
        text: 'Regenerate course with different approach',
        description: 'Create an alternative version of this course',
        icon: '🔄',
        priority: 2
      },
      {
        id: 'add-learning-objectives',
        text: 'Add learning objectives',
        description: 'Define specific learning outcomes for this course',
        icon: '🎯',
        priority: 3
      }
    ],
    
    'OUTLINE_CREATED': [
      {
        id: 'generate-templates',
        text: 'Generate templates for all lessons',
        description: 'Create interactive templates for each lesson',
        icon: '📝',
        priority: 1
      },
      {
        id: 'modify-outline',
        text: 'Modify the outline',
        description: 'Add, remove, or reorganize modules and lessons',
        icon: '✏️',
        priority: 2
      },
      {
        id: 'add-more-modules',
        text: 'Add more modules',
        description: 'Expand the course with additional modules',
        icon: '➕',
        priority: 3
      }
    ],
    
    'TEMPLATE_RECOMMENDED': [
      {
        id: 'accept-template',
        text: 'Accept this template',
        description: 'Apply this template to the lesson',
        icon: '✅',
        priority: 1
      },
      {
        id: 'suggest-alternative',
        text: 'Suggest alternative templates',
        description: 'Show other template options for this lesson',
        icon: '🔀',
        priority: 2
      },
      {
        id: 'customize-template',
        text: 'Customize template content',
        description: 'Modify the template to better fit your needs',
        icon: '🎨',
        priority: 3
      }
    ],
    
    'TEMPLATE_ACCEPTED': [
      {
        id: 'view-template',
        text: 'View template details',
        description: 'See the complete template with AI-filled content',
        icon: '👁️',
        priority: 1
      },
      {
        id: 'generate-next-template',
        text: 'Generate template for next lesson',
        description: 'Create template for the next lesson in sequence',
        icon: '⏭️',
        priority: 2
      },
      {
        id: 'batch-generate-templates',
        text: 'Generate templates for all lessons',
        description: 'Create templates for remaining lessons',
        icon: '⚡',
        priority: 3
      }
    ],
    
    'MODULE_LESSON_ADDED': [
      {
        id: 'create-template-new',
        text: 'Create template for this lesson',
        description: 'Generate an interactive template',
        icon: '📝',
        priority: 1
      },
      {
        id: 'add-another',
        text: 'Add another module/lesson',
        description: 'Continue building your course structure',
        icon: '➕',
        priority: 2
      },
      {
        id: 'review-structure',
        text: 'Review course structure',
        description: 'See the complete course outline',
        icon: '📊',
        priority: 3
      }
    ],
    
    'QUESTION_ANSWERED': [
      {
        id: 'ask-followup',
        text: 'Ask a follow-up question',
        description: 'Get more details or clarification',
        icon: '❓',
        priority: 1
      },
      {
        id: 'start-course-creation',
        text: 'Start creating a course',
        description: 'Begin designing your course content',
        icon: '🚀',
        priority: 2
      },
      {
        id: 'explore-templates',
        text: 'Explore available templates',
        description: 'See what template types are available',
        icon: '🔍',
        priority: 3
      }
    ],
    
    'CONTENT_MODIFIED': [
      {
        id: 'review-changes',
        text: 'Review the changes',
        description: 'See the updated content',
        icon: '👀',
        priority: 1
      },
      {
        id: 'make-more-changes',
        text: 'Make additional changes',
        description: 'Continue modifying the content',
        icon: '✏️',
        priority: 2
      },
      {
        id: 'finalize-content',
        text: 'Finalize and proceed',
        description: 'Move to the next step',
        icon: '✔️',
        priority: 3
      }
    ],
    
    'GENERAL': [
      {
        id: 'create-course',
        text: 'Create a new course',
        description: 'Start designing a new course from scratch',
        icon: '📚',
        priority: 1
      },
      {
        id: 'create-outline',
        text: 'Create course outline',
        description: 'Generate a structured outline for your course',
        icon: '📋',
        priority: 2
      },
      {
        id: 'explore-features',
        text: 'Explore features',
        description: 'Learn what this system can do',
        icon: '💡',
        priority: 3
      }
    ]
  };
  
  return recommendationMap[actionType] || recommendationMap['GENERAL'];
}

/**
 * Format recommendations for display in chat response
 * @param {Array<Object>} recommendations - Array of recommendation objects
 * @returns {string} - Formatted markdown string
 */
function formatRecommendationsForDisplay(recommendations) {
  let formatted = '\n\n---\n\n### 💡 Recommended Next Steps\n\n';
  
  recommendations.forEach((rec, index) => {
    formatted += `${index + 1}. **${rec.icon} ${rec.text}**  \n`;
    formatted += `   _${rec.description}_\n\n`;
  });
  
  return formatted;
}

/**
 * Get recommendations as structured data (for frontend chips/buttons)
 * @param {Array<Object>} recommendations - Array of recommendation objects
 * @returns {Array<Object>} - Structured recommendation data
 */
function getRecommendationsAsData(recommendations) {
  return recommendations.map(rec => ({
    id: rec.id,
    text: rec.text,
    description: rec.description,
    icon: rec.icon,
    priority: rec.priority,
    type: 'recommendation'
  }));
}

module.exports = {
  generateSmartRecommendations,
  formatRecommendationsForDisplay,
  getRecommendationsAsData
};
