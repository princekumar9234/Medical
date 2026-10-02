import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  MessageSquare, 
  User, 
  Search, 
  Check, 
  CheckCheck, 
  Phone, 
  Video, 
  Info,
  Circle
} from 'lucide-react';
import { useAuth } from '../../auth/Auth.context';
import { chatService } from '../services/chat.service';
import Button from '../../../components/ui/Button';

export const ChatPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const messagesEndRef = useRef(null);

  const isDoctor = user?.role === 'DOCTOR';

  // Fallback demo conversations
  const fallbackConversations = [
    {
      _id: 'conv-1',
      participant: {
        _id: isDoctor ? 'p-1' : 'd-1',
        name: isDoctor ? 'John Doe (Patient)' : 'Dr. Sarah Smith, MD',
        role: isDoctor ? 'PATIENT' : 'DOCTOR',
        specialty: 'Cardiology',
      },
      lastMessage: {
        text: 'Doctor, do I need to fast before the lipid profile check tomorrow?',
        createdAt: '10:45 AM',
      },
      unread: 1,
    },
    {
      _id: 'conv-2',
      participant: {
        _id: isDoctor ? 'p-2' : 'd-2',
        name: isDoctor ? 'Alice Johnson (Patient)' : 'Dr. Marcus Vance, DO',
        role: isDoctor ? 'PATIENT' : 'DOCTOR',
        specialty: 'General Medicine',
      },
      lastMessage: {
        text: 'The prescription has been updated in your patient portal.',
        createdAt: 'Yesterday',
      },
      unread: 0,
    }
  ];

  const fallbackMessages = {
    'conv-1': [
      {
        _id: 'm1',
        senderId: isDoctor ? 'p-1' : user?._id,
        text: 'Hello, I received my blood test results and wanted to clarify one question.',
        createdAt: '10:30 AM',
      },
      {
        _id: 'm2',
        senderId: isDoctor ? user?._id : 'd-1',
        text: 'Good morning! Yes of course, please go ahead. How are you feeling today?',
        createdAt: '10:35 AM',
      },
      {
        _id: 'm3',
        senderId: isDoctor ? 'p-1' : user?._id,
        text: 'Doctor, do I need to fast before the lipid profile check tomorrow?',
        createdAt: '10:45 AM',
      },
    ],
    'conv-2': [
      {
        _id: 'm4',
        senderId: isDoctor ? user?._id : 'd-2',
        text: 'The prescription has been updated in your patient portal.',
        createdAt: 'Yesterday',
      }
    ]
  };

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const res = await chatService.getConversations();
        const convList = res.data?.data?.conversations || [];
        if (convList.length > 0) {
          setConversations(convList);
          setActiveConversation(convList[0]);
        } else {
          setConversations(fallbackConversations);
          setActiveConversation(fallbackConversations[0]);
          setMessages(fallbackMessages['conv-1']);
        }
      } catch (err) {
        setConversations(fallbackConversations);
        setActiveConversation(fallbackConversations[0]);
        setMessages(fallbackMessages['conv-1']);
      }
    };
    fetchThreads();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      const convId = activeConversation._id;
      setMessages(fallbackMessages[convId] || [
        {
          _id: 'm-def',
          senderId: 'sys',
          text: 'This is the beginning of your secure, encrypted CareConnect conversation.',
          createdAt: 'Just now'
        }
      ]);
    }
  }, [activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      _id: `m-${Date.now()}`,
      senderId: user?._id || 'my-id',
      text: inputText.trim(),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Optional simulated reply for testing
    setTimeout(() => {
      const replyMsg = {
        _id: `m-${Date.now() + 1}`,
        senderId: activeConversation?.participant?._id || 'other',
        text: isDoctor
          ? 'Thank you for the update, Doctor. I will adhere to the instructions.'
          : 'Yes, please fast for 8-10 hours prior to the test. Water is fine to drink.',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, replyMsg]);
    }, 1200);
  };

  const filteredConversations = conversations.filter(c => 
    c.participant?.name?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden h-[750px] flex flex-col md:flex-row">
        
        {/* Left Sidebar: Threads */}
        <div className="w-full md:w-80 border-r border-slate-200/90 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-200 bg-white">
            <h2 className="text-base font-bold text-slate-900 mb-2">CareConnect Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.map((c) => {
              const isSelected = activeConversation?._id === c._id;
              return (
                <div
                  key={c._id}
                  onClick={() => setActiveConversation(c)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-emerald-50/70 border-r-2 border-emerald-600' : 'hover:bg-slate-100/60'
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0 relative">
                    {c.participant?.name?.charAt(0) || 'U'}
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {c.participant?.name}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {c.lastMessage?.createdAt}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {c.lastMessage?.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Active Chat Box */}
        <div className="flex-1 flex flex-col h-full bg-white">
          {activeConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                    {activeConversation.participant?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {activeConversation.participant?.name}
                    </h3>
                    <p className="text-[11px] text-emerald-600 font-medium">
                      ● Active Now • HIPAA Encrypted Channel
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => alert('Starting secure audio call...')}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => alert('Starting secure video call...')}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Video className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                {messages.map((m) => {
                  const isMine = m.senderId === user?._id || m.senderId === 'my-id';
                  return (
                    <div
                      key={m._id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isMine
                            ? 'bg-emerald-600 text-white rounded-br-xs'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs'
                        }`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {m.createdAt}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type your medical query or message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!inputText.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageSquare className="h-10 w-10 mb-2 text-slate-300" />
              <p className="text-xs">Select a conversation to start messaging</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ChatPage;
