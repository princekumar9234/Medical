const { Conversation, Message } = require('../models/Chat');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');
const { createNotification } = require('../services/notification.service');

// ─────────────────────────────────────────────
// GET OR CREATE CONVERSATION
// ─────────────────────────────────────────────
const getOrCreateConversation = async (req, res, next) => {
  try {
    const { otherUserId } = req.params;

    const otherUser = await User.findById(otherUserId);
    if (!otherUser) return errorResponse(res, 'User not found.', 404);

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, otherUserId] },
    }).populate('participants', 'fullName profilePhoto role');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, otherUserId],
        unreadCount: { [req.user._id.toString()]: 0, [otherUserId]: 0 },
      });
      conversation = await conversation.populate('participants', 'fullName profilePhoto role');
    }

    return successResponse(res, 'Conversation ready.', conversation);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET ALL MY CONVERSATIONS
// ─────────────────────────────────────────────
const getMyConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'fullName profilePhoto role')
      .populate('lastMessage', 'content createdAt sender')
      .sort({ lastMessageAt: -1 });

    return successResponse(res, 'Conversations fetched.', conversations);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET MESSAGES IN A CONVERSATION
// ─────────────────────────────────────────────
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return errorResponse(res, 'Conversation not found.', 404);

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) return errorResponse(res, 'Unauthorized.', 403);

    const total = await Message.countDocuments({ conversation: conversationId, isDeleted: false });
    const messages = await Message.find({ conversation: conversationId, isDeleted: false })
      .populate('sender', 'fullName profilePhoto')
      .sort({ createdAt: 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    // Mark as read
    await Message.updateMany(
      { conversation: conversationId, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    // Reset unread count for this user
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { [`unreadCount.${req.user._id.toString()}`]: 0 },
    });

    return successResponse(res, 'Messages fetched.', {
      messages,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// SEND MESSAGE
// ─────────────────────────────────────────────
const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return errorResponse(res, 'Conversation not found.', 404);

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) return errorResponse(res, 'Unauthorized.', 403);

    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      content,
      readBy: [req.user._id],
    });

    // Update conversation last message
    const otherParticipant = conversation.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
      $inc: { [`unreadCount.${otherParticipant.toString()}`]: 1 },
    });

    const populated = await message.populate('sender', 'fullName profilePhoto');

    // Notify recipient (silent notification)
    if (otherParticipant) {
      await createNotification({
        recipient: otherParticipant,
        sender: req.user._id,
        type: 'new_message',
        title: 'New Message',
        message: `${req.user.fullName}: ${content.substring(0, 60)}${content.length > 60 ? '...' : ''}`,
        data: { conversationId },
      });
    }

    // Emit via socket if available
    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('new_message', populated);
    }

    return successResponse(res, 'Message sent.', populated, 201);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// DELETE MESSAGE (soft delete)
// ─────────────────────────────────────────────
const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findOne({ _id: messageId, sender: req.user._id });
    if (!message) return errorResponse(res, 'Message not found.', 404);

    message.isDeleted = true;
    message.content = 'This message was deleted.';
    await message.save();

    return successResponse(res, 'Message deleted.', null);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOrCreateConversation,
  getMyConversations,
  getMessages,
  sendMessage,
  deleteMessage,
};
