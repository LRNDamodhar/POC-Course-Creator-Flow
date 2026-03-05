const {
  recommendTemplates,
  getAllTemplates,
  getTemplatesByCategory,
  searchTemplates
} = require('./templateRecommender');

console.log('='.repeat(80));
console.log('TEMPLATE RECOMMENDER TOOL - EXAMPLES');
console.log('='.repeat(80));

// Example 1: Video-based lesson
console.log('\n\n📹 Example 1: Video-based Lesson');
console.log('-'.repeat(80));
const example1 = recommendTemplates({
  topic: 'Introduction to JavaScript',
  module: 'Module 1: Getting Started',
  lesson: 'Watch this video demonstration of how to set up your development environment',
  learningObjective: 'Students will be able to install and configure their IDE',
  complexity: 'basic'
});
console.log('Input:', JSON.stringify(example1.input, null, 2));
console.log('\nTop Recommendations:');
example1.recommendations.slice(0, 3).forEach((rec, idx) => {
  console.log(`\n${idx + 1}. ${rec.templateName.toUpperCase()} (Score: ${rec.score})`);
  console.log(`   Category: ${rec.category}`);
  console.log(`   Reason: ${rec.reason}`);
  console.log(`   Usage: ${rec.usage}`);
});

// Example 2: Assessment/Quiz
console.log('\n\n📝 Example 2: Assessment/Quiz');
console.log('-'.repeat(80));
const example2 = recommendTemplates({
  topic: 'Data Structures',
  module: 'Module 3: Arrays and Objects',
  lesson: 'Take this quiz to test your understanding of array methods and object manipulation',
  learningObjective: 'Evaluate student comprehension of arrays and objects',
  complexity: 'intermediate'
});
console.log('Input:', JSON.stringify(example2.input, null, 2));
console.log('\nTop Recommendations:');
example2.recommendations.slice(0, 3).forEach((rec, idx) => {
  console.log(`\n${idx + 1}. ${rec.templateName.toUpperCase()} (Score: ${rec.score})`);
  console.log(`   Category: ${rec.category}`);
  console.log(`   Reason: ${rec.reason}`);
  console.log(`   Usage: ${rec.usage}`);
});

// Example 3: Interactive exploration
console.log('\n\n🔍 Example 3: Interactive Exploration');
console.log('-'.repeat(80));
const example3 = recommendTemplates({
  topic: 'Human Anatomy',
  module: 'Module 2: The Cardiovascular System',
  lesson: 'Explore this interactive diagram of the heart. Click on different areas to learn more about each part',
  learningObjective: 'Students will identify and understand the function of heart chambers',
  complexity: 'advanced'
});
console.log('Input:', JSON.stringify(example3.input, null, 2));
console.log('\nTop Recommendations:');
example3.recommendations.slice(0, 3).forEach((rec, idx) => {
  console.log(`\n${idx + 1}. ${rec.templateName.toUpperCase()} (Score: ${rec.score})`);
  console.log(`   Category: ${rec.category}`);
  console.log(`   Reason: ${rec.reason}`);
  console.log(`   Usage: ${rec.usage}`);
});

// Example 4: Case study/Scenario
console.log('\n\n💼 Example 4: Case Study/Scenario');
console.log('-'.repeat(80));
const example4 = recommendTemplates({
  topic: 'Business Ethics',
  module: 'Module 4: Decision Making',
  lesson: 'Analyze this case study about ethical dilemmas in business. Review the scenario and make decisions based on ethical principles',
  learningObjective: 'Students will apply ethical frameworks to real-world business scenarios',
  complexity: 'advanced'
});
console.log('Input:', JSON.stringify(example4.input, null, 2));
console.log('\nTop Recommendations:');
example4.recommendations.slice(0, 3).forEach((rec, idx) => {
  console.log(`\n${idx + 1}. ${rec.templateName.toUpperCase()} (Score: ${rec.score})`);
  console.log(`   Category: ${rec.category}`);
  console.log(`   Reason: ${rec.reason}`);
  console.log(`   Usage: ${rec.usage}`);
});

// Example 5: Timeline/Historical
console.log('\n\n📅 Example 5: Timeline/Historical Content');
console.log('-'.repeat(80));
const example5 = recommendTemplates({
  topic: 'World History',
  module: 'Module 6: The Industrial Revolution',
  lesson: 'Explore this timeline showing the chronological progression of major inventions during the Industrial Revolution',
  learningObjective: 'Students will understand the sequence and impact of industrial innovations',
  complexity: 'intermediate'
});
console.log('Input:', JSON.stringify(example5.input, null, 2));
console.log('\nTop Recommendations:');
example5.recommendations.slice(0, 3).forEach((rec, idx) => {
  console.log(`\n${idx + 1}. ${rec.templateName.toUpperCase()} (Score: ${rec.score})`);
  console.log(`   Category: ${rec.category}`);
  console.log(`   Reason: ${rec.reason}`);
  console.log(`   Usage: ${rec.usage}`);
});

// Show all available templates
console.log('\n\n📚 All Available Templates');
console.log('-'.repeat(80));
const allTemplates = getAllTemplates();
console.log(`Total templates available: ${allTemplates.length}\n`);
allTemplates.forEach((template, idx) => {
  console.log(`${idx + 1}. ${template.templateName} (${template.category})`);
});

// Show templates by category
console.log('\n\n🎯 Templates by Category: Interactive');
console.log('-'.repeat(80));
const interactiveTemplates = getTemplatesByCategory('interactive');
interactiveTemplates.forEach((template, idx) => {
  console.log(`${idx + 1}. ${template.templateName}`);
  console.log(`   ${template.usage}`);
});

// Search templates
console.log('\n\n🔎 Search Templates: "video"');
console.log('-'.repeat(80));
const searchResults = searchTemplates('video');
searchResults.forEach((result, idx) => {
  console.log(`${idx + 1}. ${result.templateName}`);
  console.log(`   Matched keywords: ${result.matchedKeywords.join(', ')}`);
  console.log(`   ${result.usage}`);
});

console.log('\n' + '='.repeat(80));
console.log('TEST COMPLETED');
console.log('='.repeat(80));
