/**
 * Test Template Integration in Chat Workflow
 * 
 * This script tests that template recommendations work in the chat streaming workflow
 */

const {
  isTemplateCreationRequest,
  getTemplateRecommendations,
  formatTemplateRecommendations,
  getTemplateActions
} = require('./tools');

// Test detection
console.log('=== TEMPLATE DETECTION TESTS ===\n');

const testMessages = [
  'create a template for a lesson about JavaScript arrays',
  'suggest template for video lesson on photosynthesis',
  'what template should I use for a quiz about history',
  'help me design a course about Python',
  'Hello, how are you?'
];

testMessages.forEach((msg, idx) => {
  const isTemplate = isTemplateCreationRequest(msg);
  console.log(`Test ${idx + 1}: "${msg}"`);
  console.log(`  → Template request: ${isTemplate ? '✅ YES' : '❌ NO'}\n`);
});

// Test full workflow
console.log('\n=== FULL WORKFLOW TEST ===\n');

async function testFullWorkflow() {
  const testInput = 'create a template for a lesson about JavaScript arrays with an interactive quiz';
  const conversationHistory = [
    { role: 'user', content: 'I want to create a course about JavaScript' },
    { role: 'assistant', content: 'Great! What topics would you like to cover?' },
    { role: 'user', content: 'Arrays, functions, and objects' }
  ];
  
  console.log('User Input:', testInput);
  console.log('\nConversation History:', conversationHistory.length, 'messages');
  
  try {
    // Get recommendations
    console.log('\n1. Getting recommendations...');
    const recommendations = await getTemplateRecommendations(testInput, conversationHistory);
    console.log(`   → Found ${recommendations.length} recommendations`);
    
    // Format for display
    console.log('\n2. Formatting recommendations...');
    const formatted = formatTemplateRecommendations(recommendations);
    console.log(`   → Formatted text length: ${formatted.length} chars`);
    console.log('\n--- FORMATTED OUTPUT ---');
    console.log(formatted);
    console.log('--- END OUTPUT ---\n');
    
    // Get actions
    console.log('3. Getting template actions...');
    const actions = getTemplateActions(recommendations);
    console.log(`   → Generated ${actions.length} actions`);
    console.log('\n--- TEMPLATE ACTIONS ---');
    actions.forEach((action, idx) => {
      console.log(`${idx + 1}. ${action.label}`);
      console.log(`   Type: ${action.type}`);
      console.log(`   Template: ${action.templateData?.templateName || 'N/A'}`);
    });
    console.log('--- END ACTIONS ---\n');
    
    console.log('✅ Full workflow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in workflow test:', error);
  }
}

testFullWorkflow().then(() => {
  console.log('\n=== ALL TESTS COMPLETED ===');
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
