const { recommendTemplates } = require('./templateRecommender');
const templates = require('../templates.json');

/**
 * Template Population Tool
 * Fills template placeholders with actual content based on user input
 */

/**
 * Generate filled template JSON based on user input
 * @param {Object} input - Input parameters
 * @param {string} input.templateName - The template to use (e.g., 'saq', 'video')
 * @param {string} input.topic - The main topic
 * @param {string} input.lesson - The lesson content/description
 * @param {string} input.module - Optional module name
 * @param {string} input.contentType - Type of content (quiz, video, etc.)
 * @param {Object} input.customContent - Optional custom content for specific fields
 * @returns {Object} Filled template with actual content
 */
function generateFilledTemplate(input) {
  const { 
    templateName, 
    topic, 
    lesson, 
    module = '', 
    contentType = '',
    customContent = {} 
  } = input;

  // Get the base template
  const baseTemplate = templates[templateName];
  
  if (!baseTemplate) {
    throw new Error(`Template '${templateName}' not found`);
  }

  // Clone the template to avoid modifying the original
  const filledTemplate = JSON.parse(JSON.stringify(baseTemplate));

  // Generate context-aware content
  const context = {
    topic,
    lesson,
    module,
    contentType
  };

  // Fill template based on template type
  switch (templateName) {
    case 'saq':
    case 'saqVideo':
      return fillSAQTemplate(filledTemplate, context, customContent);
    
    case 'video':
      return fillVideoTemplate(filledTemplate, context, customContent);
    
    case 'textGraphic':
    case 'coreImage':
      return fillTextGraphicTemplate(filledTemplate, context, customContent);
    
    case 'binaryList':
      return fillBinaryListTemplate(filledTemplate, context, customContent);
    
    case 'selectAndReveal':
    case 'selectAndRevealHotSpots':
      return fillSelectAndRevealTemplate(filledTemplate, context, customContent);
    
    case 'popup':
      return fillPopupTemplate(filledTemplate, context, customContent);
    
    case 'timeline':
      return fillTimelineTemplate(filledTemplate, context, customContent);
    
    case 'slideShow':
      return fillSlideShowTemplate(filledTemplate, context, customContent);
    
    case 'podcast':
      return fillPodcastTemplate(filledTemplate, context, customContent);
    
    case 'consult':
      return fillConsultTemplate(filledTemplate, context, customContent);
    
    default:
      // For unknown templates, just replace basic placeholders
      return fillGenericTemplate(filledTemplate, context, customContent);
  }
}

/**
 * Fill SAQ (Single Answer Question) template
 */
function fillSAQTemplate(template, context, customContent) {
  const { topic, lesson } = context;
  
  template.question = customContent.question || `Question about ${topic}`;
  template.description = customContent.description || `This assessment tests your understanding of ${topic}.`;
  template.questionDescription = customContent.questionDescription || `Select the best answer for the following question about ${lesson}.`;
  template.choiceType = customContent.choiceType || 'single'; // single or multiple
  
  // Generate sample options if not provided
  template.options = customContent.options || [
    {
      id: 'option1',
      text: 'Option 1 - To be filled',
      correct: true
    },
    {
      id: 'option2',
      text: 'Option 2 - To be filled',
      correct: false
    },
    {
      id: 'option3',
      text: 'Option 3 - To be filled',
      correct: false
    },
    {
      id: 'option4',
      text: 'Option 4 - To be filled',
      correct: false
    }
  ];
  
  template.retrySettings = customContent.retrySettings || {
    allowRetry: true,
    maxAttempts: 3
  };
  
  // Feedback configuration
  template.feedback = {
    type: customContent.feedbackType || 'summary',
    singleFeedbackSummary: customContent.feedbackSummary || `Review your understanding of ${topic}`,
    correctTitle: 'Correct!',
    correctContent: customContent.correctFeedback || `Great job! You understand ${topic} well.`,
    incorrectTitle: 'Not quite right',
    incorrectContent: customContent.incorrectFeedback || `Review the concepts about ${lesson}.`,
    retryTitle: 'Try Again',
    retryContent: 'Take another look at the question and try again.'
  };
  
  return template;
}

/**
 * Fill VIDEO template
 */
function fillVideoTemplate(template, context, customContent) {
  const { topic, lesson } = context;
  
  template.description = customContent.description || `Video lesson about ${topic}: ${lesson}`;
  template.autoPlay = customContent.autoPlay || 'off';
  template.path = customContent.videoPath || '/path/to/video.mp4'; // Placeholder
  template.showCC = customContent.showCC !== undefined ? customContent.showCC : true;
  template.showAltText = customContent.showAltText !== undefined ? customContent.showAltText : true;
  template.pageNav = customContent.pageNav !== undefined ? customContent.pageNav : false;
  
  // Video panels (chapters/sections)
  template.panels = customContent.panels || [
    {
      time: '0:00',
      title: `Introduction to ${topic}`,
      description: `Overview of ${lesson}`
    },
    {
      time: '2:00',
      title: 'Main Content',
      description: 'Key concepts and examples'
    },
    {
      time: '5:00',
      title: 'Summary',
      description: 'Recap of main points'
    }
  ];
  
  template.image = {
    path: customContent.thumbnailDesktop || '/path/to/thumbnail-desktop.jpg',
    altText: `Video thumbnail for ${topic}`,
    graphicDescription: `Visual representation of ${lesson}`
  };
  
  template.mobileImage = {
    path: customContent.thumbnailMobile || '/path/to/thumbnail-mobile.jpg',
    altText: `Video thumbnail for ${topic}`,
    graphicDescription: `Visual representation of ${lesson}`
  };
  
  return template;
}

/**
 * Fill TEXT GRAPHIC template
 */
function fillTextGraphicTemplate(template, context, customContent) {
  const { topic, lesson } = context;
  
  template.description = customContent.description || `Learn about ${topic}: ${lesson}`;
  template.content = customContent.content || `
    <h2>${topic}</h2>
    <p>${lesson}</p>
    <p>This section provides detailed information about the topic. Replace this text with actual content.</p>
  `;
  
  template.image = {
    path: customContent.imagePath || '/path/to/image.jpg',
    altText: `Illustration for ${topic}`,
    graphicDescription: `Visual aid showing ${lesson}`
  };
  
  return template;
}

/**
 * Fill BINARY LIST template (True/False, Yes/No)
 */
function fillBinaryListTemplate(template, context, customContent) {
  const { topic, lesson } = context;
  
  template.description = customContent.description || `Categorize the following statements about ${topic}.`;
  
  template.choices = customContent.choices || [
    { id: 'choice1', label: 'True' },
    { id: 'choice2', label: 'False' }
  ];
  
  template.questions = customContent.questions || [
    {
      id: 'q1',
      text: `Statement 1 about ${topic} - To be filled`,
      correctChoice: 'choice1'
    },
    {
      id: 'q2',
      text: `Statement 2 about ${lesson} - To be filled`,
      correctChoice: 'choice2'
    },
    {
      id: 'q3',
      text: `Statement 3 about ${topic} - To be filled`,
      correctChoice: 'choice1'
    }
  ];
  
  template.feedback = {
    correctTitle: 'Excellent!',
    correctSummary: `You correctly categorized all statements about ${topic}.`,
    partialTitle: 'Good effort',
    partialSummary: 'Some answers need review. Try again.',
    incorrectTitle: 'Keep trying',
    incorrectSummary: `Review the concepts about ${lesson} and try again.`
  };
  
  return template;
}

/**
 * Fill SELECT AND REVEAL template
 */
function fillSelectAndRevealTemplate(template, context, customContent) {
  const { topic, lesson } = context;
  
  template.description = customContent.description || `Explore different aspects of ${topic}. Click to reveal more information.`;
  template.type = customContent.type || 'random'; // random or sequential
  
  template.items = customContent.items || [
    {
      id: 'item1',
      trigger: `Aspect 1 of ${topic}`,
      content: `Detailed information about this aspect of ${lesson}.`
    },
    {
      id: 'item2',
      trigger: `Aspect 2 of ${topic}`,
      content: `More details about this component.`
    },
    {
      id: 'item3',
      trigger: `Aspect 3 of ${topic}`,
      content: `Additional insights into ${lesson}.`
    }
  ];
  
  return template;
}

/**
 * Fill POPUP template
 */
function fillPopupTemplate(template, context, customContent) {
  const { topic, lesson } = context;
  
  template.description = customContent.description || `Click on each item to learn more about ${topic}.`;
  template.type = customContent.type || 'random';
  template.enableQuotation = customContent.enableQuotation !== undefined ? customContent.enableQuotation : false;
  template.labelInThumbnail = customContent.labelInThumbnail !== undefined ? customContent.labelInThumbnail : true;
  
  template.items = customContent.items || [
    {
      id: 'popup1',
      thumbnail: {
        image: '/path/to/thumbnail1.jpg',
        altText: `Thumbnail for concept 1 of ${topic}`,
        label: 'Concept 1'
      },
      content: {
        title: `Concept 1: ${topic}`,
        description: `Detailed explanation of this concept in ${lesson}.`,
        image: '/path/to/full-image1.jpg',
        altText: 'Full image for concept 1'
      }
    },
    {
      id: 'popup2',
      thumbnail: {
        image: '/path/to/thumbnail2.jpg',
        altText: `Thumbnail for concept 2 of ${topic}`,
        label: 'Concept 2'
      },
      content: {
        title: 'Concept 2',
        description: 'More information here.',
        image: '/path/to/full-image2.jpg',
        altText: 'Full image for concept 2'
      }
    }
  ];
  
  return template;
}

/**
 * Fill TIMELINE template
 */
function fillTimelineTemplate(template, context, customContent) {
  const { topic, lesson } = context;
  
  template.description = customContent.description || `Timeline of key events in ${topic}.`;
  template.title = customContent.title || `${topic} Timeline`;
  
  template.events = customContent.events || [
    {
      id: 'event1',
      date: '1900',
      title: `Event 1 in ${topic}`,
      description: `Description of this important milestone in ${lesson}.`,
      image: '/path/to/event1.jpg'
    },
    {
      id: 'event2',
      date: '1950',
      title: 'Event 2',
      description: 'Details about this event.',
      image: '/path/to/event2.jpg'
    },
    {
      id: 'event3',
      date: '2000',
      title: 'Event 3',
      description: 'More recent developments.',
      image: '/path/to/event3.jpg'
    }
  ];
  
  return template;
}

/**
 * Fill SLIDESHOW template
 */
function fillSlideShowTemplate(template, context, customContent) {
  const { topic, lesson } = context;
  
  template.description = customContent.description || `Interactive conversation about ${topic}.`;
  template.title = customContent.title || `${lesson}`;
  
  template.slides = customContent.slides || [
    {
      id: 'slide1',
      speaker: 'Instructor',
      avatar: '/path/to/instructor-avatar.jpg',
      text: `Welcome! Today we'll discuss ${topic}.`,
      image: '/path/to/slide1.jpg'
    },
    {
      id: 'slide2',
      speaker: 'Student',
      avatar: '/path/to/student-avatar.jpg',
      text: `I'm interested in learning about ${lesson}.`,
      image: '/path/to/slide2.jpg'
    },
    {
      id: 'slide3',
      speaker: 'Instructor',
      avatar: '/path/to/instructor-avatar.jpg',
      text: `Let's explore the key concepts together.`,
      image: '/path/to/slide3.jpg'
    }
  ];
  
  return template;
}

/**
 * Fill PODCAST template
 */
function fillPodcastTemplate(template, context, customContent) {
  const { topic, lesson } = context;
  
  template.description = customContent.description || `Audio lesson about ${topic}: ${lesson}`;
  template.title = customContent.title || `Podcast: ${topic}`;
  template.audioPath = customContent.audioPath || '/path/to/audio.mp3';
  template.duration = customContent.duration || '10:00';
  template.showTranscript = customContent.showTranscript !== undefined ? customContent.showTranscript : true;
  
  template.transcript = customContent.transcript || `
    Transcript for ${topic} podcast.
    
    Host: Welcome to today's lesson on ${topic}.
    
    In this episode, we'll cover ${lesson}.
    
    [Continue with full transcript...]
  `;
  
  template.image = {
    path: customContent.coverImage || '/path/to/podcast-cover.jpg',
    altText: `Podcast cover for ${topic}`,
    graphicDescription: `Visual representation of ${lesson}`
  };
  
  return template;
}

/**
 * Fill CONSULT template (Scenario-based)
 */
function fillConsultTemplate(template, context, customContent) {
  const { topic, lesson } = context;
  
  template.description = customContent.description || `Analyze this scenario related to ${topic}.`;
  template.scenario = customContent.scenario || `
    <h3>Scenario: ${lesson}</h3>
    <p>You are presented with a situation involving ${topic}. Read the details carefully and make your decision.</p>
    <p>[Provide detailed scenario description here]</p>
  `;
  
  template.questions = customContent.questions || [
    {
      id: 'q1',
      text: `What is the best approach in this ${topic} scenario?`,
      options: [
        { id: 'opt1', text: 'Option A', feedback: 'Consider the implications...' },
        { id: 'opt2', text: 'Option B', feedback: 'Good choice because...' },
        { id: 'opt3', text: 'Option C', feedback: 'This might lead to...' }
      ]
    }
  ];
  
  template.feedback = customContent.feedback || {
    title: 'Analysis',
    content: `Review your decisions about ${lesson} and their potential outcomes.`
  };
  
  return template;
}

/**
 * Fill generic template (fallback)
 */
function fillGenericTemplate(template, context, customContent) {
  const { topic, lesson } = context;
  
  // Replace common placeholders
  const filled = JSON.parse(JSON.stringify(template));
  const replaceInObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key]
          .replace(/{{TOPIC}}/g, topic)
          .replace(/{{LESSON}}/g, lesson)
          .replace(/{{DESCRIPTION}}/g, `Content about ${topic}`);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        replaceInObject(obj[key]);
      }
    }
  };
  
  replaceInObject(filled);
  
  // Apply custom content
  Object.assign(filled, customContent);
  
  return filled;
}

/**
 * Auto-fill template based on recommendation
 * Combines recommendation and population in one step
 */
function autoFillRecommendedTemplate(input) {
  const { topic, lesson, module, complexity, contentType } = input;
  
  // First, get the best template recommendation
  const recommendation = recommendTemplates({
    topic,
    lesson,
    module,
    complexity,
    learningObjective: input.learningObjective || ''
  });
  
  if (!recommendation.recommendations || recommendation.recommendations.length === 0) {
    throw new Error('No template recommendations found');
  }
  
  const bestTemplate = recommendation.recommendations[0];
  
  // Now fill that template with content
  const filledTemplate = generateFilledTemplate({
    templateName: bestTemplate.templateName,
    topic,
    lesson,
    module,
    contentType,
    customContent: input.customContent || {}
  });
  
  return {
    templateName: bestTemplate.templateName,
    templateScore: bestTemplate.score,
    templateCategory: bestTemplate.category,
    templateReason: bestTemplate.reason,
    templateUsage: bestTemplate.usage,
    filledTemplate: filledTemplate,
    lessonInfo: {
      topic,
      lesson,
      module,
      complexity
    }
  };
}

module.exports = {
  generateFilledTemplate,
  autoFillRecommendedTemplate,
  fillSAQTemplate,
  fillVideoTemplate,
  fillTextGraphicTemplate,
  fillBinaryListTemplate,
  fillSelectAndRevealTemplate,
  fillPopupTemplate,
  fillTimelineTemplate,
  fillSlideShowTemplate,
  fillPodcastTemplate,
  fillConsultTemplate
};
