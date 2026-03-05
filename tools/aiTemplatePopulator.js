/**
 * AI-Powered Template Populator
 * Uses AI to fill template placeholders with contextual, lesson-specific content
 */

const OpenAI = require('openai');

// Make OpenAI optional - only initialize if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log('[AI Template Populator] ✓ OpenAI initialized');
} else {
  console.log('[AI Template Populator] ⚠️ OpenAI API key not found - AI template filling disabled');
}

/**
 * Generate AI-filled template content based on lesson information
 * @param {Object} params - Parameters for template generation
 * @param {string} params.templateName - Template type (saq, video, etc.)
 * @param {string} params.templateStructure - The raw template structure with placeholders
 * @param {string} params.topic - The course topic
 * @param {string} params.module - The module name
 * @param {string} params.lesson - The lesson content/title
 * @param {string} params.complexity - Complexity level (basic, intermediate, advanced)
 * @returns {Promise<Object>} - Filled template with AI-generated content
 */
async function generateAIFilledTemplate(params) {
  const {
    templateName,
    templateStructure,
    topic,
    module,
    lesson,
    complexity = 'intermediate'
  } = params;

  console.log(`[AI Template Populator] Generating AI content for ${templateName} template`);
  console.log(`[AI Template Populator] Topic: ${topic}, Lesson: ${lesson}`);

  // Check if OpenAI is available
  if (!openai) {
    console.log('[AI Template Populator] ⚠️ OpenAI not available - falling back to basic template populator');
    const { generateFilledTemplate } = require('./templatePopulator');
    return generateFilledTemplate(templateName, templateStructure, {
      topic,
      module,
      lesson
    });
  }

  try {
    // Create a prompt based on template type
    const prompt = createPromptForTemplate(templateName, {
      topic,
      module,
      lesson,
      complexity,
      templateStructure
    });

    // Call OpenAI to generate the filled content
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert instructional designer who creates engaging educational content. Generate high-quality, pedagogically sound content for learning templates.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const aiContent = JSON.parse(response.choices[0].message.content);
    console.log(`[AI Template Populator] Successfully generated AI content`);

    // Fill the template structure with AI-generated content
    const filledTemplate = fillTemplateWithAIContent(templateStructure, aiContent, templateName);

    return filledTemplate;

  } catch (error) {
    console.error(`[AI Template Populator] Error generating AI content:`, error.message);
    // Fall back to basic placeholder filling
    return fillTemplateWithBasicContent(templateStructure, params);
  }
}

/**
 * Create appropriate prompt based on template type
 */
function createPromptForTemplate(templateName, context) {
  const { topic, module, lesson, complexity } = context;

  switch (templateName) {
    case 'saq':
    case 'textSAQ':
    case 'saqVideo':
      return `Create educational content for a Single Answer Question (SAQ) quiz template.

**Context:**
- Topic: ${topic}
- Module: ${module}
- Lesson: ${lesson}
- Complexity Level: ${complexity}

**Generate JSON with the following fields:**

1. **question**: A clear, well-formed question that tests understanding of "${lesson}". Make it specific and aligned with ${complexity} level.

2. **description**: A brief 1-2 sentence description of what this assessment covers (mention ${topic}).

3. **questionDescription**: Instructions for the student on how to answer (e.g., "Select the best answer...").

4. **choiceType**: Either "single" for single choice or "multiple" for multiple choice questions.

5. **options**: Array of 4 options, each with:
   - id: "option1", "option2", "option3", "option4"
   - text: The option text (one should be clearly correct, others plausible distractors)
   - correct: true for correct answer(s), false otherwise

6. **retrySettings**: Object with:
   - allowRetry: true
   - maxAttempts: 3

7. **feedbackType**: "summary" or "individual"

8. **feedbackSummary**: Overall feedback text (1-2 sentences)

9. **correctFeedbackTitle**: Short title for correct answers (e.g., "Excellent!")

10. **correctFeedbackContent**: Positive reinforcement message (2-3 sentences)

11. **incorrectFeedbackTitle**: Short title for incorrect answers (e.g., "Not quite right")

12. **incorrectFeedbackContent**: Constructive feedback with hints (2-3 sentences)

13. **retryFeedbackTitle**: "Try Again" or similar

14. **retryFeedbackContent**: Encouraging message to retry (1-2 sentences)

Respond ONLY with valid JSON containing these fields. Make content engaging, educational, and appropriate for ${complexity} level learners.`;

    case 'video':
      return `Create educational content for a Video lesson template.

**Context:**
- Topic: ${topic}
- Module: ${module}
- Lesson: ${lesson}
- Complexity Level: ${complexity}

**Generate JSON with the following fields:**

1. **description**: A compelling 2-3 sentence description of what the video will cover about "${lesson}".

2. **videoTitle**: An engaging title for the video (5-8 words).

3. **videoTranscript**: A brief sample transcript/script for the video (3-4 sentences) that introduces the topic.

4. **learningObjectives**: Array of 3-4 learning objectives (what students will learn).

5. **duration**: Estimated video duration (e.g., "5-7 minutes").

6. **keyTakeaways**: Array of 3-4 key points students should remember.

Respond ONLY with valid JSON containing these fields.`;

    case 'textGraphic':
    case 'coreImage':
      return `Create educational content for a Text with Graphic template.

**Context:**
- Topic: ${topic}
- Module: ${module}
- Lesson: ${lesson}
- Complexity Level: ${complexity}

**Generate JSON with the following fields:**

1. **title**: An engaging title for this content section (5-8 words).

2. **description**: The main text content explaining "${lesson}" (3-5 paragraphs, educational and engaging).

3. **imageAltText**: Descriptive alt text for an image that would accompany this content.

4. **imageGraphicDescription**: Detailed description of what graphic/image would best illustrate this concept.

5. **keyPoints**: Array of 3-5 bullet points highlighting the main ideas.

6. **calloutText**: A highlighted quote or key insight (1-2 sentences).

Respond ONLY with valid JSON containing these fields.`;

    case 'binaryList':
      return `Create educational content for a Binary List (True/False or Yes/No) template.

**Context:**
- Topic: ${topic}
- Module: ${module}
- Lesson: ${lesson}
- Complexity Level: ${complexity}

**Generate JSON with the following fields:**

1. **title**: Title for this binary list activity (5-8 words).

2. **description**: Brief description of the activity (1-2 sentences).

3. **instructions**: Instructions for students on how to complete this (1-2 sentences).

4. **items**: Array of 5-7 statements, each with:
   - id: Unique identifier (e.g., "item1", "item2")
   - statement: A statement about ${lesson} that can be true/false
   - correctAnswer: "true" or "false"
   - feedback: Explanation of why this is true/false (1-2 sentences)

5. **successMessage**: Message shown when all correct (1 sentence).

6. **retryMessage**: Message shown when student needs to retry (1 sentence).

Respond ONLY with valid JSON containing these fields.`;

    case 'timeline':
      return `Create educational content for a Timeline template.

**Context:**
- Topic: ${topic}
- Module: ${module}
- Lesson: ${lesson}
- Complexity Level: ${complexity}

**Generate JSON with the following fields:**

1. **title**: Title for the timeline (5-8 words).

2. **description**: Introduction to what the timeline covers (2-3 sentences).

3. **events**: Array of 4-6 chronological events, each with:
   - id: Unique identifier
   - date: Date or time period
   - title: Event title (3-5 words)
   - description: What happened (2-3 sentences)
   - significance: Why this matters (1-2 sentences)

4. **timelineType**: "chronological", "sequential", or "process"

5. **conclusion**: Summary tying the timeline together (2-3 sentences).

Respond ONLY with valid JSON containing these fields.`;

    case 'slideShow':
      return `Create educational content for a Slideshow template.

**Context:**
- Topic: ${topic}
- Module: ${module}
- Lesson: ${lesson}
- Complexity Level: ${complexity}

**Generate JSON with the following fields:**

1. **title**: Overall slideshow title (5-8 words).

2. **description**: Introduction to the slideshow content (2-3 sentences).

3. **slides**: Array of 5-7 slides, each with:
   - id: Unique identifier
   - title: Slide title (3-5 words)
   - content: Main content for the slide (2-3 sentences)
   - imageDescription: Description of what image would go on this slide
   - speakerNotes: Teaching notes for this slide (1-2 sentences)

4. **conclusion**: Closing summary (2-3 sentences).

Respond ONLY with valid JSON containing these fields.`;

    case 'selectAndReveal':
    case 'selectAndRevealHotSpots':
      return `Create educational content for a Select and Reveal (interactive hotspot) template.

**Context:**
- Topic: ${topic}
- Module: ${module}
- Lesson: ${lesson}
- Complexity Level: ${complexity}

**Generate JSON with the following fields:**

1. **title**: Activity title (5-8 words).

2. **instructions**: How to interact with this activity (1-2 sentences).

3. **imageDescription**: Description of the main image that will have hotspots.

4. **hotspots**: Array of 4-6 interactive hotspots, each with:
   - id: Unique identifier
   - label: Hotspot label (1-3 words)
   - position: { x: number (0-100), y: number (0-100) } - percentage position
   - revealContent: Content revealed when clicked (2-3 sentences)
   - title: Title of revealed content (3-5 words)

5. **completionMessage**: Message when all hotspots explored (1-2 sentences).

Respond ONLY with valid JSON containing these fields.`;

    case 'popup':
      return `Create educational content for a Popup/Modal template.

**Context:**
- Topic: ${topic}
- Module: ${module}
- Lesson: ${lesson}
- Complexity Level: ${complexity}

**Generate JSON with the following fields:**

1. **triggerText**: Text that triggers the popup (3-5 words).

2. **popupTitle**: Title shown in the popup (5-8 words).

3. **popupContent**: Main content in the popup (3-5 paragraphs).

4. **popupType**: "definition", "example", "note", or "warning"

5. **relatedLinks**: Array of 2-3 related concepts to explore.

6. **closeButtonText**: Text for close button (1-2 words).

Respond ONLY with valid JSON containing these fields.`;

    case 'podcast':
      return `Create educational content for a Podcast template.

**Context:**
- Topic: ${topic}
- Module: ${module}
- Lesson: ${lesson}
- Complexity Level: ${complexity}

**Generate JSON with the following fields:**

1. **episodeTitle**: Podcast episode title (5-10 words).

2. **episodeDescription**: Description of what this episode covers (2-3 sentences).

3. **duration**: Estimated duration (e.g., "15-20 minutes").

4. **hostIntroduction**: Opening script for host (2-3 sentences).

5. **mainContent**: Array of 3-5 discussion points, each with:
   - topic: Discussion topic (3-5 words)
   - script: What to discuss (3-4 sentences)
   - duration: Time for this section (e.g., "3-4 minutes")

6. **guestQuestions**: Array of 3-4 questions to explore (if interview format).

7. **keyTakeaways**: Array of 3-4 main points from the episode.

8. **closingRemarks**: Closing script (2-3 sentences).

Respond ONLY with valid JSON containing these fields.`;

    case 'consult':
    case 'caseStudy':
      return `Create educational content for a Case Study/Consultation template.

**Context:**
- Topic: ${topic}
- Module: ${module}
- Lesson: ${lesson}
- Complexity Level: ${complexity}

**Generate JSON with the following fields:**

1. **caseTitle**: Title of the case study (5-8 words).

2. **scenarioDescription**: The case scenario (3-5 paragraphs describing a realistic situation).

3. **challengeStatement**: The main problem/challenge to solve (2-3 sentences).

4. **backgroundInformation**: Relevant context (2-3 paragraphs).

5. **keyQuestions**: Array of 3-5 questions students should consider.

6. **learningObjectives**: What students should learn from this case (3-4 points).

7. **recommendedApproach**: Guidance on how to approach the case (2-3 paragraphs).

8. **discussionPrompts**: Array of 3-4 prompts for class discussion.

Respond ONLY with valid JSON containing these fields.`;

    default:
      return `Create educational content for a learning template about "${lesson}".

**Context:**
- Topic: ${topic}
- Module: ${module}
- Lesson: ${lesson}
- Complexity Level: ${complexity}

Generate appropriate JSON content for this template. Include fields for title, description, main content, and any interactive elements needed for effective learning.`;
  }
}

/**
 * Fill template structure with AI-generated content
 */
function fillTemplateWithAIContent(templateStructure, aiContent, templateName) {
  // Clone the template structure
  const filled = JSON.parse(JSON.stringify(templateStructure));

  // Map AI content to template placeholders based on template type
  switch (templateName) {
    case 'saq':
    case 'textSAQ':
    case 'saqVideo':
      filled.question = aiContent.question || filled.question;
      filled.description = aiContent.description || filled.description;
      filled.questionDescription = aiContent.questionDescription || filled.questionDescription;
      filled.choiceType = aiContent.choiceType || filled.choiceType;
      filled.options = aiContent.options || filled.options;
      filled.retrySettings = aiContent.retrySettings || filled.retrySettings;
      
      if (filled.feedback) {
        filled.feedback.type = aiContent.feedbackType || filled.feedback.type;
        filled.feedback.singleFeedbackSummary = aiContent.feedbackSummary || filled.feedback.singleFeedbackSummary;
        filled.feedback.correctTitle = aiContent.correctFeedbackTitle || filled.feedback.correctTitle;
        filled.feedback.correctContent = aiContent.correctFeedbackContent || filled.feedback.correctContent;
        filled.feedback.incorrectTitle = aiContent.incorrectFeedbackTitle || filled.feedback.incorrectTitle;
        filled.feedback.incorrectContent = aiContent.incorrectFeedbackContent || filled.feedback.incorrectContent;
        filled.feedback.retryTitle = aiContent.retryFeedbackTitle || filled.feedback.retryTitle;
        filled.feedback.retryContent = aiContent.retryFeedbackContent || filled.feedback.retryContent;
      }
      break;

    case 'video':
      filled.description = aiContent.description || filled.description;
      filled.videoTitle = aiContent.videoTitle || filled.videoTitle;
      filled.transcript = aiContent.videoTranscript || filled.transcript;
      filled.learningObjectives = aiContent.learningObjectives || filled.learningObjectives;
      filled.duration = aiContent.duration || filled.duration;
      filled.keyTakeaways = aiContent.keyTakeaways || filled.keyTakeaways;
      break;

    case 'textGraphic':
    case 'coreImage':
      filled.title = aiContent.title || filled.title;
      filled.description = aiContent.description || filled.description;
      filled.keyPoints = aiContent.keyPoints || filled.keyPoints;
      filled.calloutText = aiContent.calloutText || filled.calloutText;
      if (filled.image) {
        filled.image.altText = aiContent.imageAltText || filled.image.altText;
        filled.image.graphicDescription = aiContent.imageGraphicDescription || filled.image.graphicDescription;
      }
      break;

    case 'binaryList':
      filled.title = aiContent.title || filled.title;
      filled.description = aiContent.description || filled.description;
      filled.instructions = aiContent.instructions || filled.instructions;
      filled.items = aiContent.items || filled.items;
      filled.successMessage = aiContent.successMessage || filled.successMessage;
      filled.retryMessage = aiContent.retryMessage || filled.retryMessage;
      break;

    case 'timeline':
      filled.title = aiContent.title || filled.title;
      filled.description = aiContent.description || filled.description;
      filled.events = aiContent.events || filled.events;
      filled.timelineType = aiContent.timelineType || filled.timelineType;
      filled.conclusion = aiContent.conclusion || filled.conclusion;
      break;

    case 'slideShow':
      filled.title = aiContent.title || filled.title;
      filled.description = aiContent.description || filled.description;
      filled.slides = aiContent.slides || filled.slides;
      filled.conclusion = aiContent.conclusion || filled.conclusion;
      break;

    case 'selectAndReveal':
    case 'selectAndRevealHotSpots':
      filled.title = aiContent.title || filled.title;
      filled.instructions = aiContent.instructions || filled.instructions;
      filled.imageDescription = aiContent.imageDescription || filled.imageDescription;
      filled.hotspots = aiContent.hotspots || filled.hotspots;
      filled.completionMessage = aiContent.completionMessage || filled.completionMessage;
      break;

    case 'popup':
      filled.triggerText = aiContent.triggerText || filled.triggerText;
      filled.popupTitle = aiContent.popupTitle || filled.popupTitle;
      filled.popupContent = aiContent.popupContent || filled.popupContent;
      filled.popupType = aiContent.popupType || filled.popupType;
      filled.relatedLinks = aiContent.relatedLinks || filled.relatedLinks;
      break;

    case 'podcast':
      filled.episodeTitle = aiContent.episodeTitle || filled.episodeTitle;
      filled.episodeDescription = aiContent.episodeDescription || filled.episodeDescription;
      filled.duration = aiContent.duration || filled.duration;
      filled.hostIntroduction = aiContent.hostIntroduction || filled.hostIntroduction;
      filled.mainContent = aiContent.mainContent || filled.mainContent;
      filled.guestQuestions = aiContent.guestQuestions || filled.guestQuestions;
      filled.keyTakeaways = aiContent.keyTakeaways || filled.keyTakeaways;
      filled.closingRemarks = aiContent.closingRemarks || filled.closingRemarks;
      break;

    case 'consult':
    case 'caseStudy':
      filled.caseTitle = aiContent.caseTitle || filled.caseTitle;
      filled.scenarioDescription = aiContent.scenarioDescription || filled.scenarioDescription;
      filled.challengeStatement = aiContent.challengeStatement || filled.challengeStatement;
      filled.backgroundInformation = aiContent.backgroundInformation || filled.backgroundInformation;
      filled.keyQuestions = aiContent.keyQuestions || filled.keyQuestions;
      filled.learningObjectives = aiContent.learningObjectives || filled.learningObjectives;
      filled.recommendedApproach = aiContent.recommendedApproach || filled.recommendedApproach;
      filled.discussionPrompts = aiContent.discussionPrompts || filled.discussionPrompts;
      break;

    default:
      // Generic filling for unknown templates
      Object.keys(aiContent).forEach(key => {
        if (filled.hasOwnProperty(key)) {
          filled[key] = aiContent[key];
        }
      });
  }

  return filled;
}

/**
 * Fallback: Fill template with basic placeholder content (non-AI)
 */
function fillTemplateWithBasicContent(templateStructure, params) {
  const { topic, lesson, module, complexity } = params;
  const filled = JSON.parse(JSON.stringify(templateStructure));

  // Basic placeholder replacement
  const replaceInObject = (obj) => {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key]
          .replace(/\{\{TOPIC\}\}/g, topic || 'this topic')
          .replace(/\{\{LESSON\}\}/g, lesson || 'this lesson')
          .replace(/\{\{MODULE\}\}/g, module || 'this module')
          .replace(/\{\{COMPLEXITY\}\}/g, complexity || 'intermediate')
          .replace(/\{\{SAQ_QUESTION\}\}/g, `Question about ${topic || 'this topic'}`)
          .replace(/\{\{SAQ_DESCRIPTION\}\}/g, `Assessment for ${lesson || 'this lesson'}`)
          .replace(/\{\{SAQ_QUESTION_DESCRIPTION\}\}/g, 'Select the best answer.')
          .replace(/\{\{SAQ_CHOICE_TYPE\}\}/g, 'single')
          .replace(/\{\{SAQ_FEEDBACK_TYPE\}\}/g, 'summary')
          .replace(/\{\{SAQ_FEEDBACK_SUMMARY\}\}/g, `Review your understanding of ${topic || 'this topic'}`)
          .replace(/\{\{CORRECT_FEEDBACK_TITLE\}\}/g, 'Correct!')
          .replace(/\{\{CORRECT_FEEDBACK_CONTENT\}\}/g, 'Great job!')
          .replace(/\{\{INCORRECT_FEEDBACK_TITLE\}\}/g, 'Not quite right')
          .replace(/\{\{INCORRECT_FEEDBACK_CONTENT\}\}/g, 'Review the material and try again.')
          .replace(/\{\{RETRY_FEEDBACK_TITLE\}\}/g, 'Try Again')
          .replace(/\{\{RETRY_FEEDBACK_CONTENT\}\}/g, 'Take another look and try again.');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        replaceInObject(obj[key]);
      }
    });
  };

  replaceInObject(filled);
  return filled;
}

module.exports = {
  generateAIFilledTemplate,
  fillTemplateWithAIContent,
  fillTemplateWithBasicContent
};
