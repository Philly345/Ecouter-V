
import { connectDB } from '../lib/mongodb';

// Check if we're in a serverless environment (like Vercel)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NODE_ENV === 'production';

// MongoDB collection names
const USERS_COLLECTION = 'users';

// Users database
export const usersDB = {
  // Find user by email
  findByEmail: async (email) => {
    if (!isServerless) {
      // In development, you might want to keep file-based fallback
      return null;
    }
    
    try {
      const { db } = await connectDB();
      return await db.collection(USERS_COLLECTION).findOne({ email });
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  },

  // Find user by ID
  findById: async (id) => {
    if (!isServerless) {
      // In development, you might want to keep file-based fallback
      return null;
    }
    
    try {
      const { db } = await connectDB();
      return await db.collection(USERS_COLLECTION).findOne({ _id: id });
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  },

  // Create a new user
  create: async (userData) => {
    if (!isServerless) {
      // In development, you might want to keep file-based fallback
      return null;
    }
    
    try {
      const { db } = await connectDB();
      const now = new Date();
      const newUser = {
        ...userData,
        createdAt: now,
        updatedAt: now,
      };
      
      const result = await db.collection(USERS_COLLECTION).insertOne(newUser);
      return { ...newUser, _id: result.insertedId };
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  },
  
  // Update a user
  update: async (id, updateData) => {
    if (!isServerless) {
      // In development, you might want to keep file-based fallback
      return null;
    }
    
    try {
      console.log(`Updating user with id: ${id}`); // Force rebuild
      const { db } = await connectDB();
      await db.collection(USERS_COLLECTION).updateOne(
        { _id: id },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      // After updating, fetch and return the updated user document
      return await db.collection(USERS_COLLECTION).findOne({ _id: id });
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  },
};

// MongoDB collection name for files
const FILES_COLLECTION = 'files';

// Files database
export const filesDB = {
  // Find files by user ID
  findByUserId: async (userId) => {
    if (!isServerless) {
      return [];
    }
    
    try {
      const { db } = await connectDB();
      return await db.collection(FILES_COLLECTION)
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();
    } catch (error) {
      console.error('Error finding files by user ID:', error);
      return [];
    }
  },

  // Find file by ID
  findById: async (id) => {
    if (!isServerless) {
      return null;
    }
    
    try {
      const { db } = await connectDB();
      return await db.collection(FILES_COLLECTION).findOne({ _id: id });
    } catch (error) {
      console.error('Error finding file by ID:', error);
      return null;
    }
  },

  // Create a new file
  create: async (fileData) => {
    if (!isServerless) {
      return null;
    }
    
    try {
      const { db } = await connectDB();
      const now = new Date();
      const newFile = {
        ...fileData,
        createdAt: now,
        updatedAt: now,
      };
      
      const result = await db.collection(FILES_COLLECTION).insertOne(newFile);
      return { ...newFile, _id: result.insertedId };
    } catch (error) {
      console.error('Error creating file:', error);
      return null;
    }
  },

  // Update a file
  update: async (id, updateData) => {
    if (!isServerless) {
      return null;
    }
    
    try {
      const { db } = await connectDB();
      const result = await db.collection(FILES_COLLECTION).updateOne(
        { _id: id },
        { $set: { ...updateData, updatedAt: new Date() } }
      );
      
      if (result.matchedCount === 0) {
        return null;
      }
      
      return await filesDB.findById(id);
    } catch (error) {
      console.error('Error updating file:', error);
      return null;
    }
  },

  // Delete a file
  delete: async (id) => {
    if (!isServerless) {
      return false;
    }
    
    try {
      const { db } = await connectDB();
      const result = await db.collection(FILES_COLLECTION).deleteOne({ _id: id });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  },

  // Get files by status for a user
  getByStatus: async (userId, status) => {
    if (!isServerless) {
      return [];
    }
    
    try {
      const { db } = await connectDB();
      return await db.collection(FILES_COLLECTION)
        .find({ userId, status })
        .sort({ createdAt: -1 })
        .toArray();
    } catch (error) {
      console.error('Error getting files by status:', error);
      return [];
    }
  },

  getStorageUsed: async (userId) => {
    if (!isServerless) {
      return 0;
    }
    
    try {
      const { db } = await connectDB();
      const result = await db.collection(FILES_COLLECTION).aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$size' } } }
      ]).toArray();
      
      return result[0]?.total || 0;
    } catch (error) {
      console.error('Error calculating storage used:', error);
      return 0;
    }
  },
};
