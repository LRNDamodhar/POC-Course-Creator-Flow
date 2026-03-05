const mongoose = require('mongoose');

// MongoDB connection string - can be configured via environment variable
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cam_chat_db';

// Connection options (updated for Mongoose 6+)
const connectionOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
};

// Connection state
let isConnected = false;

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  if (isConnected) {
    console.log('[Database] Using existing database connection');
    return;
  }

  try {
    console.log('[Database] Connecting to MongoDB...');
    console.log('[Database] Connection URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    const conn = await mongoose.connect(MONGODB_URI, connectionOptions);
    
    isConnected = true;
    console.log(`[Database] ✓ MongoDB Connected: ${conn.connection.host}`);
    console.log(`[Database] Database: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('[Database] ✗ MongoDB connection error:', err);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('[Database] MongoDB disconnected');
      isConnected = false;
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('[Database] ✓ MongoDB reconnected');
      isConnected = true;
    });
    
  } catch (error) {
    console.error('[Database] ✗ Failed to connect to MongoDB:', error.message);
    isConnected = false;
    
    // Don't throw error - allow app to run without database
    console.warn('[Database] ⚠️  Application will run without database persistence');
  }
};

/**
 * Disconnect from MongoDB database
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  if (!isConnected) {
    return;
  }
  
  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('[Database] MongoDB disconnected gracefully');
  } catch (error) {
    console.error('[Database] Error disconnecting from MongoDB:', error);
  }
};

/**
 * Check if database is connected
 * @returns {boolean}
 */
const isDBConnected = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

/**
 * Get database connection status
 * @returns {object}
 */
const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    isConnected: isConnected,
    state: states[mongoose.connection.readyState] || 'unknown',
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name
  };
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

module.exports = {
  connectDB,
  disconnectDB,
  isDBConnected,
  getConnectionStatus
};
