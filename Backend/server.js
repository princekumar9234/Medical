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

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Join conversation rooms
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`📥 Socket ${socket.id} joined conversation: ${conversationId}`);
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
  });

  // Real-time typing indicator
  socket.on('typing', ({ conversationId, userId }) => {
    socket.to(conversationId).emit('typing', { userId });
  });

  socket.on('stop_typing', ({ conversationId, userId }) => {
    socket.to(conversationId).emit('stop_typing', { userId });
  });

  socket.on('disconnect', () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
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
