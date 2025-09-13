import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../lib/mongodb';
import { ObjectId } from 'mongodb';

const rooms = new Map(); // Track active rooms and users

export default function handler(req, res) {
  if (res.socket.server.io) {
    res.end();
    return;
  }

  const io = new Server(res.socket.server, {
    path: '/api/socketio',
    cors: {
      origin: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { db } = await connectDB();
      
      const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = decoded.userId;
      socket.userEmail = user.email;
      socket.userName = user.name || user.email.split('@')[0];
      socket.userAvatar = user.avatar;
      
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.userName);

    // Join collaboration room
    socket.on('join-collaboration', async (fileId) => {
      try {
        const { db } = await connectDB();
        
        // Verify user has access to this file
        const file = await db.collection('files').findOne({
          _id: new ObjectId(fileId),
          $or: [
            { userId: socket.userId },
            { 'collaborators.email': socket.userEmail, 'collaborators.status': 'active' }
          ]
        });

        if (!file) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        socket.join(`file-${fileId}`);
        socket.currentFileId = fileId;

        // Track user in room
        if (!rooms.has(fileId)) {
          rooms.set(fileId, new Map());
        }
        
        const roomUsers = rooms.get(fileId);
        roomUsers.set(socket.id, {
          id: socket.userId,
          email: socket.userEmail,
          name: socket.userName,
          avatar: socket.userAvatar,
          cursor: null,
          selection: null,
          lastActive: new Date()
        });

        // Notify others about new user
        socket.to(`file-${fileId}`).emit('user-joined', {
          id: socket.userId,
          email: socket.userEmail,
          name: socket.userName,
          avatar: socket.userAvatar
        });

        // Send current active users to the new user
        const activeUsers = Array.from(roomUsers.values());
        socket.emit('active-users', activeUsers);

        console.log(`User ${socket.userName} joined file ${fileId}`);

      } catch (error) {
        console.error('Join collaboration error:', error);
        socket.emit('error', { message: 'Failed to join collaboration' });
      }
    });

    // Handle text changes in real-time
    socket.on('text-change', (data) => {
      if (socket.currentFileId) {
        socket.to(`file-${socket.currentFileId}`).emit('text-change', {
          changes: data.changes,
          userId: socket.userId,
          userName: socket.userName,
          timestamp: new Date()
        });
      }
    });

    // Handle cursor position updates
    socket.on('cursor-position', (data) => {
      if (socket.currentFileId) {
        const roomUsers = rooms.get(socket.currentFileId);
        if (roomUsers && roomUsers.has(socket.id)) {
          const user = roomUsers.get(socket.id);
          user.cursor = data.position;
          user.selection = data.selection;
          user.lastActive = new Date();
        }

        socket.to(`file-${socket.currentFileId}`).emit('cursor-position', {
          userId: socket.userId,
          userName: socket.userName,
          position: data.position,
          selection: data.selection
        });
      }
    });

    // Handle comments in real-time
    socket.on('comment-added', (comment) => {
      if (socket.currentFileId) {
        socket.to(`file-${socket.currentFileId}`).emit('comment-added', comment);
      }
    });

    // Handle typing indicators
    socket.on('typing-start', () => {
      if (socket.currentFileId) {
        socket.to(`file-${socket.currentFileId}`).emit('user-typing', {
          userId: socket.userId,
          userName: socket.userName,
          isTyping: true
        });
      }
    });

    socket.on('typing-stop', () => {
      if (socket.currentFileId) {
        socket.to(`file-${socket.currentFileId}`).emit('user-typing', {
          userId: socket.userId,
          userName: socket.userName,
          isTyping: false
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.userName);
      
      if (socket.currentFileId) {
        const roomUsers = rooms.get(socket.currentFileId);
        if (roomUsers) {
          roomUsers.delete(socket.id);
          
          // Clean up empty rooms
          if (roomUsers.size === 0) {
            rooms.delete(socket.currentFileId);
          }
        }

        // Notify others about user leaving
        socket.to(`file-${socket.currentFileId}`).emit('user-left', {
          id: socket.userId,
          email: socket.userEmail,
          name: socket.userName
        });
      }
    });

    // Handle leaving collaboration
    socket.on('leave-collaboration', () => {
      if (socket.currentFileId) {
        socket.leave(`file-${socket.currentFileId}`);
        
        const roomUsers = rooms.get(socket.currentFileId);
        if (roomUsers) {
          roomUsers.delete(socket.id);
        }

        socket.to(`file-${socket.currentFileId}`).emit('user-left', {
          id: socket.userId,
          email: socket.userEmail,
          name: socket.userName
        });

        socket.currentFileId = null;
      }
    });
  });

  res.socket.server.io = io;
  res.end();
}