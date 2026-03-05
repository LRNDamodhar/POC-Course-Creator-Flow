const mongoose = require('mongoose');

// Course Creation Schema - Stores complete course creation history
const courseCreationSchema = new mongoose.Schema({
  // Session Information
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  
  // Catalog System Information
  catalogSystemId: {
    type: String,
    required: false // Will be set after acceptance
  },
  siteId: {
    type: String,
    required: false
  },
  catId: {
    type: String,
    required: false
  },
  baseCatId: {
    type: String,
    required: false
  },
  coursePath: {
    type: String,
    required: false
  },
  courseStatus: {
    type: String,
    required: false
  },
  courseTitle: {
    type: String,
    required: false
  },
  
  // Agent Response for Create Course
  createCourseResponse: {
    messageId: {
      type: String,
      required: true
    },
    userPrompt: {
      type: String,
      required: true
    },
    agentResponse: {
      type: String,
      required: true
    },
    courseData: {
      title: String,
      description: String,
      topicArea: String,
      status: String
    },
    toolExecutionTime: {
      type: Date,
      default: Date.now
    },
    accepted: {
      type: Boolean,
      default: false
    },
    acceptedAt: {
      type: Date,
      required: false
    }
  },
  
  // Agent Response for Create Course Outline
  createOutlineResponse: {
    messageId: {
      type: String,
      required: false
    },
    userPrompt: {
      type: String,
      required: false
    },
    agentResponse: {
      type: String,
      required: false
    },
    courseOutline: {
      title: String,
      description: String,
      targetAudience: String,
      duration: String,
      totalModules: Number,
      totalLessons: Number,
      modules: [{
        moduleNumber: Number,
        title: String,
        description: String,
        lessonsCount: Number,
        lessons: [{
          lessonNumber: Number,
          title: String,
          objectives: [String],
          duration: String,
          accepted: Boolean
        }],
        accepted: Boolean
      }],
      status: String
    },
    toolExecutionTime: {
      type: Date,
      required: false
    },
    accepted: {
      type: Boolean,
      default: false
    },
    acceptedAt: {
      type: Date,
      required: false
    }
  },
  
  // CMS Response Data (After Acceptance)
  cmsResponse: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Overall Status
  status: {
    type: String,
    enum: ['draft', 'course_created', 'outline_created', 'accepted', 'published'],
    default: 'draft',
    index: true
  }
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
  collection: 'course_creations'
});

// Indexes for better query performance
courseCreationSchema.index({ sessionId: 1, createdAt: -1 });
courseCreationSchema.index({ catalogSystemId: 1 });
courseCreationSchema.index({ status: 1, createdAt: -1 });

// Instance Methods
courseCreationSchema.methods.markCourseAccepted = function(cmsData) {
  this.createCourseResponse.accepted = true;
  this.createCourseResponse.acceptedAt = new Date();
  this.catalogSystemId = cmsData.systemId;
  this.siteId = cmsData.siteId;
  this.catId = cmsData.catId;
  this.baseCatId = cmsData.baseCatId;
  this.coursePath = cmsData.coursePath;
  this.courseStatus = cmsData.courseStatus;
  this.courseTitle = cmsData.courseTitle;
  this.cmsResponse = cmsData.cmsResponse;
  this.status = 'accepted';
  this.updatedAt = new Date();
  return this.save();
};

courseCreationSchema.methods.markOutlineAccepted = function() {
  this.createOutlineResponse.accepted = true;
  this.createOutlineResponse.acceptedAt = new Date();
  this.status = 'outline_created';
  this.updatedAt = new Date();
  return this.save();
};

courseCreationSchema.methods.addOutlineResponse = function(messageId, userPrompt, agentResponse, courseOutline) {
  this.createOutlineResponse = {
    messageId,
    userPrompt,
    agentResponse,
    courseOutline,
    toolExecutionTime: new Date(),
    accepted: false
  };
  this.status = 'outline_created';
  this.updatedAt = new Date();
  return this.save();
};

// Static Methods
courseCreationSchema.statics.findBySessionId = function(sessionId) {
  return this.find({ sessionId }).sort({ createdAt: -1 });
};

courseCreationSchema.statics.findByCatalogSystemId = function(catalogSystemId) {
  return this.findOne({ catalogSystemId });
};

courseCreationSchema.statics.getRecentCreations = function(limit = 10) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('sessionId catalogSystemId courseTitle status createdAt');
};

const CourseCreation = mongoose.model('CourseCreation', courseCreationSchema);

module.exports = CourseCreation;
