import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    console.log('🔍 Decoded userId:', userId, 'Type:', typeof userId, 'Length:', userId?.length);

    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      filter: ({ mimetype }) => {
        return mimetype && mimetype.includes('image');
      },
    });

    const [fields, files] = await form.parse(req);
    const avatar = files.avatar?.[0];

    if (!avatar) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Read the file and convert to base64
    const fileBuffer = fs.readFileSync(avatar.filepath);
    const base64String = `data:${avatar.mimetype};base64,${fileBuffer.toString('base64')}`;

    const { db } = await connectToDatabase();

    // Update user avatar - handle both ObjectId and string/numeric IDs
    let result;
    if (ObjectId.isValid(userId)) {
      // MongoDB ObjectId format
      result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            avatar: base64String,
            updatedAt: new Date()
          }
        }
      );
    } else {
      // String or numeric ID format (from file system or migrated data)
      result = await db.collection('users').updateOne(
        { _id: userId },
        { 
          $set: { 
            avatar: base64String,
            updatedAt: new Date()
          }
        }
      );
    }

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Clean up the temporary file
    fs.unlinkSync(avatar.filepath);

    res.status(200).json({
      message: 'Avatar uploaded successfully',
      avatarUrl: base64String
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}
