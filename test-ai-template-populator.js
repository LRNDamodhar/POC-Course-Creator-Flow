/**
 * Test AI Template Populator
 * Verify that AI can generate contextual content for templates
 */

const { generateAIFilledTemplate } = require('./tools/aiTemplatePopulator');
const templates = require('./templates.json');

// Test configuration
const testCases = [
  {
    name: 'SAQ Template - Ethics in AI',
    templateName: 'saq',
    topic: 'Ethics in AI',
    module: 'Introduction to AI Ethics',
    lesson: 'What is Algorithmic Bias?',
    complexity: 'intermediate'
  },
  {
    name: 'Video Template - Machine Learning',
    templateName: 'video',
    topic: 'Machine Learning Basics',
    module: 'Supervised Learning',
    lesson: 'Introduction to Neural Networks',
    complexity: 'advanced'
  },
  {
    name: 'Binary List - Programming Concepts',
    templateName: 'binaryList',
    topic: 'JavaScript Fundamentals',
    module: 'Variables and Data Types',
    lesson: 'Understanding Scope',
    complexity: 'basic'
  },
  {
    name: 'Timeline - Historical Events',
    templateName: 'timeline',
    topic: 'History of Computing',
    module: 'The Digital Revolution',
    lesson: 'Key Milestones in AI Development',
    complexity: 'intermediate'
  }
];

async function runTests() {
  console.log('🧪 AI Template Populator Test Suite\n');
  console.log('=' .repeat(80));
  console.log('\n');

  for (const testCase of testCases) {
    console.log(`📝 Test: ${testCase.name}`);
    console.log('-'.repeat(80));
    console.log(`Template: ${testCase.templateName}`);
    console.log(`Topic: ${testCase.topic}`);
    console.log(`Module: ${testCase.module}`);
    console.log(`Lesson: ${testCase.lesson}`);
    console.log(`Complexity: ${testCase.complexity}\n`);

    try {
      // Get the base template structure
      const templateStructure = templates[testCase.templateName];
      
      if (!templateStructure) {
        console.error(`❌ Template '${testCase.templateName}' not found in templates.json\n`);
        continue;
      }

      console.log('⏳ Generating AI-filled template content...\n');

      const startTime = Date.now();
      
      // Generate AI-filled template
      const filledTemplate = await generateAIFilledTemplate({
        templateName: testCase.templateName,
        templateStructure: templateStructure,
        topic: testCase.topic,
        module: testCase.module,
        lesson: testCase.lesson,
        complexity: testCase.complexity
      });

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      console.log(`✅ Success! Generated in ${duration}s\n`);

      // Display filled content preview
      console.log('📄 Generated Content Preview:');
      console.log('-'.repeat(80));

      // Show different fields based on template type
      switch (testCase.templateName) {
        case 'saq':
          console.log(`Question: ${filledTemplate.question || 'N/A'}`);
          console.log(`Description: ${filledTemplate.description || 'N/A'}`);
          console.log(`Choice Type: ${filledTemplate.choiceType || 'N/A'}`);
          console.log(`\nOptions (${filledTemplate.options?.length || 0}):`);
          filledTemplate.options?.forEach((opt, idx) => {
            console.log(`  ${idx + 1}. ${opt.text} ${opt.correct ? '✓' : ''}`);
          });
          console.log(`\nFeedback:`);
          console.log(`  Correct: ${filledTemplate.feedback?.correctContent || 'N/A'}`);
          console.log(`  Incorrect: ${filledTemplate.feedback?.incorrectContent || 'N/A'}`);
          break;

        case 'video':
          console.log(`Title: ${filledTemplate.videoTitle || 'N/A'}`);
          console.log(`Description: ${filledTemplate.description || 'N/A'}`);
          console.log(`Duration: ${filledTemplate.duration || 'N/A'}`);
          console.log(`\nLearning Objectives (${filledTemplate.learningObjectives?.length || 0}):`);
          filledTemplate.learningObjectives?.forEach((obj, idx) => {
            console.log(`  ${idx + 1}. ${obj}`);
          });
          console.log(`\nKey Takeaways (${filledTemplate.keyTakeaways?.length || 0}):`);
          filledTemplate.keyTakeaways?.forEach((takeaway, idx) => {
            console.log(`  ${idx + 1}. ${takeaway}`);
          });
          break;

        case 'binaryList':
          console.log(`Title: ${filledTemplate.title || 'N/A'}`);
          console.log(`Description: ${filledTemplate.description || 'N/A'}`);
          console.log(`\nStatements (${filledTemplate.items?.length || 0}):`);
          filledTemplate.items?.forEach((item, idx) => {
            console.log(`  ${idx + 1}. ${item.statement}`);
            console.log(`     Answer: ${item.correctAnswer}`);
            console.log(`     Feedback: ${item.feedback}`);
          });
          break;

        case 'timeline':
          console.log(`Title: ${filledTemplate.title || 'N/A'}`);
          console.log(`Description: ${filledTemplate.description || 'N/A'}`);
          console.log(`\nEvents (${filledTemplate.events?.length || 0}):`);
          filledTemplate.events?.forEach((event, idx) => {
            console.log(`  ${idx + 1}. ${event.date}: ${event.title}`);
            console.log(`     ${event.description}`);
          });
          break;

        default:
          console.log(JSON.stringify(filledTemplate, null, 2).substring(0, 500) + '...');
      }

      console.log('\n');
      console.log('💾 Full JSON (first 1000 chars):');
      console.log('-'.repeat(80));
      console.log(JSON.stringify(filledTemplate, null, 2).substring(0, 1000) + '...\n');

    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      console.error(error.stack);
      console.log('\n');
    }

    console.log('='.repeat(80));
    console.log('\n');
  }

  console.log('🏁 Test Suite Complete!\n');
}

// Run tests
console.log('Starting AI Template Populator tests...\n');
console.log('Note: This requires OPENAI_API_KEY to be set in environment\n');

runTests()
  .then(() => {
    console.log('All tests completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
