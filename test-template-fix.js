#!/usr/bin/env node

/**
 * Test Template Fix - Verify template save works with the fixed code
 * 
 * This script:
 * 1. Connects to MongoDB
 * 2. Tests the fixed acceptTemplateForLesson() method
 * 3. Verifies template data is saved to database
 * 4. Shows before/after state
 */

const mongoose = require('mongoose');
const service = require('./db/service');

const MONGODB_URI = 'mongodb://localhost:27017/cam_chat_db';
const TEST_SESSION_ID = 'session_1769617185705_mvu4isuq0';

async function testTemplateFix() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🧪 TESTING TEMPLATE FIX');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get the session
    console.log(`📂 Loading session: ${TEST_SESSION_ID}`);
    const Session = require('./db/models/Session');
    const session = await Session.findBySessionId(TEST_SESSION_ID);
    
    if (!session) {
      console.log('❌ Session not found!');
      console.log('\nCreate a new session by:');
      console.log('1. Open http://localhost:4200');
      console.log('2. Run: "create course outline for ethics in ai"');
      console.log('3. Run: "suggest template for module 1 lesson 1"');
      process.exit(1);
    }
    
    console.log(`✓ Session found with ${session.messages.length} messages\n`);

    // Find the outline message
    const outlineMessage = session.messages.find(m => m.courseOutline?.modules);
    if (!outlineMessage) {
      console.log('❌ No course outline found in session');
      process.exit(1);
    }
    
    const module = outlineMessage.courseOutline.modules[0];
    const lesson = module.lessons[0];
    
    console.log('📊 BEFORE STATE:');
    console.log(`   Module: ${module.title}`);
    console.log(`   Lesson: ${lesson.title}`);
    console.log(`   Has template? ${!!lesson.template}`);
    if (lesson.template) {
      console.log(`   Template: ${JSON.stringify(lesson.template, null, 2)}`);
    }
    console.log();

    // Test the acceptTemplateForLesson method
    console.log('🔧 Calling acceptTemplateForLesson()...\n');
    
    const lessonInfo = {
      module: module.title,
      lesson: lesson.title
    };
    
    const templateData = {
      templateName: 'saq',
      category: 'interactive',
      templateType: 'interactive'
    };
    
    const messageId = 'test_msg_' + Date.now();
    
    await service.acceptTemplateForLesson(
      TEST_SESSION_ID,
      messageId,
      lessonInfo,
      templateData,
      'accept'
    );

    // Reload session from database
    console.log('\n📊 Fetching updated session from database...');
    const updatedSession = await Session.findBySessionId(TEST_SESSION_ID);
    const updatedOutline = updatedSession.messages.find(m => m.courseOutline?.modules);
    const updatedModule = updatedOutline.courseOutline.modules[0];
    const updatedLesson = updatedModule.lessons[0];
    
    console.log('\n📊 AFTER STATE:');
    console.log(`   Module: ${updatedModule.title}`);
    console.log(`   Lesson: ${updatedLesson.title}`);
    console.log(`   Has template? ${!!updatedLesson.template}`);
    if (updatedLesson.template) {
      console.log(`   Template: ${JSON.stringify(updatedLesson.template, null, 2)}`);
    } else {
      console.log('   ❌ Template field is MISSING!');
    }
    console.log();

    // Verify success
    if (updatedLesson.template) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ SUCCESS! Template saved to database');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('\n✓ Template Name:', updatedLesson.template.templateName);
      console.log('✓ Template Type:', updatedLesson.template.templateType);
      console.log('✓ Category:', updatedLesson.template.category);
      console.log('✓ Message ID:', updatedLesson.template.messageId);
      console.log('✓ Linked At:', updatedLesson.template.linkedAt);
      console.log('\n🎯 Next Steps:');
      console.log('1. Start backend: npm start');
      console.log('2. Open app: http://localhost:4200');
      console.log('3. Load your session from history');
      console.log('4. You should see a purple badge: 📄 interactive');
      console.log('5. If not, accept another template to trigger UI refresh');
    } else {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('❌ FAILED - Template NOT saved to database');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('\n🔍 Check:');
      console.log('1. Backend console logs for errors');
      console.log('2. MongoDB connection is active');
      console.log('3. Session schema has template field');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

// Run the test
testTemplateFix();
