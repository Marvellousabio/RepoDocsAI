import { connectToDatabase, disconnectFromDatabase, getConnectionState } from './database/connection.js';

async function testConnection() {
  console.log('Testing MongoDB connection...');

  try {
    await connectToDatabase();
    console.log('✅ Connection state:', getConnectionState());

    // Test basic database operations
    const { mongoose } = await import('./database/connection.js');
    const db = mongoose.connection.db;

    if (db) {
      const collections = await db.collections();
      console.log(`✅ Database connected. Found ${collections.length} collections.`);
    }

    await disconnectFromDatabase();
    console.log('✅ Connection test completed successfully!');
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    process.exit(1);
  }
}

testConnection();