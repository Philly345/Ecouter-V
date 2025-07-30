import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../../lib/mongodb';
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
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { db } = await connectToDatabase();

    // Parse the multipart form data
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
      filter: ({ mimetype }) => {
        return mimetype && mimetype.includes('image');
      },
    });

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.avatar) ? files.avatar[0] : files.avatar;

    if (!file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Read the file and convert to base64
    const fileBuffer = fs.readFileSync(file.filepath);
    const base64Image = fileBuffer.toString('base64');
    const mimeType = file.mimetype;
    const avatar = `data:${mimeType};base64,${base64Image}`;

    // Update user avatar in database
    await db.collection('users').updateOne(
      { _id: userId },
      { 
        $set: { 
          avatar: avatar,
          updatedAt: new Date()
        }
      }
    );

    // Clean up the temporary file
    fs.unlinkSync(file.filepath);

    // Return updated user info (excluding password)
    const updatedUser = await db.collection('users').findOne(
      { _id: userId },
      { projection: { password: 0 } }
    );

    res.status(200).json({
      message: 'Avatar updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}
