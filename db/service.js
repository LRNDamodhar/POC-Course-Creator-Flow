const Session = require('./models/Session');
const CourseCreation = require('./models/CourseCreation');
const { isDBConnected } = require('./connection');

/**
 * Template Display Name Mapping
 * Maps technical template names to user-friendly display names
 */
const TEMPLATE_DISPLAY_NAMES = {
  // Assessment Templates
  'saq': 'Quiz - Multiple Choice',
  'textSAQ': 'Quiz - Multiple Choice',
  'truefalse': 'Quiz - True/False',
  'trueFalse': 'Quiz - True/False',
  'matching': 'Matching Exercise',
  'dragdrop': 'Drag and Drop Activity',
  'fillblank': 'Fill in the Blanks',
  'essay': 'Essay Question',
  
  // Interactive Templates
  'interactive': 'Interactive Activity',
  'simulation': 'Interactive Simulation',
  'scenario': 'Scenario-Based Learning',
  'case_study': 'Case Study',
  'caseStudy': 'Case Study',
  
  // Media Templates
  'video': 'Video Lesson',
  'audio': 'Audio Content',
  'image': 'Visual Content',
  'slideshow': 'Presentation Slides',
  
  // Text Templates
  'text': 'Reading Material',
  'article': 'Article',
  'reading': 'Reading Assignment',
  'discussion': 'Discussion Topic',
  
  // Practice Templates
  'practice': 'Practice Exercise',
  'lab': 'Hands-On Lab',
  'project': 'Project Assignment',
  'assignment': 'Assignment',
  
  // Default
  'general': 'Learning Activity'
};

/**
 * Get user-friendly display name for template
 * @param {string} templateName - Technical template name
 * @param {string} category - Template category
 * @returns {string} User-friendly display name
 */
function getTemplateDisplayName(templateName, category) {
  // Try exact match first
  if (TEMPLATE_DISPLAY_NAMES[templateName]) {
    return TEMPLATE_DISPLAY_NAMES[templateName];
  }
  
  // Try category match
  if (category && TEMPLATE_DISPLAY_NAMES[category]) {
    return TEMPLATE_DISPLAY_NAMES[category];
  }
  
  // Try lowercase match
  const lowerName = (templateName || '').toLowerCase();
  if (TEMPLATE_DISPLAY_NAMES[lowerName]) {
    return TEMPLATE_DISPLAY_NAMES[lowerName];
  }
  
  // Format template name nicely as fallback
  return templateName
    ? templateName
        .replace(/([A-Z])/g, ' $1') // Add space before capitals
        .replace(/_/g, ' ') // Replace underscores with spaces
        .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize words
        .trim()
    : 'Learning Activity';
}

/**
 * Database Service for handling chat session persistence
 */
class DatabaseService {
  /**
   * Create a new session
   * @param {string} sessionId - Unique session identifier
   * @param {object} metadata - Optional metadata
   * @returns {Promise<object|null>}
   */
  async createSession(sessionId, metadata = {}) {
    if (!isDBConnected()) {
      console.warn('[DB Service] Database not connected, skipping session creation');
      return null;
    }

    try {
      const session = new Session({
        sessionId,
        metadata: {
          ...metadata,
          totalMessages: 0,
          totalCourses: 0,
          totalOutlines: 0
        }
      });

      await session.save();
      console.log(`[DB Service] ✓ Session created: ${sessionId}`);
      return session.toObject();
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error - session already exists
        console.log(`[DB Service] Session already exists: ${sessionId}`);
        return await this.getSession(sessionId);
      }
      console.error('[DB Service] Error creating session:', error);
      return null;
    }
  }

  /**
   * Get session by ID
   * @param {string} sessionId - Session identifier
   * @returns {Promise<object|null>}
   */
  async getSession(sessionId) {
    if (!isDBConnected()) {
      return null;
    }

    try {
      const session = await Session.findBySessionId(sessionId);
      return session ? session.toObject() : null;
    } catch (error) {
      console.error('[DB Service] Error fetching session:', error);
      return null;
    }
  }

  /**
   * Add a message to a session
   * @param {string} sessionId - Session identifier
   * @param {object} message - Message object
   * @returns {Promise<object|null>}
   */
  async addMessage(sessionId, message) {
    if (!isDBConnected()) {
      return null;
    }

    try {
      let session = await Session.findBySessionId(sessionId);
      
      // If session doesn't exist, create it now (when first message is added)
      if (!session) {
        console.log(`[DB Service] Session not found in DB, creating it now: ${sessionId}`);
        session = new Session({
          sessionId,
          userId: null,
          metadata: {
            userAgent: null,
            ipAddress: null,
            totalMessages: 0,
            totalCourses: 0,
            totalOutlines: 0
          }
        });
        await session.save();
        console.log(`[DB Service] ✓ Session created: ${sessionId}`);
      }

      await session.addMessage(message);
      console.log(`[DB Service] ✓ Message added to session: ${sessionId}`);
      return session.toObject();
    } catch (error) {
      console.error('[DB Service] Error adding message:', error);
      return null;
    }
  }

  /**
   * Update a message in a session
   * @param {string} sessionId - Session identifier
   * @param {string} messageId - Message identifier
   * @param {object} updates - Message updates
   * @returns {Promise<object|null>}
   */
  async updateMessage(sessionId, messageId, updates) {
    if (!isDBConnected()) {
      return null;
    }

    try {
      const session = await Session.findBySessionId(sessionId);
      if (!session) {
        console.warn(`[DB Service] Session not found: ${sessionId}`);
        return null;
      }

      await session.updateMessage(messageId, updates);
      console.log(`[DB Service] ✓ Message updated: ${messageId}`);
      return session.toObject();
    } catch (error) {
      console.error('[DB Service] Error updating message:', error);
      return null;
    }
  }

  /**
   * Update message accept/reject status
   * @param {string} sessionId - Session identifier
   * @param {string} messageId - Message identifier
   * @param {string} type - Type of action ('accept' or 'reject')
   * @returns {Promise<object|null>}
   */
  async updateMessageStatus(sessionId, messageId, type) {
    if (!isDBConnected()) {
      return null;
    }

    try {
      const session = await Session.findBySessionId(sessionId);
      if (!session) {
        console.warn(`[DB Service] Session not found: ${sessionId}`);
        return null;
      }

      // Check if messages array exists
      if (!session.messages || !Array.isArray(session.messages)) {
        console.error(`[DB Service] Session ${sessionId} has no valid messages array`);
        return null;
      }

      // Find the message
      const message = session.messages.find(msg => msg.messageId === messageId);
      if (!message) {
        console.warn(`[DB Service] Message not found: ${messageId}`);
        return null;
      }

      // Update status based on type
      const newStatus = type === 'accept' ? 'accepted' : type === 'reject' ? 'rejected' : message.status;
      
      await session.updateMessage(messageId, { 
        status: newStatus,
        updatedAt: new Date()
      });
      
      console.log(`[DB Service] ✓ Message status updated to '${newStatus}': ${messageId}`);
      
      return {
        sessionId: session.sessionId,
        messageId: messageId,
        status: newStatus,
        message: message
      };
    } catch (error) {
      console.error('[DB Service] Error updating message status:', error);
      return null;
    }
  }

  /**
   * Get session history (all messages)
   * @param {string} sessionId - Session identifier
   * @returns {Promise<Array>}
   */
  async getSessionHistory(sessionId) {
    if (!isDBConnected()) {
      return [];
    }

    try {
      const session = await Session.findBySessionId(sessionId);
      return session ? session.messages : [];
    } catch (error) {
      console.error('[DB Service] Error fetching session history:', error);
      return [];
    }
  }

  /**
   * Get session statistics
   * @param {string} sessionId - Session identifier
   * @returns {Promise<object|null>}
   */
  async getSessionStats(sessionId) {
    if (!isDBConnected()) {
      return null;
    }

    try {
      const stats = await Session.getSessionStats(sessionId);
      return stats;
    } catch (error) {
      console.error('[DB Service] Error fetching session stats:', error);
      return null;
    }
  }

  /**
   * Clear session history
   * @param {string} sessionId - Session identifier
   * @returns {Promise<boolean>}
   */
  async clearSessionHistory(sessionId) {
    if (!isDBConnected()) {
      return false;
    }

    try {
      const session = await Session.findBySessionId(sessionId);
      if (!session) {
        console.warn(`[DB Service] Session not found: ${sessionId}`);
        return false;
      }

      await session.clearHistory();
      console.log(`[DB Service] ✓ Session history cleared: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('[DB Service] Error clearing session history:', error);
      return false;
    }
  }

  /**
   * Update session metadata
   * @param {string} sessionId - Session identifier
   * @param {object} updates - Updates to apply to session
   * @returns {Promise<object|null>}
   */
  async updateSession(sessionId, updates) {
    if (!isDBConnected()) {
      return null;
    }

    try {
      const session = await Session.findBySessionId(sessionId);
      if (!session) {
        console.warn(`[DB Service] Session not found: ${sessionId}`);
        return null;
      }

      // Update metadata
      if (session.metadata) {
        Object.assign(session.metadata, updates);
      } else {
        session.metadata = updates;
      }

      // Update lastActivity
      session.lastActivity = new Date();

      await session.save();
      console.log(`[DB Service] ✓ Session updated: ${sessionId}`);
      return session.toObject();
    } catch (error) {
      console.error('[DB Service] Error updating session:', error);
      return null;
    }
  }

  /**
   * Delete/deactivate a session
   * @param {string} sessionId - Session identifier
   * @returns {Promise<boolean>}
   */
  async deleteSession(sessionId) {
    if (!isDBConnected()) {
      return false;
    }

    try {
      const session = await Session.findBySessionId(sessionId);
      if (!session) {
        console.warn(`[DB Service] Session not found: ${sessionId}`);
        return false;
      }

      await session.deactivate();
      console.log(`[DB Service] ✓ Session deactivated: ${sessionId}`);
      return true;
    } catch (error) {
      console.error('[DB Service] Error deleting session:', error);
      return false;
    }
  }

  /**
   * Get all active sessions
   * @param {number} limit - Maximum number of sessions to return
   * @returns {Promise<Array>}
   */
  async getActiveSessions(limit = 50) {
    if (!isDBConnected()) {
      return [];
    }

    try {
      const sessions = await Session.getActiveSessions(limit);
      return sessions.map(s => s.toObject());
    } catch (error) {
      console.error('[DB Service] Error fetching active sessions:', error);
      return [];
    }
  }

  /**
   * Cleanup old inactive sessions
   * @param {number} daysOld - Age threshold in days
   * @returns {Promise<number>}
   */
  async cleanupOldSessions(daysOld = 30) {
    if (!isDBConnected()) {
      return 0;
    }

    try {
      const result = await Session.cleanupOldSessions(daysOld);
      console.log(`[DB Service] ✓ Cleaned up ${result.modifiedCount} old sessions`);
      return result.modifiedCount;
    } catch (error) {
      console.error('[DB Service] Error cleaning up old sessions:', error);
      return 0;
    }
  }

  /**
   * Get course outlines from session
   * @param {string} sessionId - Session identifier
   * @returns {Promise<Array>}
   */
  async getCourseOutlines(sessionId) {
    if (!isDBConnected()) {
      return [];
    }

    try {
      const session = await Session.findBySessionId(sessionId);
      if (!session) {
        return [];
      }

      const outlines = session.messages
        .filter(m => m.courseOutline)
        .map(m => ({
          messageId: m.messageId,
          timestamp: m.timestamp,
          outline: m.courseOutline
        }));

      return outlines;
    } catch (error) {
      console.error('[DB Service] Error fetching course outlines:', error);
      return [];
    }
  }

  /**
   * Get simple courses from session
   * @param {string} sessionId - Session identifier
   * @returns {Promise<Array>}
   */
  async getCourses(sessionId) {
    if (!isDBConnected()) {
      return [];
    }

    try {
      const session = await Session.findBySessionId(sessionId);
      if (!session) {
        return [];
      }

      const courses = session.messages
        .filter(m => m.courseData)
        .map(m => ({
          messageId: m.messageId,
          timestamp: m.timestamp,
          course: m.courseData
        }));

      return courses;
    } catch (error) {
      console.error('[DB Service] Error fetching courses:', error);
      return [];
    }
  }

  /**
   * Get all sessions with optional filtering
   * @param {object} options - Query options
   * @returns {Promise<Array>}
   */
  async getAllSessions(options = {}) {
    if (!isDBConnected()) {
      console.warn('[DB Service] Database not connected');
      return [];
    }

    try {
      const {
        status = 'active',
        limit = 50,
        skip = 0,
        sortBy = 'lastActivity',
        sortOrder = 'desc'
      } = options;

      // Build query - use isActive instead of status
      const query = {};
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'archived') {
        query.isActive = false;
      }
      
      // Exclude empty sessions (sessions with no messages)
      query['messages.0'] = { $exists: true };

      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // Execute query
      const sessions = await Session.find(query)
        .sort(sort)
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .lean();

      // Transform sessions for API response - include messages for title generation
      const transformed = sessions.map(session => {
        // Check if any message has courseData or courseOutline
        const hasCourseData = session.messages?.some(msg => msg.courseData) || false;
        const hasCourseOutline = session.messages?.some(msg => msg.courseOutline) || false;
        
        // Get course data/outline from messages if exists
        const courseDataMsg = session.messages?.find(msg => msg.courseData);
        const courseOutlineMsg = session.messages?.find(msg => msg.courseOutline);
        
        return {
          sessionId: session.sessionId,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          status: session.isActive ? 'active' : 'archived',
          messageCount: session.messages?.length || 0,
          hasCourseData: hasCourseData,
          hasCourseOutline: hasCourseOutline,
          metadata: session.metadata,
          // Include messages (limited to first few for title generation)
          messages: session.messages ? session.messages.slice(0, 3) : [],
          // Include course data/outline for titles
          courseData: courseDataMsg?.courseData || null,
          courseOutline: courseOutlineMsg?.courseOutline || null
        };
      });

      return transformed;
    } catch (error) {
      console.error('[DB Service] Error getting all sessions:', error);
      return [];
    }
  }

  /**
   * Update course data for a session
   * @param {string} sessionId - Session identifier
   * @param {object} courseData - Course data to store
   * @returns {Promise<boolean>}
   */
  async updateCourseData(sessionId, courseData) {
    if (!isDBConnected()) {
      return false;
    }

    try {
      const result = await Session.findOneAndUpdate(
        { sessionId },
        { 
          courseData,
          lastActivity: new Date()
        },
        { new: true }
      );

      if (result) {
        console.log(`[DB Service] ✓ Course data updated for session: ${sessionId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[DB Service] Error updating course data:', error);
      return false;
    }
  }

  /**
   * Update course outline for a session
   * @param {string} sessionId - Session identifier
   * @param {object} courseOutline - Course outline to store
   * @returns {Promise<boolean>}
   */
  async updateCourseOutline(sessionId, courseOutline) {
    if (!isDBConnected()) {
      return false;
    }

    try {
      const result = await Session.findOneAndUpdate(
        { sessionId },
        { 
          courseOutline,
          lastActivity: new Date()
        },
        { new: true }
      );

      if (result) {
        console.log(`[DB Service] ✓ Course outline updated for session: ${sessionId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[DB Service] Error updating course outline:', error);
      return false;
    }
  }

  /**
   * Update course outline status (accept/reject modules and lessons)
   * @param {string} sessionId - Session identifier
   * @param {string} messageId - Message identifier containing the outline
   * @param {object} updatedOutline - Updated outline with accept/reject states
   * @returns {Promise<object|null>}
   */
  async updateCourseOutlineStatus(sessionId, messageId, updatedOutline) {
    if (!isDBConnected()) {
      console.warn('[DB Service] Database not connected, cannot update outline status');
      return null;
    }

    try {
      const session = await Session.findBySessionId(sessionId);
      if (!session) {
        console.warn(`[DB Service] Session not found: ${sessionId}`);
        return null;
      }

      // Check if messages array exists
      if (!session.messages || !Array.isArray(session.messages)) {
        console.error(`[DB Service] Session ${sessionId} has no valid messages array`);
        return null;
      }

      // Find the message with the course outline
      const message = session.messages.find(msg => msg.messageId === messageId);
      if (!message) {
        console.warn(`[DB Service] Message not found: ${messageId}`);
        return null;
      }

      if (!message.courseOutline) {
        console.warn(`[DB Service] Message ${messageId} has no course outline`);
        return null;
      }

      // Update the course outline with new accept/reject states
      await session.updateMessage(messageId, {
        courseOutline: updatedOutline,
        updatedAt: new Date()
      });

      console.log(`[DB Service] ✓ Course outline status updated for message: ${messageId}`);
      console.log(`[DB Service] Modules with accepted status: ${updatedOutline.modules?.filter(m => m.accepted === true).length || 0}`);
      console.log(`[DB Service] Modules with rejected status: ${updatedOutline.modules?.filter(m => m.accepted === false).length || 0}`);

      return {
        sessionId: session.sessionId,
        messageId: messageId,
        outline: updatedOutline,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('[DB Service] Error updating course outline status:', error);
      return null;
    }
  }

  /**
   * ========================================
   * COURSE CREATION COLLECTION METHODS
   * ========================================
   */

  /**
   * Create a new course creation record
   * @param {string} sessionId - Session identifier
   * @param {string} messageId - Message identifier
   * @param {string} userPrompt - User's prompt
   * @param {string} agentResponse - Agent's response
   * @param {object} courseData - Course data object
   * @returns {Promise<object|null>}
   */
  async createCourseCreation(sessionId, messageId, userPrompt, agentResponse, courseData) {
    if (!isDBConnected()) {
      console.warn('[DB Service] Database not connected, skipping course creation record');
      return null;
    }

    try {
      const courseCreation = new CourseCreation({
        sessionId,
        createCourseResponse: {
          messageId,
          userPrompt,
          agentResponse,
          courseData,
          toolExecutionTime: new Date(),
          accepted: false
        },
        status: 'course_created'
      });

      await courseCreation.save();
      console.log(`[DB Service] ✓ Course creation record created for session: ${sessionId}`);
      return courseCreation.toObject();
    } catch (error) {
      console.error('[DB Service] Error creating course creation record:', error);
      return null;
    }
  }

  /**
   * Add outline response to existing course creation
   * @param {string} sessionId - Session identifier
   * @param {string} messageId - Message identifier
   * @param {string} userPrompt - User's prompt
   * @param {string} agentResponse - Agent's response
   * @param {object} courseOutline - Course outline object
   * @returns {Promise<object|null>}
   */
  async addOutlineToCourseCreation(sessionId, messageId, userPrompt, agentResponse, courseOutline) {
    if (!isDBConnected()) {
      return null;
    }

    try {
      // Find the most recent course creation for this session
      const courseCreation = await CourseCreation.findOne({ sessionId })
        .sort({ createdAt: -1 });

      if (!courseCreation) {
        console.warn(`[DB Service] No course creation found for session: ${sessionId}`);
        return null;
      }

      await courseCreation.addOutlineResponse(messageId, userPrompt, agentResponse, courseOutline);
      console.log(`[DB Service] ✓ Outline added to course creation for session: ${sessionId}`);
      return courseCreation.toObject();
    } catch (error) {
      console.error('[DB Service] Error adding outline to course creation:', error);
      return null;
    }
  }

  /**
   * Mark course as accepted with CMS data
   * @param {string} sessionId - Session identifier
   * @param {object} cmsData - CMS response data
   * @returns {Promise<object|null>}
   */
  async markCourseAccepted(sessionId, cmsData) {
    if (!isDBConnected()) {
      return null;
    }

    try {
      const courseCreation = await CourseCreation.findOne({ sessionId })
        .sort({ createdAt: -1 });

      if (!courseCreation) {
        console.warn(`[DB Service] No course creation found for session: ${sessionId}`);
        return null;
      }

      await courseCreation.markCourseAccepted(cmsData);
      console.log(`[DB Service] ✓ Course marked as accepted for session: ${sessionId}`);
      return courseCreation.toObject();
    } catch (error) {
      console.error('[DB Service] Error marking course as accepted:', error);
      return null;
    }
  }

  /**
   * Get all course creations for a session
   * @param {string} sessionId - Session identifier
   * @returns {Promise<Array>}
   */
  async getCourseCreationsBySession(sessionId) {
    if (!isDBConnected()) {
      return [];
    }

    try {
      const creations = await CourseCreation.findBySessionId(sessionId);
      console.log(`[DB Service] ✓ Found ${creations.length} course creations for session: ${sessionId}`);
      return creations.map(c => c.toObject());
    } catch (error) {
      console.error('[DB Service] Error fetching course creations:', error);
      return [];
    }
  }

  /**
   * Get course creation by catalog system ID
   * @param {string} catalogSystemId - Catalog system identifier
   * @returns {Promise<object|null>}
   */
  async getCourseCreationByCatalogId(catalogSystemId) {
    if (!isDBConnected()) {
      return null;
    }

    try {
      const creation = await CourseCreation.findByCatalogSystemId(catalogSystemId);
      return creation ? creation.toObject() : null;
    } catch (error) {
      console.error('[DB Service] Error fetching course creation by catalog ID:', error);
      return null;
    }
  }

  /**
   * Get recent course creations
   * @param {number} limit - Maximum number of records to return
   * @returns {Promise<Array>}
   */
  async getRecentCourseCreations(limit = 10) {
    if (!isDBConnected()) {
      return [];
    }

    try {
      const creations = await CourseCreation.getRecentCreations(limit);
      return creations.map(c => c.toObject());
    } catch (error) {
      console.error('[DB Service] Error fetching recent course creations:', error);
      return [];
    }
  }

  /**
   * Accept or reject template for a specific lesson and update outline
   * @param {string} sessionId - Session identifier
   * @param {string} messageId - Template message ID
   * @param {object} lessonInfo - { moduleNumber, lessonNumber, module, lesson }
   * @param {object} templateData - Full template data from agent
   * @param {string} type - 'accept' or 'reject'
   * @returns {Promise<object|null>}
   */
  async acceptTemplateForLesson(sessionId, messageId, lessonInfo, templateData, type) {
    if (!isDBConnected()) {
      console.warn('[DB Service] Database not connected, skipping template acceptance');
      return null;
    }

    try {
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`[DB Service] ${type === 'accept' ? 'ACCEPTING' : 'REJECTING'} TEMPLATE FOR LESSON`);
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[DB Service] Session ID:', sessionId);
      console.log('[DB Service] Message ID:', messageId);
      console.log('[DB Service] Lesson Info:', JSON.stringify(lessonInfo, null, 2));
      console.log('[DB Service] Template:', templateData?.templateName);

      // Get the session
      const session = await Session.findBySessionId(sessionId);
      if (!session) {
        console.error(`[DB Service] ❌ Session not found: ${sessionId}`);
        return null;
      }
      console.log(`[DB Service] ✓ Session found with ${session.messages?.length || 0} messages`);

      // Check if messages array exists
      if (!session.messages || !Array.isArray(session.messages)) {
        console.error(`[DB Service] ❌ Session ${sessionId} has no valid messages array`);
        return null;
      }

      // Find the course outline in messages
      let outlineMessage = null;
      for (const msg of session.messages) {
        if (msg.courseOutline && msg.courseOutline.modules) {
          outlineMessage = msg;
          console.log(`[DB Service] ✓ Found outline in message: ${msg.messageId}`);
          console.log(`[DB Service] Outline has ${msg.courseOutline.modules.length} modules`);
          break;
        }
      }

      if (!outlineMessage) {
        console.error(`[DB Service] ❌ No course outline found in session: ${sessionId}`);
        return null;
      }

      // Find and update the specific lesson
      let lessonFound = false;
      let updatedLesson = null;
      const outline = outlineMessage.courseOutline;
      
      console.log('[DB Service] Searching for lesson...');
      console.log(`[DB Service] Looking for module: "${lessonInfo.module}" or number: ${lessonInfo.moduleNumber}`);
      console.log(`[DB Service] Looking for lesson: "${lessonInfo.lesson}" or number: ${lessonInfo.lessonNumber}`);
      
      for (const module of outline.modules) {
        // Match by module number or title
        const moduleMatches = 
          (lessonInfo.moduleNumber && module.moduleNumber === lessonInfo.moduleNumber) ||
          (lessonInfo.module && module.title && module.title.toLowerCase().includes(lessonInfo.module.toLowerCase()));

        console.log(`[DB Service] Checking Module ${module.moduleNumber}: "${module.title}"`);
        console.log(`[DB Service] Module matches? ${moduleMatches}`);

        if (moduleMatches && module.lessons) {
          console.log(`[DB Service] ✓ Module matched! Checking ${module.lessons.length} lessons...`);
          
          for (const lesson of module.lessons) {
            // Match by lesson number or title
            const lessonMatches =
              (lessonInfo.lessonNumber && lesson.lessonNumber === lessonInfo.lessonNumber) ||
              (lessonInfo.lesson && lesson.title && lesson.title.toLowerCase().includes(lessonInfo.lesson.toLowerCase()));

            console.log(`[DB Service]   Checking Lesson ${lesson.lessonNumber}: "${lesson.title}"`);
            console.log(`[DB Service]   Lesson matches? ${lessonMatches}`);

            if (lessonMatches) {
              if (type === 'accept') {
                // Get user-friendly display name
                const displayName = getTemplateDisplayName(
                  templateData.templateName,
                  templateData.category
                );
                
                // Add template property with complete JSON data
                lesson.template = {
                  templateName: templateData.templateName,
                  displayName: displayName, // User-friendly name
                  templateType: templateData.category || templateData.templateType || 'general',
                  category: templateData.category,
                  messageId: messageId,
                  linkedAt: new Date(),
                  // Store the complete template structure
                  templateJson: templateData.filledTemplate || templateData.template || null,
                  // Store the raw template (with placeholders) if available
                  rawTemplate: templateData.recommendations?.[0]?.template || templateData.template || null,
                  // Store metadata
                  metadata: {
                    score: templateData.recommendations?.[0]?.score || templateData.score,
                    reason: templateData.recommendations?.[0]?.reason || templateData.reason,
                    usage: templateData.recommendations?.[0]?.usage || templateData.usage
                  }
                };
              } else if (type === 'reject') {
                // Remove template on reject
                lesson.template = undefined;
              }
              
              updatedLesson = lesson;
              lessonFound = true;
              console.log(`[DB Service] ✓✓✓ Template ${type}ed for lesson: ${lesson.title}`);
              console.log(`[DB Service] Template data saved:`, JSON.stringify({
                templateName: lesson.template?.templateName,
                displayName: lesson.template?.displayName,
                templateType: lesson.template?.templateType,
                category: lesson.template?.category,
                hasTemplateJson: !!lesson.template?.templateJson,
                hasRawTemplate: !!lesson.template?.rawTemplate,
                metadata: lesson.template?.metadata
              }, null, 2));
              break;
            }
          }
          if (lessonFound) break;
        }
      }

      if (!lessonFound) {
        console.error(`[DB Service] ❌ Lesson not found in outline!`);
        console.error(`[DB Service] Searched for:`, lessonInfo);
        console.error(`[DB Service] Available modules:`, outline.modules.map(m => ({
          number: m.moduleNumber,
          title: m.title,
          lessons: m.lessons.map(l => ({ number: l.lessonNumber, title: l.title }))
        })));
        return null;
      }

      // Mark the entire courseOutline path as modified for Mongoose
      const messageIndex = session.messages.findIndex(m => m.messageId === outlineMessage.messageId);
      if (messageIndex !== -1) {
        session.markModified(`messages.${messageIndex}.courseOutline`);
        
        // Update the message's lastModified timestamp
        session.messages[messageIndex].lastModified = new Date();
        
        console.log('[DB Service] Saving updated outline to database...');
        console.log('[DB Service] Marked path as modified: messages.' + messageIndex + '.courseOutline');
        
        // Save the session directly
        await session.save();
        console.log('[DB Service] ✓ Outline saved successfully');
      } else {
        console.error('[DB Service] ❌ Could not find message index for:', outlineMessage.messageId);
        return null;
      }

      // Update the template message status and link back to lesson
      console.log('[DB Service] Updating template message status...');
      await session.updateMessage(messageId, {
        status: type === 'accept' ? 'accepted' : 'rejected',
        linkedToLesson: {
          moduleNumber: lessonInfo.moduleNumber || null,
          moduleName: lessonInfo.module || null,
          lessonNumber: lessonInfo.lessonNumber || null,
          lessonName: lessonInfo.lesson || null,
          linkedAt: new Date(),
          linkType: type
        }
      });
      console.log('[DB Service] ✓ Template message updated');

      console.log('═══════════════════════════════════════════════════════════');
      console.log(`[DB Service] ✅ TEMPLATE ${type.toUpperCase()} COMPLETE`);
      console.log('═══════════════════════════════════════════════════════════');
      
      return {
        sessionId: session.sessionId,
        messageId: messageId,
        lessonInfo: lessonInfo,
        templateData: templateData,
        updatedLesson: updatedLesson,
        status: type
      };
    } catch (error) {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[DB Service] ❌ ERROR ACCEPTING TEMPLATE FOR LESSON');
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[DB Service] Error:', error.message);
      console.error('[DB Service] Stack:', error.stack);
      return null;
    }
  }

  /**
   * Link a lesson with template data
   * @param {string} sessionId - Session identifier
   * @param {string} messageId - Message identifier containing the template data
   * @param {object} lessonInfo - Lesson information (module, lesson, topic)
   * @param {object} templateData - Template data (templateName, filledTemplate, etc.)
   * @returns {Promise<object|null>}
   */
  async linkLessonWithTemplate(sessionId, messageId, lessonInfo, templateData) {
    if (!isDBConnected()) {
      console.warn('[DB Service] Database not connected, skipping lesson-template link');
      return null;
    }

    try {
      console.log(`[DB Service] Linking lesson with template for session: ${sessionId}`);
      console.log(`[DB Service] Lesson info:`, lessonInfo);
      console.log(`[DB Service] Template:`, templateData.templateName);

      // Get the session
      const session = await Session.findBySessionId(sessionId);
      if (!session) {
        console.warn(`[DB Service] Session not found: ${sessionId}`);
        return null;
      }

      // Find the course outline in messages
      let outlineMessage = null;
      for (const msg of session.messages) {
        if (msg.courseOutline && msg.courseOutline.modules) {
          outlineMessage = msg;
          break;
        }
      }

      if (!outlineMessage) {
        console.warn(`[DB Service] No course outline found in session: ${sessionId}`);
        return null;
      }

      // Find and update the specific lesson
      let lessonFound = false;
      const outline = outlineMessage.courseOutline;
      
      for (const module of outline.modules) {
        // Match by module number or title
        const moduleMatches = 
          (lessonInfo.moduleNumber && module.moduleNumber === lessonInfo.moduleNumber) ||
          (lessonInfo.module && module.title && module.title.toLowerCase().includes(lessonInfo.module.toLowerCase()));

        if (moduleMatches && module.lessons) {
          for (const lesson of module.lessons) {
            // Match by lesson number or title
            const lessonMatches =
              (lessonInfo.lessonNumber && lesson.lessonNumber === lessonInfo.lessonNumber) ||
              (lessonInfo.lesson && lesson.title && lesson.title.toLowerCase().includes(lessonInfo.lesson.toLowerCase()));

            if (lessonMatches) {
              // Add template data to lesson
              lesson.templateData = {
                messageId: messageId,
                templateName: templateData.templateName,
                templateCategory: templateData.category,
                assignedAt: new Date(),
                ...templateData
              };
              lessonFound = true;
              console.log(`[DB Service] ✓ Template linked to lesson: ${lesson.title}`);
              break;
            }
          }
          if (lessonFound) break;
        }
      }

      if (!lessonFound) {
        console.warn(`[DB Service] Lesson not found in outline:`, lessonInfo);
        return null;
      }

      // Mark the outline message as modified
      await session.updateMessage(outlineMessage.messageId, {
        courseOutline: outline,
        lastModified: new Date()
      });

      // Also update the template message to link back to the lesson
      await session.updateMessage(messageId, {
        linkedToLesson: {
          moduleNumber: lessonInfo.moduleNumber,
          moduleName: lessonInfo.module,
          lessonNumber: lessonInfo.lessonNumber,
          lessonName: lessonInfo.lesson,
          linkedAt: new Date()
        }
      });

      console.log(`[DB Service] ✓ Lesson-template link created successfully`);
      return session.toObject();
    } catch (error) {
      console.error('[DB Service] Error linking lesson with template:', error);
      return null;
    }
  }
}

// Export singleton instance
module.exports = new DatabaseService();

// Export utility functions
module.exports.getTemplateDisplayName = getTemplateDisplayName;
