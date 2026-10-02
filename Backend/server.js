require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./src/config/database');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// ─────────────────────────────────────────────
// SOCKET.IO — Real-time chat
// ─────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Store io instance on app for use in controllers
app.set('io', io);

// Active online users tracking
const onlineUsers = new Map(); // userId -> Set(socketId)

io.on('connection', (socket) => {
  let connectedUserId = null;

  // User online registration
  const registerUserOnline = (userId) => {
    if (!userId) return;
    connectedUserId = String(userId);
    socket.join(`user_${connectedUserId}`);

    if (!onlineUsers.has(connectedUserId)) {
      onlineUsers.set(connectedUserId, new Set());
    }
    onlineUsers.get(connectedUserId).add(socket.id);

    // Broadcast user online status
    io.emit('userOnline', { userId: connectedUserId, isOnline: true });
    io.emit('user_online', { userId: connectedUserId, isOnline: true });
    io.emit('user_status_changed', { userId: connectedUserId, status: 'online' });
  };

  socket.on('user_online', registerUserOnline);
  socket.on('userOnline', registerUserOnline);
  socket.on('register_user', registerUserOnline);
  socket.on('joinUserRoom', registerUserOnline);

  // Return list of currently online users
  socket.on('get_online_users', (callback) => {
    const list = Array.from(onlineUsers.keys());
    if (typeof callback === 'function') callback(list);
    else socket.emit('online_users_list', list);
  });

  // Join conversation room
  const handleJoinConversation = (conversationId) => {
    if (!conversationId) return;
    const room = String(conversationId);
    socket.join(room);
  };
  socket.on('join_conversation', handleJoinConversation);
  socket.on('joinConversation', handleJoinConversation);

  // Leave conversation room
  const handleLeaveConversation = (conversationId) => {
    if (!conversationId) return;
    const room = String(conversationId);
    socket.leave(room);
  };
  socket.on('leave_conversation', handleLeaveConversation);
  socket.on('leaveConversation', handleLeaveConversation);

  // Real-time typing indicators
  socket.on('typing', ({ conversationId, userId, userName, role }) => {
    if (!conversationId) return;
    socket.to(String(conversationId)).emit('typing', {
      conversationId,
      userId,
      userName: userName || (role === 'doctor' ? 'Doctor' : 'Patient'),
      role,
    });
  });

  const handleStopTyping = ({ conversationId, userId }) => {
    if (!conversationId) return;
    socket.to(String(conversationId)).emit('stop_typing', { conversationId, userId });
    socket.to(String(conversationId)).emit('stopTyping', { conversationId, userId });
  };
  socket.on('stop_typing', handleStopTyping);
  socket.on('stopTyping', handleStopTyping);

  // Message read receipts
  const handleMessageRead = ({ conversationId, readerId }) => {
    if (!conversationId) return;
    socket.to(String(conversationId)).emit('messageRead', { conversationId, readerId });
    socket.to(String(conversationId)).emit('message_read', { conversationId, readerId });
  };
  socket.on('messageRead', handleMessageRead);
  socket.on('message_read', handleMessageRead);

  // Disconnect handler
  socket.on('disconnect', () => {
    if (connectedUserId && onlineUsers.has(connectedUserId)) {
      const userSockets = onlineUsers.get(connectedUserId);
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(connectedUserId);
        io.emit('userOffline', { userId: connectedUserId, isOnline: false });
        io.emit('user_offline', { userId: connectedUserId, isOnline: false });
        io.emit('user_status_changed', { userId: connectedUserId, status: 'offline' });
      }
    }
  });
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
const startServer = async () => {
  await connectDB();

  server.listen(PORT, () => {
    console.log(`\n🚀 CareConnect Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`🏥 Health: http://localhost:${PORT}/api/health\n`);
  });
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  process.exit(1);
});
