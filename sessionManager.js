/**
 * Session Manager
 * 
 * Manages agent sessions and conversation history
 * Each session maintains its own conversation context
 */

class SessionManager {
  constructor() {
    // Store sessions in memory (in production, use a database)
    this.sessions = new Map();
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
  }

  /**
   * Create a new session
   * @returns {string} sessionId
   */
  createSession() {
    const sessionId = this.generateSessionId();
    const session = {
      id: sessionId,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      conversationHistory: [],
      metadata: {}
    };
    
    this.sessions.set(sessionId, session);
    console.log(`[SessionManager] Created new session: ${sessionId}`);
    
    return sessionId;
  }

  /**
   * Get a session by ID
   * @param {string} sessionId
   * @returns {object|null} session
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      console.log(`[SessionManager] Session not found: ${sessionId}`);
      return null;
    }

    // Check if session has expired
    const now = new Date();
    const timeSinceLastAccess = now - session.lastAccessedAt;
    
    if (timeSinceLastAccess > this.sessionTimeout) {
      console.log(`[SessionManager] Session expired: ${sessionId}`);
      this.sessions.delete(sessionId);
      return null;
    }

    // Update last accessed time
    session.lastAccessedAt = now;
    return session;
  }

  /**
   * Add a message to the conversation history
   * @param {string} sessionId
   * @param {string} role - 'user' or 'assistant'
   * @param {string} content - message content
   * @param {object} metadata - additional metadata
   */
  addMessage(sessionId, role, content, metadata = {}) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Use correct content type based on role
    // User messages: 'input_text', Assistant messages: 'text'
    const contentType = role === 'user' ? 'input_text' : 'text';

    const message = {
      role,
      content: [{ type: contentType, text: content }],
      timestamp: new Date(),
      metadata
    };

    session.conversationHistory.push(message);
    console.log(`[SessionManager] Added ${role} message to session ${sessionId}`);
    
    return message;
  }

  /**
   * Get conversation history for a session
   * @param {string} sessionId
   * @param {number} limit - optional limit on number of messages
   * @returns {array} conversation history
   */
  getConversationHistory(sessionId, limit = null) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return [];
    }

    const history = session.conversationHistory;
    
    if (limit && limit > 0) {
      return history.slice(-limit);
    }
    
    return history;
  }

  /**
   * Update session metadata
   * @param {string} sessionId
   * @param {object} metadata
   */
  updateMetadata(sessionId, metadata) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.metadata = { ...session.metadata, ...metadata };
    console.log(`[SessionManager] Updated metadata for session ${sessionId}`);
  }

  /**
   * Clear conversation history for a session
   * @param {string} sessionId
   */
  clearHistory(sessionId) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.conversationHistory = [];
    console.log(`[SessionManager] Cleared history for session ${sessionId}`);
  }

  /**
   * Delete a session
   * @param {string} sessionId
   */
  deleteSession(sessionId) {
    const deleted = this.sessions.delete(sessionId);
    
    if (deleted) {
      console.log(`[SessionManager] Deleted session: ${sessionId}`);
    }
    
    return deleted;
  }

  /**
   * Get all active sessions
   * @returns {array} list of session IDs
   */
  getActiveSessions() {
    return Array.from(this.sessions.keys());
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = new Date();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      const timeSinceLastAccess = now - session.lastAccessedAt;
      
      if (timeSinceLastAccess > this.sessionTimeout) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[SessionManager] Cleaned up ${cleanedCount} expired session(s)`);
    }
    
    return cleanedCount;
  }

  /**
   * Generate a unique session ID
   * @returns {string}
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get session statistics
   * @param {string} sessionId
   * @returns {object} statistics
   */
  getSessionStats(sessionId) {
    const session = this.getSession(sessionId);
    
    if (!session) {
      return null;
    }

    const userMessages = session.conversationHistory.filter(m => m.role === 'user').length;
    const assistantMessages = session.conversationHistory.filter(m => m.role === 'assistant').length;
    const duration = new Date() - session.createdAt;

    return {
      sessionId: session.id,
      createdAt: session.createdAt,
      lastAccessedAt: session.lastAccessedAt,
      duration: Math.floor(duration / 1000), // in seconds
      totalMessages: session.conversationHistory.length,
      userMessages,
      assistantMessages,
      metadata: session.metadata
    };
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

// Run cleanup every 5 minutes
setInterval(() => {
  sessionManager.cleanupExpiredSessions();
}, 5 * 60 * 1000);

module.exports = sessionManager;
