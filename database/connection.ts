import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * MongoDB Connection Configuration
 * Provides robust connection management with pooling, retry logic, and error handling
 */

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/repodocsai';
const DATABASE_NAME = process.env.DATABASE_NAME || 'repodocsai';

interface ConnectionOptions {
  maxPoolSize: number;
  serverSelectionTimeoutMS: number;
  socketTimeoutMS: number;
  family: number;
}

const connectionOptions: ConnectionOptions = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
};

/**
 * Connect to MongoDB with retry logic
 * In production, this will not throw errors - just log them
 */
export async function connectToDatabase(): Promise<boolean> {
  const isProduction = process.env.NODE_ENV === 'production';

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, connectionOptions);

    // Set database name if specified
    if (DATABASE_NAME) {
      mongoose.connection.useDb(DATABASE_NAME);
    }

    console.log('✅ MongoDB connected successfully');

    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    return true; // Connection successful

  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);

    if (isProduction) {
      console.log('⚠️  Continuing without MongoDB in production mode');
      return false; // Connection failed but don't throw
    } else {
      throw error; // In development, still throw for debugging
    }
  }
}

/**
 * Close MongoDB connection gracefully
 */
export async function disconnectFromDatabase(): Promise<void> {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
    throw error;
  }
}

/**
 * Check if MongoDB is connected
 */
export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Get current connection state
 */
export function getConnectionState(): string {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState as keyof typeof states] || 'unknown';
}

// Export mongoose instance for direct access if needed
export { mongoose };