const templates = require('../templates.json');

/**
 * Template Recommender Tool
 * Recommends appropriate templates based on topic, module, and lesson content
 */

// Template categories and their use cases
const templateCategories = {
  interactive: ['saq', 'saqVideo', 'binaryList', 'consult'],
  informational: ['textGraphic', 'coreImage', 'video', 'podcast'],
  engaging: ['selectAndReveal', 'selectAndRevealHotSpots', 'popup', 'timeline', 'slideShow'],
  assessment: ['saq', 'saqVideo', 'binaryList', 'consult'],
  multimedia: ['video', 'saqVideo', 'podcast', 'slideShow'],
  clickable: ['selectAndReveal', 'selectAndRevealHotSpots', 'popup', 'timeline']
};

// Keywords that suggest specific template types
const keywordMapping = {
  video: ['video', 'watch', 'viewing', 'demonstration', 'visual'],
  saq: ['question', 'quiz', 'test', 'assessment', 'evaluate', 'check understanding'],
  binaryList: ['true/false', 'yes/no', 'correct/incorrect', 'match', 'categorize'],
  consult: ['scenario', 'case study', 'consultation', 'decision', 'analyze'],
  selectAndReveal: ['explore', 'discover', 'reveal', 'learn more', 'click to learn'],
  selectAndRevealHotSpots: ['interactive image', 'hotspot', 'clickable areas', 'explore image'],
  popup: ['details', 'more information', 'expand', 'learn more'],
  timeline: ['timeline', 'sequence', 'chronology', 'history', 'progression'],
  slideShow: ['conversation', 'dialogue', 'chat', 'discussion', 'story'],
  podcast: ['audio', 'listen', 'podcast', 'interview', 'discussion'],
  textGraphic: ['text', 'reading', 'content', 'information', 'explanation'],
  coreImage: ['image', 'diagram', 'illustration', 'visual']
};

// Content complexity levels
const complexityLevels = {
  basic: ['textGraphic', 'coreImage', 'video'],
  intermediate: ['saq', 'selectAndReveal', 'popup', 'binaryList'],
  advanced: ['consult', 'selectAndRevealHotSpots', 'timeline', 'slideShow', 'saqVideo']
};

/**
 * Analyze content and recommend templates
 * @param {Object} input - Input parameters
 * @param {string} input.topic - The main topic
 * @param {string} input.module - The module name
 * @param {string} input.lesson - The lesson content/description
 * @param {string} input.learningObjective - Optional learning objective
 * @param {string} input.complexity - Optional complexity level (basic, intermediate, advanced)
 * @returns {Object} Recommended templates with reasoning
 */
function recommendTemplates(input) {
  const { topic, module, lesson, learningObjective = '', complexity = 'intermediate' } = input;
  
  // Combine all text for analysis
  const combinedText = `${topic} ${module} ${lesson} ${learningObjective}`.toLowerCase();
  
  const recommendations = [];
  const scores = {};
  
  // Score each template based on keyword matches
  Object.keys(keywordMapping).forEach(templateName => {
    let score = 0;
    const keywords = keywordMapping[templateName];
    
    keywords.forEach(keyword => {
      if (combinedText.includes(keyword)) {
        score += 1;
      }
    });
    
    scores[templateName] = score;
  });
  
  // Add complexity-based bonus
  const complexityTemplates = complexityLevels[complexity] || complexityLevels.intermediate;
  complexityTemplates.forEach(templateName => {
    scores[templateName] = (scores[templateName] || 0) + 0.5;
  });
  
  // Sort templates by score
  const sortedTemplates = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, score]) => score > 0);
  
  // Build recommendations - ONLY RETURN THE BEST MATCH
  if (sortedTemplates.length > 0) {
    const [bestTemplateName, bestScore] = sortedTemplates[0];
    if (templates[bestTemplateName]) {
      recommendations.push({
        templateName: bestTemplateName,
        template: templates[bestTemplateName],
        score: bestScore,
        reason: getRecommendationReason(bestTemplateName, combinedText),
        category: getTemplateCategory(bestTemplateName),
        usage: getTemplateUsage(bestTemplateName)
      });
    }
  }
  
  // If no specific matches, provide the most appropriate default
  if (recommendations.length === 0) {
    // Determine best default based on content type
    let defaultTemplate = 'textGraphic';
    let defaultReason = 'Default template for presenting text content';
    let defaultUsage = 'Use for text-based content with optional images';
    
    if (combinedText.includes('assess') || combinedText.includes('test') || combinedText.includes('quiz')) {
      defaultTemplate = 'saq';
      defaultReason = 'Best for assessment and knowledge testing';
      defaultUsage = 'Use for multiple choice or single answer questions';
    } else if (combinedText.includes('video') || combinedText.includes('watch')) {
      defaultTemplate = 'video';
      defaultReason = 'Best for multimedia and visual content';
      defaultUsage = 'Use for video-based learning content';
    }
    
    recommendations.push({
      templateName: defaultTemplate,
      template: templates[defaultTemplate],
      score: 0,
      reason: defaultReason,
      category: getTemplateCategory(defaultTemplate),
      usage: defaultUsage
    });
  }
  
  return {
    input: {
      topic,
      module,
      lesson,
      learningObjective,
      complexity
    },
    recommendations,
    totalTemplatesAvailable: Object.keys(templates).length
  };
}

/**
 * Get the reason for recommending a template
 */
function getRecommendationReason(templateName, combinedText) {
  const reasons = {
    video: 'Contains video-related keywords, best for visual demonstrations',
    saq: 'Contains assessment-related keywords, suitable for testing knowledge',
    binaryList: 'Contains binary choice keywords, ideal for true/false or categorization',
    consult: 'Contains scenario-based keywords, great for case studies',
    selectAndReveal: 'Contains exploration keywords, good for interactive discovery',
    selectAndRevealHotSpots: 'Contains interactive image keywords, excellent for visual exploration',
    popup: 'Contains detail-expansion keywords, useful for additional information',
    timeline: 'Contains sequence-related keywords, perfect for chronological content',
    slideShow: 'Contains conversation keywords, ideal for storytelling',
    podcast: 'Contains audio-related keywords, suitable for listening content',
    textGraphic: 'Contains text/reading keywords, good for informational content',
    coreImage: 'Contains image-related keywords, suitable for visual content'
  };
  
  return reasons[templateName] || 'Matches your content requirements';
}

/**
 * Get the category of a template
 */
function getTemplateCategory(templateName) {
  for (const [category, templates] of Object.entries(templateCategories)) {
    if (templates.includes(templateName)) {
      return category;
    }
  }
  return 'general';
}

/**
 * Get usage description for a template
 */
function getTemplateUsage(templateName) {
  const usageDescriptions = {
    consent: 'Use for consent forms and acknowledgments with checklists',
    binaryList: 'Use for binary choice questions (true/false, yes/no)',
    saq: 'Use for single or multiple choice assessments',
    saqVideo: 'Use for video-based assessments with questions',
    textGraphic: 'Use for text content with optional images',
    video: 'Use for video content with optional panels and transcripts',
    selectAndReveal: 'Use for click-to-reveal interactive content',
    selectAndRevealHotSpots: 'Use for interactive images with clickable hotspots',
    consult: 'Use for scenario-based learning and case studies',
    coreImage: 'Use for image-focused content with descriptions',
    popup: 'Use for content that expands with additional details',
    slideShow: 'Use for sequential content or conversations',
    timeline: 'Use for chronological or sequential information',
    podcast: 'Use for audio-based content',
    aiScenario: 'Use for AI-powered scenario-based learning'
  };
  
  return usageDescriptions[templateName] || 'General purpose template';
}

/**
 * Get all available templates
 */
function getAllTemplates() {
  return Object.keys(templates).map(templateName => ({
    templateName,
    category: getTemplateCategory(templateName),
    usage: getTemplateUsage(templateName)
  }));
}

/**
 * Get templates by category
 */
function getTemplatesByCategory(category) {
  const categoryTemplates = templateCategories[category] || [];
  return categoryTemplates.map(templateName => ({
    templateName,
    template: templates[templateName],
    usage: getTemplateUsage(templateName)
  }));
}

/**
 * Search templates by keyword
 */
function searchTemplates(keyword) {
  const searchTerm = keyword.toLowerCase();
  const results = [];
  
  Object.entries(keywordMapping).forEach(([templateName, keywords]) => {
    if (keywords.some(kw => kw.includes(searchTerm) || searchTerm.includes(kw))) {
      results.push({
        templateName,
        template: templates[templateName],
        matchedKeywords: keywords.filter(kw => kw.includes(searchTerm) || searchTerm.includes(kw)),
        usage: getTemplateUsage(templateName)
      });
    }
  });
  
  return results;
}

module.exports = {
  recommendTemplates,
  getAllTemplates,
  getTemplatesByCategory,
  searchTemplates,
  templateCategories,
  keywordMapping
};
