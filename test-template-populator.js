const { generateFilledTemplate, autoFillRecommendedTemplate } = require('./tools/templatePopulator');

console.log('='.repeat(60));
console.log('TEMPLATE POPULATION TEST');
console.log('='.repeat(60));

// Test 1: Generate filled SAQ template with specific template
console.log('\n📝 Test 1: Generate SAQ Template (Specific)');
console.log('-'.repeat(60));

try {
  const saqTemplate = generateFilledTemplate({
    templateName: 'saq',
    topic: 'JavaScript Arrays',
    lesson: 'Understanding Array Methods',
    module: 'Module 2: JavaScript Fundamentals',
    contentType: 'quiz',
    customContent: {
      question: 'What does the map() method do?',
      options: [
        { id: 'opt1', text: 'Creates a new array with transformed elements', correct: true },
        { id: 'opt2', text: 'Modifies the original array', correct: false },
        { id: 'opt3', text: 'Deletes elements from array', correct: false },
        { id: 'opt4', text: 'Sorts the array', correct: false }
      ]
    }
  });
  
  console.log('✅ SAQ Template Generated Successfully');
  console.log('Template Name:', 'saq');
  console.log('Question:', saqTemplate.question);
  console.log('Number of Options:', saqTemplate.options.length);
  console.log('\nFull Template JSON:');
  console.log(JSON.stringify(saqTemplate, null, 2).substring(0, 500) + '...');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

// Test 2: Generate filled VIDEO template
console.log('\n\n🎥 Test 2: Generate VIDEO Template');
console.log('-'.repeat(60));

try {
  const videoTemplate = generateFilledTemplate({
    templateName: 'video',
    topic: 'React Hooks',
    lesson: 'Introduction to useState and useEffect',
    module: 'Module 3: React Fundamentals',
    contentType: 'video',
    customContent: {
      videoPath: '/videos/react-hooks-intro.mp4',
      panels: [
        { time: '0:00', title: 'Introduction', description: 'Overview of React Hooks' },
        { time: '2:30', title: 'useState Hook', description: 'Managing state in functional components' },
        { time: '5:00', title: 'useEffect Hook', description: 'Handling side effects' },
        { time: '8:00', title: 'Practical Examples', description: 'Real-world usage patterns' }
      ]
    }
  });
  
  console.log('✅ VIDEO Template Generated Successfully');
  console.log('Description:', videoTemplate.description);
  console.log('Video Path:', videoTemplate.path);
  console.log('Number of Panels:', videoTemplate.panels.length);
  console.log('\nPanels:');
  videoTemplate.panels.forEach(panel => {
    console.log(`  - ${panel.time}: ${panel.title}`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

// Test 3: Auto-fill recommended template (best match)
console.log('\n\n🎯 Test 3: Auto-Fill Recommended Template (Best Match)');
console.log('-'.repeat(60));

try {
  const autoFilled = autoFillRecommendedTemplate({
    topic: 'Python Lists',
    lesson: 'Create a quiz to test understanding of Python list operations',
    module: 'Module 1: Python Basics',
    complexity: 'intermediate',
    contentType: 'assessment'
  });
  
  console.log('✅ Auto-Fill Successful');
  console.log('Recommended Template:', autoFilled.templateName.toUpperCase());
  console.log('Score:', autoFilled.templateScore);
  console.log('Category:', autoFilled.templateCategory);
  console.log('Reason:', autoFilled.templateReason);
  console.log('\nLesson Info:');
  console.log('  Topic:', autoFilled.lessonInfo.topic);
  console.log('  Lesson:', autoFilled.lessonInfo.lesson);
  console.log('  Complexity:', autoFilled.lessonInfo.complexity);
  console.log('\nFilled Template Preview:');
  console.log(JSON.stringify(autoFilled.filledTemplate, null, 2).substring(0, 400) + '...');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

// Test 4: Generate BINARY LIST template
console.log('\n\n✓✗ Test 4: Generate BINARY LIST Template (True/False)');
console.log('-'.repeat(60));

try {
  const binaryTemplate = generateFilledTemplate({
    templateName: 'binaryList',
    topic: 'HTML Basics',
    lesson: 'Understanding HTML Tags',
    module: 'Module 1: Web Development Fundamentals',
    contentType: 'assessment',
    customContent: {
      questions: [
        { id: 'q1', text: 'The <div> tag is a block-level element', correctChoice: 'choice1' },
        { id: 'q2', text: 'HTML stands for Hyper Text Markup Language', correctChoice: 'choice1' },
        { id: 'q3', text: 'The <span> tag is a block-level element', correctChoice: 'choice2' },
        { id: 'q4', text: 'All HTML tags must be closed', correctChoice: 'choice2' }
      ]
    }
  });
  
  console.log('✅ BINARY LIST Template Generated Successfully');
  console.log('Description:', binaryTemplate.description);
  console.log('Number of Questions:', binaryTemplate.questions.length);
  console.log('\nQuestions:');
  binaryTemplate.questions.forEach((q, i) => {
    console.log(`  ${i + 1}. ${q.text} (Correct: ${q.correctChoice})`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

// Test 5: Generate TIMELINE template
console.log('\n\n📅 Test 5: Generate TIMELINE Template');
console.log('-'.repeat(60));

try {
  const timelineTemplate = generateFilledTemplate({
    templateName: 'timeline',
    topic: 'History of Programming Languages',
    lesson: 'Evolution of Programming Languages',
    module: 'Module 5: Computer Science History',
    customContent: {
      events: [
        { 
          id: 'evt1', 
          date: '1957', 
          title: 'FORTRAN', 
          description: 'First high-level programming language',
          image: '/images/fortran.jpg'
        },
        { 
          id: 'evt2', 
          date: '1972', 
          title: 'C Language', 
          description: 'Dennis Ritchie develops C at Bell Labs',
          image: '/images/c-language.jpg'
        },
        { 
          id: 'evt3', 
          date: '1991', 
          title: 'Python', 
          description: 'Guido van Rossum releases Python',
          image: '/images/python.jpg'
        },
        { 
          id: 'evt4', 
          date: '1995', 
          title: 'JavaScript', 
          description: 'Brendan Eich creates JavaScript in 10 days',
          image: '/images/javascript.jpg'
        }
      ]
    }
  });
  
  console.log('✅ TIMELINE Template Generated Successfully');
  console.log('Title:', timelineTemplate.title);
  console.log('Description:', timelineTemplate.description);
  console.log('Number of Events:', timelineTemplate.events.length);
  console.log('\nEvents:');
  timelineTemplate.events.forEach(event => {
    console.log(`  - ${event.date}: ${event.title}`);
    console.log(`    ${event.description}`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('ALL TESTS COMPLETED');
console.log('='.repeat(60) + '\n');
