const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');
const { createNotification } = require('../services/notification.service');

// ─────────────────────────────────────────────
// CREATE OR GET CONVERSATION (POST /api/messages/conversations)
// ─────────────────────────────────────────────
const createOrGetConversation = async (req, res, next) => {
  try {
    const targetUserId =
      req.body.doctorId ||
      req.body.patientId ||
      req.body.participantId ||
      req.body.otherUserId;

    if (!targetUserId) {
      return errorResponse(res, 'Target user ID (doctorId or patientId) is required.', 400);
    }

    if (!mongoose.isValidObjectId(targetUserId)) {
      return errorResponse(res, 'Invalid user ID format.', 400);
    }

    if (targetUserId.toString() === req.user._id.toString()) {
      return errorResponse(res, 'Cannot start a conversation with yourself.', 400);
    }

    const targetUser = await User.findById(targetUserId).select('fullName email role profilePhoto');
    if (!targetUser) {
      return errorResponse(res, 'Target user not found.', 404);
    }

    // Role check: one must be patient, one must be doctor
    if (req.user.role === targetUser.role) {
      return errorResponse(
        res,
        `Conversations can only be created between a patient and a doctor (both are ${req.user.role}s).`,
        400
      );
    }

    // Look for existing conversation between these two
    let conversation = await Conversation.findOne({
      'participants.userId': { $all: [req.user._id, targetUser._id] },
    }).populate('participants.userId', 'fullName profilePhoto role email');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [
          { userId: req.user._id, role: req.user.role },
          { userId: targetUser._id, role: targetUser.role },
        ],
        lastMessage: '',
        lastMessageAt: new Date(),
        unreadCount: { patient: 0, doctor: 0 },
      });

      conversation = await conversation.populate(
        'participants.userId',
        'fullName profilePhoto role email'
      );
    }

    // Format participant helper
    const otherParticipant = conversation.participants.find(
      (p) => p.userId?._id?.toString() !== req.user._id.toString()
    );

    return successResponse(
      res,
      'Conversation ready.',
      {
        ...conversation.toObject(),
        participant: otherParticipant?.userId || targetUser,
        unreadCount: conversation.unreadCount?.[req.user.role] || 0,
      },
      200
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET ALL USER'S CONVERSATIONS (GET /api/messages/conversations)
// ─────────────────────────────────────────────
const getUserConversations = async (req, res, next) => {
  try {
    const rawConversations = await Conversation.find({
      'participants.userId': req.user._id,
    })
      .populate('participants.userId', 'fullName profilePhoto role email')
      .sort({ lastMessageAt: -1 });

    const conversations = rawConversations.map((c) => {
      const otherParticipant = c.participants.find(
        (p) => p.userId?._id?.toString() !== req.user._id.toString()
      );

      return {
        _id: c._id,
        participant: otherParticipant?.userId || {
          _id: otherParticipant?.userId,
          fullName: 'User',
          role: otherParticipant?.role,
        },
        lastMessage: c.lastMessage || '',
        lastMessageAt: c.lastMessageAt || c.updatedAt,
        lastMessageSenderId: c.lastMessageSenderId,
        unreadCount: c.unreadCount?.[req.user.role] || 0,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });

    return successResponse(res, 'Conversations fetched successfully.', {
      conversations,
      totalUnread: conversations.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET CONVERSATION MESSAGES (GET /api/messages/conversations/:conversationId)
// ─────────────────────────────────────────────
const getConversationMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    if (!mongoose.isValidObjectId(conversationId)) {
      return errorResponse(res, 'Invalid conversation ID.', 400);
    }

    const conversation = await Conversation.findById(conversationId).populate(
      'participants.userId',
      'fullName profilePhoto role email'
    );

    if (!conversation) {
      return errorResponse(res, 'Conversation not found.', 404);
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId?._id?.toString() === req.user._id.toString() || p.userId?.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return errorResponse(res, 'Unauthorized access to this conversation.', 403);
    }

    // Mark unread messages where receiver is current user as read
    await Message.updateMany(
      {
        conversationId,
        receiverId: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    // Reset unread count for current user's role
    if (req.user.role === 'doctor') {
      conversation.unreadCount.doctor = 0;
    } else {
      conversation.unreadCount.patient = 0;
    }
    await conversation.save();

    // Emit read event to conversation room via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId.toString()).emit('messageRead', {
        conversationId,
        readerId: req.user._id,
      });
      io.to(conversationId.toString()).emit('message_read', {
        conversationId,
        readerId: req.user._id,
      });
    }

    // Fetch messages sorted oldest to newest
    const messages = await Message.find({ conversationId })
      .populate('senderId', 'fullName profilePhoto role')
      .sort({ createdAt: 1 });

    const otherParticipant = conversation.participants.find(
      (p) => p.userId?._id?.toString() !== req.user._id.toString()
    );

    return successResponse(res, 'Messages fetched successfully.', {
      conversation: {
        _id: conversation._id,
        participant: otherParticipant?.userId,
        unreadCount: 0,
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
      },
      messages,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// SEND MESSAGE (POST /api/messages)
// ─────────────────────────────────────────────
const sendMessage = async (req, res, next) => {
  try {
    const conversationId = req.body.conversationId || req.params.conversationId;
    const messageContent = req.body.message || req.body.content;

    if (!conversationId) {
      return errorResponse(res, 'Conversation ID is required.', 400);
    }

    if (!mongoose.isValidObjectId(conversationId)) {
      return errorResponse(res, 'Invalid conversation ID.', 400);
    }

    if (!messageContent || !messageContent.trim()) {
      return errorResponse(res, 'Message text cannot be empty.', 400);
    }

    if (messageContent.length > 2000) {
      return errorResponse(res, 'Message cannot exceed 2000 characters.', 400);
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return errorResponse(res, 'Conversation not found.', 404);
    }

    // Check sender is a participant
    const senderParticipant = conversation.participants.find(
      (p) => p.userId.toString() === req.user._id.toString()
    );
    if (!senderParticipant) {
      return errorResponse(res, 'You are not a participant in this conversation.', 403);
    }

    // Receiver is the other participant
    const receiverParticipant = conversation.participants.find(
      (p) => p.userId.toString() !== req.user._id.toString()
    );
    if (!receiverParticipant) {
      return errorResponse(res, 'Conversation does not have a valid recipient.', 400);
    }

    // STRICT: Save message ONLY. Never auto-reply.
    const message = await Message.create({
      conversationId,
      senderId: req.user._id,
      receiverId: receiverParticipant.userId,
      senderRole: req.user.role,
      receiverRole: receiverParticipant.role,
      message: messageContent.trim(),
      isRead: false,
      createdAt: new Date(),
    });

    // Update conversation metadata
    conversation.lastMessage = messageContent.trim();
    conversation.lastMessageSenderId = req.user._id;
    conversation.lastMessageAt = new Date();

    if (receiverParticipant.role === 'doctor') {
      conversation.unreadCount.doctor = (conversation.unreadCount.doctor || 0) + 1;
    } else {
      conversation.unreadCount.patient = (conversation.unreadCount.patient || 0) + 1;
    }
    await conversation.save();

    const populatedMessage = await message.populate(
      'senderId',
      'fullName profilePhoto role'
    );

    // ── Create notification for the receiver ──
    const senderName = req.user.fullName || 'Someone';
    const notification = await createNotification({
      recipient: receiverParticipant.userId,
      sender: req.user._id,
      type: 'new_message',
      title: `New message from ${senderName}`,
      message: messageContent.trim().length > 80
        ? messageContent.trim().substring(0, 80) + '...'
        : messageContent.trim(),
      data: {
        conversationId,
        messageId: message._id,
        senderRole: req.user.role,
      },
    });

    // Emit real-time Socket.IO events to conversation room and receiver
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId.toString()).emit('newMessage', populatedMessage);
      io.to(conversationId.toString()).emit('new_message', populatedMessage);

      // Notify recipient's personal room for conversation list badge + notification
      io.to(`user_${receiverParticipant.userId.toString()}`).emit('newMessage', populatedMessage);
      io.to(`user_${receiverParticipant.userId.toString()}`).emit('conversationUpdated', {
        conversationId,
        lastMessage: messageContent.trim(),
        lastMessageAt: new Date(),
        senderId: req.user._id,
      });

      // Emit notification event so frontend notification panel updates in real-time
      if (notification) {
        io.to(`user_${receiverParticipant.userId.toString()}`).emit('newNotification', {
          ...notification.toObject(),
          sender: { _id: req.user._id, fullName: senderName, profilePhoto: req.user.profilePhoto },
        });
      }
    }

    return successResponse(res, 'Message sent successfully.', populatedMessage, 201);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// MARK CONVERSATION READ (PATCH /api/messages/conversations/:conversationId/read)
// ─────────────────────────────────────────────
const markConversationRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    if (!mongoose.isValidObjectId(conversationId)) {
      return errorResponse(res, 'Invalid conversation ID.', 400);
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return errorResponse(res, 'Conversation not found.', 404);
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return errorResponse(res, 'Unauthorized.', 403);
    }

    await Message.updateMany(
      {
        conversationId,
        receiverId: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    if (req.user.role === 'doctor') {
      conversation.unreadCount.doctor = 0;
    } else {
      conversation.unreadCount.patient = 0;
    }
    await conversation.save();

    const io = req.app.get('io');
    if (io) {
      io.to(conversationId.toString()).emit('messageRead', {
        conversationId,
        readerId: req.user._id,
      });
      io.to(conversationId.toString()).emit('message_read', {
        conversationId,
        readerId: req.user._id,
      });
    }

    return successResponse(res, 'Messages marked as read.', null);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// DELETE MESSAGE (DELETE /api/messages/:messageId)
// ─────────────────────────────────────────────
const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    if (!mongoose.isValidObjectId(messageId)) {
      return errorResponse(res, 'Invalid message ID.', 400);
    }

    const message = await Message.findOne({
      _id: messageId,
      senderId: req.user._id,
    });

    if (!message) {
      return errorResponse(res, 'Message not found or you cannot delete this message.', 404);
    }

    await Message.findByIdAndDelete(messageId);

    const io = req.app.get('io');
    if (io) {
      io.to(message.conversationId.toString()).emit('messageDeleted', { messageId });
    }

    return successResponse(res, 'Message deleted successfully.', null);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrGetConversation,
  getUserConversations,
  getConversationMessages,
  sendMessage,
  markConversationRead,
  deleteMessage,
};
