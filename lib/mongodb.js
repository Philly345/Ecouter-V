import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kilo';

// Optimized MongoDB client options for Vercel
const options = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 30000, // Increased to 30 seconds for better reliability
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  connectTimeoutMS: 30000, // 30 seconds connection timeout
  family: 4, // Use IPv4, skip trying IPv6
  retryWrites: true,
  retryReads: true,
  tls: true
};

let client;
let clientPromise;

// In production (Vercel), create a new connection for each invocation
// In development, reuse the connection
if (process.env.NODE_ENV === 'production') {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
} else {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
}

export async function connectDB() {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    const client = await clientPromise;
    const db = client.db();
    
    // Test the connection with a ping
    await db.admin().ping();
    console.log('✅ MongoDB connection successful');
    
    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    // More specific error handling
    if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
      throw new Error('Database authentication failed. Please check your MongoDB credentials.');
    } else if (error.message.includes('Server selection timed out')) {
      throw new Error('Database connection timed out. Please check your network connection and MongoDB URI.');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      throw new Error('Database host not found. Please check your MongoDB URI.');
    }
    
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

export async function connectToDatabase() {
  return connectDB();
}