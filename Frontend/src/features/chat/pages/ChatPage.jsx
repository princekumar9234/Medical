import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  MessageSquare,
  Search,
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  CheckCheck,
  Check,
  Clock,
  UserPlus,
  X,
  Loader2,
  Circle,
  Stethoscope,
  User,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../auth/Auth.context';
import { chatService } from '../services/chat.service';
import { getSocket } from '../../../services/socket';

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date)) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatConvoTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date)) return '';
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return formatTime(dateStr);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const getRoleLabel = (role) => {
  if (!role) return '';
  return role === 'DOCTOR' || role === 'doctor' ? 'Doctor' : 'Patient';
};

// ─── New Conversation Modal ─────────────────────────────────────────────────────
const NewConversationModal = ({ onClose, onStartChat, currentUserRole }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchTarget = currentUserRole === 'PATIENT' ? 'doctors' : 'patients';

  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    setError('');
    try {
      const res = await chatService.getDoctors({ name: query, limit: 10 });
      const list = res.data?.data?.results || [];
      // Normalize: backend returns doctorId not _id
      setResults(list.map((d) => ({ ...d, _id: d.doctorId || d._id })));
    } catch {
      setError('Could not load results. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => handleSearch(search), 350);
    return () => clearTimeout(t);
  }, [search, handleSearch]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">New Conversation</h2>
            <p className="text-xs text-slate-500 mt-0.5">Find a {searchTarget === 'doctors' ? 'doctor' : 'patient'} to message</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              autoFocus
              type="text"
              placeholder={`Search ${searchTarget}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 text-emerald-600 animate-spin" />
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 px-5 py-4 text-red-500 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          {!loading && !error && results.length === 0 && search.trim() && (
            <p className="px-5 py-6 text-center text-sm text-slate-400">No {searchTarget} found.</p>
          )}
          {!loading && !error && results.length === 0 && !search.trim() && (
            <p className="px-5 py-6 text-center text-sm text-slate-400">Type a name to search…</p>
          )}
          {results.map((person) => (
            <button
              key={person._id}
              onClick={() => onStartChat(person)}
              className="w-full flex items-center gap-3 px-5 py-3 hover:bg-emerald-50/70 transition-colors text-left"
            >
              <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
                {getInitials(person.fullName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{person.fullName}</p>
                <p className="text-xs text-slate-500 truncate">
                  {person.specialization || person.specialty || getRoleLabel(person.role)}
                </p>
              </div>
              <Stethoscope className="h-4 w-4 text-emerald-500 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Message Bubble ─────────────────────────────────────────────────────────────
const MessageBubble = ({ msg, isMine }) => {
  const timeStr = formatTime(msg.createdAt);

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-1.5`}>
      <div className={`max-w-[75%] group relative`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
            isMine
              ? 'bg-emerald-600 text-white rounded-br-sm shadow-md'
              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
          }`}
        >
          {msg.message || msg.text || msg.content || ''}
        </div>
        <div
          className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}
        >
          <span className="text-[10px] text-slate-400">{timeStr}</span>
          {isMine && (
            <span className="text-[10px]">
              {msg.isRead ? (
                <CheckCheck className="h-3 w-3 text-emerald-500 inline" />
              ) : (
                <Check className="h-3 w-3 text-slate-400 inline" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Typing Indicator ───────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex justify-start mb-2">
    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
      <div className="flex gap-1 items-center">
        <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

// ─── Main ChatPage ──────────────────────────────────────────────────────────────
export const ChatPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [showNewConvo, setShowNewConvo] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const activeConvoRef = useRef(null);

  // Keep ref in sync with state so socket callbacks always have fresh value
  useEffect(() => {
    activeConvoRef.current = activeConversation;
  }, [activeConversation]);

  const isDoctor = user?.role === 'DOCTOR' || user?.role === 'doctor';
  const myRole = isDoctor ? 'doctor' : 'patient';

  // ── Scroll to bottom ────────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOtherTyping, scrollToBottom]);

  // ── Fetch conversation list ─────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    setLoadingConvos(true);
    setError('');
    try {
      const res = await chatService.getConversations();
      const list = res.data?.data?.conversations || [];
      setConversations(list);
    } catch (err) {
      setError('Could not load conversations.');
    } finally {
      setLoadingConvos(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // ── Fetch messages for active conversation ──────────────────────────────────
  const fetchMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    setLoadingMessages(true);
    try {
      const res = await chatService.getMessages(conversationId);
      const msgs = res.data?.data?.messages || [];
      setMessages(msgs);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (activeConversation?._id) {
      fetchMessages(activeConversation._id);
      // Join socket room for this conversation
      const socket = getSocket();
      if (socket) {
        socket.emit('joinConversation', activeConversation._id);
      }
    }
  }, [activeConversation?._id, fetchMessages]);

  // ── Socket.IO event listeners ───────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Join personal room for badge/notification updates
    socket.emit('joinUserRoom', user?._id);

    const onNewMessage = (msg) => {
      const convoId = msg.conversationId?.toString?.() || msg.conversationId;
      const activeId = activeConvoRef.current?._id?.toString?.();

      if (convoId === activeId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m._id?.toString() === msg._id?.toString())) return prev;
          return [...prev, msg];
        });
      }

      // Update conversation list preview
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id?.toString() === convoId) {
            return {
              ...c,
              lastMessage: msg.message || msg.text || msg.content || '',
              lastMessageAt: msg.createdAt,
              unreadCount:
                convoId === activeId
                  ? 0
                  : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        })
      );
    };

    const onConversationUpdated = (data) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id?.toString() === data.conversationId?.toString()) {
            return {
              ...c,
              lastMessage: data.lastMessage,
              lastMessageAt: data.lastMessageAt,
            };
          }
          return c;
        })
      );
    };

    const onTyping = (data) => {
      if (data.conversationId?.toString() === activeConvoRef.current?._id?.toString()
        && data.userId?.toString() !== user?._id?.toString()) {
        setIsOtherTyping(true);
      }
    };

    const onStopTyping = (data) => {
      if (data.conversationId?.toString() === activeConvoRef.current?._id?.toString()) {
        setIsOtherTyping(false);
      }
    };

    const onMessageRead = (data) => {
      if (data.conversationId?.toString() === activeConvoRef.current?._id?.toString()) {
        setMessages((prev) =>
          prev.map((m) => ({ ...m, isRead: true }))
        );
      }
    };

    const onOnlineUsers = (userIds) => {
      setOnlineUsers(new Set(userIds));
    };

    const onUserOnline = ({ userId }) => {
      setOnlineUsers((prev) => new Set([...prev, userId]));
    };

    const onUserOffline = ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    // Listen for both naming conventions the backend might use
    socket.on('newMessage', onNewMessage);
    socket.on('new_message', onNewMessage);
    socket.on('conversationUpdated', onConversationUpdated);
    socket.on('typing', onTyping);
    socket.on('stopTyping', onStopTyping);
    socket.on('messageRead', onMessageRead);
    socket.on('message_read', onMessageRead);
    socket.on('onlineUsers', onOnlineUsers);
    socket.on('userOnline', onUserOnline);
    socket.on('userOffline', onUserOffline);

    return () => {
      socket.off('newMessage', onNewMessage);
      socket.off('new_message', onNewMessage);
      socket.off('conversationUpdated', onConversationUpdated);
      socket.off('typing', onTyping);
      socket.off('stopTyping', onStopTyping);
      socket.off('messageRead', onMessageRead);
      socket.off('message_read', onMessageRead);
      socket.off('onlineUsers', onOnlineUsers);
      socket.off('userOnline', onUserOnline);
      socket.off('userOffline', onUserOffline);
    };
  }, [user?._id]);

  // ── Handle typing emission ──────────────────────────────────────────────────
  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (!activeConversation?._id) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('typing', {
      conversationId: activeConversation._id,
      userId: user?._id,
    });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', {
        conversationId: activeConversation._id,
        userId: user?._id,
      });
    }, 1500);
  };

  // ── Send message ────────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || !activeConversation?._id || sending) return;

    setSending(true);
    setInputText('');

    // Stop typing indicator
    const socket = getSocket();
    if (socket) {
      socket.emit('stopTyping', {
        conversationId: activeConversation._id,
        userId: user?._id,
      });
    }

    try {
      const res = await chatService.sendMessage(activeConversation._id, trimmed);
      const savedMsg = res.data?.data;
      if (savedMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m._id?.toString() === savedMsg._id?.toString())) return prev;
          return [...prev, savedMsg];
        });
        // Update sidebar preview
        setConversations((prev) =>
          prev.map((c) =>
            c._id?.toString() === activeConversation._id?.toString()
              ? { ...c, lastMessage: trimmed, lastMessageAt: new Date().toISOString() }
              : c
          )
        );
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send message.';
      setError(msg);
      setInputText(trimmed); // restore text on error
    } finally {
      setSending(false);
    }
  };

  // ── Start new conversation ──────────────────────────────────────────────────
  const handleStartChat = async (person) => {
    setShowNewConvo(false);
    try {
      const res = await chatService.createOrGetConversation(person._id);
      const convo = res.data?.data;
      if (!convo) return;

      // Add to list if not already there
      setConversations((prev) => {
        if (prev.some((c) => c._id?.toString() === convo._id?.toString())) return prev;
        return [convo, ...prev];
      });
      selectConversation(convo);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start conversation.');
    }
  };

  // ── Select conversation ─────────────────────────────────────────────────────
  const selectConversation = (convo) => {
    setActiveConversation(convo);
    setMessages([]);
    setIsOtherTyping(false);
    setMobileShowChat(true);

    // Clear unread badge
    setConversations((prev) =>
      prev.map((c) => (c._id === convo._id ? { ...c, unreadCount: 0 } : c))
    );

    // Leave old room, join new
    const socket = getSocket();
    if (socket) {
      if (activeConvoRef.current?._id) {
        socket.emit('leaveConversation', activeConvoRef.current._id);
      }
      socket.emit('joinConversation', convo._id);
    }
  };

  // ── Filtered conversations ──────────────────────────────────────────────────
  const filteredConversations = conversations
    .filter((c) => {
      const name = c.participant?.fullName || c.participant?.name || '';
      return name.toLowerCase().includes(searchFilter.toLowerCase());
    })
    .sort((a, b) => new Date(b.lastMessageAt || b.updatedAt) - new Date(a.lastMessageAt || a.updatedAt));

  const otherUser = activeConversation?.participant;
  const otherUserName = otherUser?.fullName || otherUser?.name || 'User';
  const otherUserId = otherUser?._id?.toString();
  const isOtherOnline = otherUserId && onlineUsers.has(otherUserId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page title */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">Messages</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {isDoctor
            ? 'Communicate securely with your patients'
            : 'Chat with your healthcare team'}
        </p>
      </div>

      {/* Global error banner */}
      {error && (
        <div className="mb-3 flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <button className="ml-auto text-red-400 hover:text-red-600" onClick={() => setError('')}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main chat container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden h-[calc(100vh-12rem)] sm:h-[680px] lg:h-[720px] flex">

        {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
        <div
          className={`w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50/60 shrink-0 ${
            mobileShowChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Sidebar header */}
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900">Conversations</h2>
              {user?.role !== 'DOCTOR' && user?.role !== 'doctor' && (
                <button
                  onClick={() => setShowNewConvo(true)}
                  title="New Conversation"
                  className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations…"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvos ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                <span className="text-xs">Loading conversations…</span>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">No conversations yet</p>
                  {!isDoctor && (
                    <p className="text-xs text-slate-400 mt-1">
                      Click <span className="font-semibold text-emerald-600">+</span> to message a doctor
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredConversations.map((c) => {
                  const isSelected = activeConversation?._id === c._id;
                  const pName = c.participant?.fullName || c.participant?.name || 'User';
                  const pId = c.participant?._id?.toString();
                  const online = pId && onlineUsers.has(pId);

                  return (
                    <button
                      key={c._id}
                      onClick={() => selectConversation(c)}
                      className={`w-full p-3.5 flex items-start gap-3 text-left transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 border-r-2 border-emerald-600'
                          : 'hover:bg-slate-100/60'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                          {getInitials(pName)}
                        </div>
                        {online && (
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold truncate ${isSelected ? 'text-emerald-900' : 'text-slate-900'}`}>
                            {pName}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                            {formatConvoTime(c.lastMessageAt || c.updatedAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-[11px] text-slate-500 truncate flex-1">
                            {c.lastMessage || 'Start a conversation'}
                          </p>
                          {c.unreadCount > 0 && (
                            <span className="ml-1 shrink-0 h-4 w-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center">
                              {c.unreadCount > 9 ? '9+' : c.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT CHAT PANE ───────────────────────────────────────────────── */}
        <div
          className={`flex-1 flex flex-col h-full bg-white min-w-0 ${
            mobileShowChat ? 'flex' : 'hidden md:flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
                {/* Back button (mobile) */}
                <button
                  className="md:hidden p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                  onClick={() => setMobileShowChat(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                {/* Avatar + name */}
                <div className="relative shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {getInitials(otherUserName)}
                  </div>
                  {isOtherOnline && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">
                    {otherUserName}
                  </h3>
                  <p className={`text-[11px] font-medium ${isOtherOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {isOtherTyping
                      ? 'typing…'
                      : isOtherOnline
                      ? '● Online'
                      : '○ Offline'}
                    {!isOtherTyping && (
                      <span className="ml-2 text-slate-300">•</span>
                    )}
                    {!isOtherTyping && (
                      <span className="ml-2 text-[10px] text-slate-400 font-normal">HIPAA Encrypted</span>
                    )}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    title="Audio call (coming soon)"
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    onClick={() => alert('Audio calling — coming soon!')}
                  >
                    <Phone className="h-4 w-4" />
                  </button>
                  <button
                    title="Video call (coming soon)"
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    onClick={() => alert('Video calling — coming soon!')}
                  >
                    <Video className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Messages body */}
              <div className="flex-1 overflow-y-auto px-4 py-4 bg-slate-50/40">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-5 w-5 text-emerald-500 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                    <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center">
                      <MessageSquare className="h-7 w-7 text-emerald-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-600">No messages yet</p>
                      <p className="text-xs text-slate-400 mt-0.5">Send the first message to get started</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const senderId = msg.senderId?._id?.toString() || msg.senderId?.toString();
                      const isMine = senderId === user?._id?.toString();
                      return (
                        <MessageBubble key={msg._id} msg={msg} isMine={isMine} />
                      );
                    })}
                    {isOtherTyping && <TypingIndicator />}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 px-4 py-3 border-t border-slate-200 bg-white"
              >
                <input
                  id="chat-input"
                  type="text"
                  placeholder={
                    isDoctor
                      ? 'Type your reply to the patient…'
                      : 'Type your message to the doctor…'
                  }
                  value={inputText}
                  onChange={handleInputChange}
                  disabled={sending}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:shadow-none"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          ) : (
            /* Empty state — no conversation selected */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400 bg-slate-50/30">
              <div className="h-20 w-20 rounded-3xl bg-emerald-50 flex items-center justify-center shadow-sm">
                <MessageSquare className="h-10 w-10 text-emerald-400" />
              </div>
              <div className="text-center px-6">
                <p className="text-base font-semibold text-slate-700">Select a conversation</p>
                <p className="text-sm text-slate-400 mt-1">
                  {isDoctor
                    ? 'Choose a patient from the list to view their messages'
                    : 'Choose a doctor from the list, or start a new conversation'}
                </p>
              </div>
              {!isDoctor && (
                <button
                  onClick={() => setShowNewConvo(true)}
                  className="mt-1 flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  <UserPlus className="h-4 w-4" />
                  Find a Doctor
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConvo && (
        <NewConversationModal
          onClose={() => setShowNewConvo(false)}
          onStartChat={handleStartChat}
          currentUserRole={user?.role}
        />
      )}
    </div>
  );
};

export default ChatPage;
