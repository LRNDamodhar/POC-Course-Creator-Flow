/**
 * Test script for database endpoints
 * Run this after starting the backend server
 */

const BASE_URL = 'http://localhost:3000';

// Helper function to make requests
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`\n📡 ${options.method || 'GET'} ${endpoint}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    console.log(`✅ Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    console.error(`❌ Request failed:`, error.message);
    return { success: false, error: error.message };
  }
}

// Test suite
async function runTests() {
  console.log('🧪 Starting Database Endpoints Test Suite\n');
  console.log('='.repeat(60));
  
  let testSessionId = null;
  
  // Test 1: Create a new session
  console.log('\n📝 Test 1: Create New Session');
  const createResult = await makeRequest('/api/session/create', {
    method: 'POST',
    body: JSON.stringify({
      userId: 'test-user-123',
      userAgent: 'test-script/1.0'
    })
  });
  
  if (createResult.success && createResult.data.sessionId) {
    testSessionId = createResult.data.sessionId;
    console.log(`✅ Session created: ${testSessionId}`);
    console.log(`   Persistence enabled: ${createResult.data.persistenceEnabled}`);
  } else {
    console.error('❌ Failed to create session');
    return;
  }
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: Send a message (trigger course creation)
  console.log('\n📝 Test 2: Send Message to Create Course');
  const messageResult = await makeRequest('/api/workflow', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: testSessionId,
      message: 'Create a course about JavaScript basics for beginners'
    })
  });
  
  // Note: This is a streaming endpoint, so we'll check history next
  console.log('Message sent (streaming response)');
  
  // Wait for processing
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test 3: Get session history from memory
  console.log('\n📝 Test 3: Get Session History (Memory)');
  const historyMemory = await makeRequest(`/api/session/${testSessionId}/history?source=memory`);
  if (historyMemory.success) {
    console.log(`✅ Found ${historyMemory.data.totalMessages} messages in memory`);
  }
  
  // Test 4: Get session history from database
  console.log('\n📝 Test 4: Get Session History (Database)');
  const historyDb = await makeRequest(`/api/session/${testSessionId}/history?source=db`);
  if (historyDb.success) {
    console.log(`✅ Found ${historyDb.data.totalMessages} messages in database`);
    console.log(`   Data source: ${historyDb.data.source}`);
  }
  
  // Test 5: Get full session data
  console.log('\n📝 Test 5: Get Full Session Data');
  const fullSession = await makeRequest(`/api/session/${testSessionId}/full`);
  if (fullSession.success) {
    const session = fullSession.data.session;
    console.log(`✅ Session details:`);
    console.log(`   Created: ${session.createdAt}`);
    console.log(`   Messages: ${session.messageCount}`);
    console.log(`   Has Course Data: ${!!session.courseData}`);
    console.log(`   Has Course Outline: ${!!session.courseOutline}`);
    
    if (session.courseData) {
      console.log(`\n📚 Course Data:`);
      console.log(JSON.stringify(session.courseData, null, 2));
    }
    
    if (session.courseOutline) {
      console.log(`\n📋 Course Outline:`);
      console.log(JSON.stringify(session.courseOutline, null, 2));
    }
  }
  
  // Test 6: Get all sessions
  console.log('\n📝 Test 6: Get All Sessions');
  const allSessions = await makeRequest('/api/sessions/all?limit=10');
  if (allSessions.success) {
    console.log(`✅ Found ${allSessions.data.total} sessions`);
    allSessions.data.sessions.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.sessionId} - ${s.messageCount} messages (Course: ${s.hasCourseData}, Outline: ${s.hasCourseOutline})`);
    });
  }
  
  // Test 7: Get session stats
  console.log('\n📝 Test 7: Get Session Stats');
  const stats = await makeRequest(`/api/session/${testSessionId}/stats`);
  if (stats.success) {
    console.log(`✅ Session stats:`, stats.data.stats);
  }
  
  // Test 8: Delete session
  console.log('\n📝 Test 8: Delete Session');
  const deleteResult = await makeRequest(`/api/session/${testSessionId}`, {
    method: 'DELETE'
  });
  if (deleteResult.success) {
    console.log(`✅ Session deleted successfully`);
  }
  
  // Test 9: Verify deletion
  console.log('\n📝 Test 9: Verify Session Deleted');
  const verifyDelete = await makeRequest(`/api/session/${testSessionId}/full`);
  if (verifyDelete.status === 404) {
    console.log(`✅ Session successfully removed from database`);
  } else {
    console.log(`⚠️ Session still exists after deletion`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Test suite completed!\n');
}

// Run the tests
runTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
