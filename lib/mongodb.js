import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kilo';

// Optimized MongoDB client options for Vercel
const options = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  family: 4 // Use IPv4, skip trying IPv6
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
    const client = await clientPromise;
    const db = client.db();
    return { client, db };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

export async function connectToDatabase() {
  return connectDB();
}