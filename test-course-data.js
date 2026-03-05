/**
 * Test Script to verify course data is being returned from backend
 */

const fetch = require('node-fetch');

async function testCourseCreation() {
  console.log('Testing course creation...\n');
  
  const response = await fetch('http://localhost:3000/api/turn/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: 'Create a Python programming course'
    })
  });

  console.log('Response status:', response.status);
  console.log('Response headers:', response.headers.raw());
  console.log('\n=== SSE Events ===\n');

  const text = await response.text();
  
  // Parse SSE events
  const events = text.split('\n\n').filter(e => e.trim());
  
  let courseDataFound = false;
  let courseDataContent = null;
  
  events.forEach((event, index) => {
    if (event.startsWith('data: ')) {
      const data = event.substring(6);
      try {
        const parsed = JSON.parse(data);
        console.log(`Event ${index + 1}:`, parsed.type);
        
        if (parsed.type === 'course_data') {
          courseDataFound = true;
          courseDataContent = parsed.data;
          console.log('  ✅ COURSE DATA FOUND:', JSON.stringify(parsed.data, null, 2));
        } else if (parsed.type === 'done' && parsed.courseData) {
          console.log('  ✅ COURSE DATA IN DONE MESSAGE:', JSON.stringify(parsed.courseData, null, 2));
          console.log('  Actions:', parsed.actions?.map(a => a.label).join(', '));
        } else if (parsed.type === 'content') {
          console.log('  Content:', parsed.data.substring(0, 50) + '...');
        } else {
          console.log('  Data:', JSON.stringify(parsed).substring(0, 100));
        }
      } catch (e) {
        console.log(`Event ${index + 1}: [Parse Error]`, data.substring(0, 50));
      }
    }
  });
  
  console.log('\n=== Test Results ===');
  console.log('Total events:', events.length);
  console.log('Course data event found:', courseDataFound ? '✅ YES' : '❌ NO');
  
  if (courseDataContent) {
    console.log('\n=== Extracted Course Data ===');
    console.log(JSON.stringify(courseDataContent, null, 2));
  }
}

testCourseCreation().catch(console.error);
