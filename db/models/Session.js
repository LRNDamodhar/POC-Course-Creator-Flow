const mongoose = require('mongoose');

// Lesson Schema
const lessonSchema = new mongoose.Schema({
  lessonNumber: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  objectives: [{
    type: String
  }],
  duration: {
    type: String,
    required: true
  },
  accepted: {
    type: Boolean,
    default: undefined
  },
  // Template information for this lesson
  template: {
    templateName: String,        // Technical name (e.g., "saq")
    displayName: String,         // User-friendly name (e.g., "Quiz - Multiple Choice")
    templateType: String,
    category: String,
    messageId: String,  // ID of the template message
    linkedAt: Date,
    // Complete filled template JSON
    templateJson: mongoose.Schema.Types.Mixed,
    // Raw template with placeholders
    rawTemplate: mongoose.Schema.Types.Mixed,
    // Metadata about the template recommendation
    metadata: {
      score: Number,
      reason: String,
      usage: String
    }
  }
}, { _id: false });

// Module Schema
const moduleSchema = new mongoose.Schema({
  moduleNumber: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  lessonsCount: {
    type: Number,
    required: true
  },
  lessons: [lessonSchema],
  accepted: {
    type: Boolean,
    default: undefined
  }
}, { _id: false });

// Course Outline Schema
const courseOutlineSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  targetAudience: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  totalModules: {
    type: Number,
    required: true
  },
  totalLessons: {
    type: Number,
    required: true
  },
  modules: [moduleSchema],
  created_at: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    default: 'draft',
    enum: ['draft', 'in_progress', 'completed', 'outlined']
  }
}, { _id: false });

// Course Data Schema (Simple Course)
const courseDataSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  topicArea: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    default: 'draft',
    enum: ['draft', 'published', 'archived']
  }
}, { _id: false });

// Chat Message Schema
const chatMessageSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    required: true,
    enum: ['user', 'assistant', 'system']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['sending', 'sent', 'error', 'accepted', 'rejected']
  },
  toolCalled: {
    type: Boolean,
    default: false
  },
  toolType: {
    type: String,
    enum: ['create_course', 'create_course_outline', 'recommend_templates', null]
  },
  courseData: courseDataSchema,
  courseOutline: courseOutlineSchema,
  templateData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { _id: false });

// Session Schema
const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    index: true
  },
  messages: [chatMessageSchema],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  metadata: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalCourses: {
      type: Number,
      default: 0
    },
    totalOutlines: {
      type: Number,
      default: 0
    },
    userAgent: String,
    ipAddress: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
sessionSchema.index({ createdAt: -1 });
sessionSchema.index({ lastActivity: -1 });
sessionSchema.index({ 'metadata.totalMessages': 1 });

// Instance methods
sessionSchema.methods.addMessage = function(message) {
  this.messages.push(message);
  this.metadata.totalMessages = this.messages.length;
  
  // Update course/outline counts
  if (message.courseData) {
    this.metadata.totalCourses += 1;
  }
  if (message.courseOutline) {
    this.metadata.totalOutlines += 1;
  }
  
  this.lastActivity = new Date();
  this.updatedAt = new Date();
  return this.save();
};

sessionSchema.methods.updateMessage = function(messageId, updates) {
  // Check if messages array exists
  if (!this.messages || !Array.isArray(this.messages)) {
    console.error(`[Session Model] Session ${this.sessionId} has no valid messages array`);
    return Promise.resolve(this);
  }
  
  const message = this.messages.find(m => m.messageId === messageId);
  if (message) {
    Object.assign(message, updates);
    
    // Update counts if needed
    if (updates.courseData && !message.courseData) {
      this.metadata.totalCourses += 1;
    }
    if (updates.courseOutline && !message.courseOutline) {
      this.metadata.totalOutlines += 1;
    }
    
    this.lastActivity = new Date();
    this.updatedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

sessionSchema.methods.clearHistory = function() {
  this.messages = [];
  this.metadata.totalMessages = 0;
  this.metadata.totalCourses = 0;
  this.metadata.totalOutlines = 0;
  this.lastActivity = new Date();
  this.updatedAt = new Date();
  return this.save();
};

sessionSchema.methods.deactivate = function() {
  this.isActive = false;
  this.updatedAt = new Date();
  return this.save();
};

// Static methods
sessionSchema.statics.findBySessionId = function(sessionId) {
  return this.findOne({ sessionId, isActive: true });
};

sessionSchema.statics.getActiveSessions = function(limit = 50) {
  return this.find({ isActive: true })
    .sort({ lastActivity: -1 })
    .limit(limit);
};

sessionSchema.statics.getSessionStats = function(sessionId) {
  return this.findOne({ sessionId })
    .select('metadata sessionId createdAt lastActivity')
    .lean();
};

sessionSchema.statics.cleanupOldSessions = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.updateMany(
    { lastActivity: { $lt: cutoffDate }, isActive: true },
    { $set: { isActive: false, updatedAt: new Date() } }
  );
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
