import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Activity,
  ChevronRight,
  TrendingUp,
  Stethoscope,
  AlertCircle,
  Loader2,
  User,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../auth/Auth.context';
import { appointmentService } from '../../appointments/services/appointment.service';
import { chatService } from '../../chat/services/chat.service';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

// ── Helpers ─────────────────────────────────────────────────────────────────────
const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
};

const getProfileImageUrl = (photo) => {
  if (!photo) return null;
  if (photo.startsWith('http://') || photo.startsWith('https://') || photo.startsWith('blob:') || photo.startsWith('data:')) {
    return photo;
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const backendOrigin = apiBase.replace(/\/api\/?$/, '');
  const cleanPath = photo.startsWith('/') ? photo.slice(1) : photo;
  return `${backendOrigin}/${cleanPath}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// ── Status Badge ─────────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    pending:   'bg-amber-50 text-amber-700 border-amber-200',
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected:  'bg-red-50 text-red-700 border-red-200',
    cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
    completed: 'bg-sky-50 text-sky-700 border-sky-200',
  };
  const labels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    completed: 'Completed',
  };
  const cls = styles[status?.toLowerCase()] || 'bg-slate-100 text-slate-500 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>
      {labels[status?.toLowerCase()] || status || 'Unknown'}
    </span>
  );
};

// ── Stat Card ────────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
    </div>
    <p className="text-2xl font-bold text-slate-900 mt-3">{value}</p>
    {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
  </div>
);

// ── Appointment Card (Accept / Reject) ───────────────────────────────────────────
const AppointmentCard = ({ apt, onStatusChange }) => {
  const [loading, setLoading] = useState(null); // 'confirmed' | 'rejected' | null
  const patientName = apt.patient?.fullName || apt.patient?.name || 'Patient';

  const handleAction = async (newStatus) => {
    setLoading(newStatus);
    try {
      await appointmentService.updateStatus(apt._id, { status: newStatus });
      toast.success(
        newStatus === 'confirmed' ? 'Appointment confirmed ✓' : 'Appointment rejected'
      );
      onStatusChange(apt._id, newStatus);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 last:border-0">
      {/* Patient Info */}
      <div className="flex items-start gap-3.5">
        {apt.patient?.profilePhoto ? (
          <img
            src={getProfileImageUrl(apt.patient.profilePhoto)}
            alt={patientName}
            className="h-10 w-10 rounded-full object-cover border border-slate-200 shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextElementSibling) {
                e.currentTarget.nextElementSibling.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div
          className={`h-10 w-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0 ${
            apt.patient?.profilePhoto ? 'hidden' : 'flex'
          }`}
        >
          {getInitials(patientName)}
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">{patientName}</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {formatDate(apt.date)}
            {apt.timeSlot && <span className="ml-2 font-medium text-slate-700">@ {apt.timeSlot}</span>}
          </p>
          {apt.reason && (
            <p className="text-xs text-slate-600 mt-1">
              <span className="font-semibold">Reason:</span> {apt.reason}
            </p>
          )}
        </div>
      </div>

      {/* Status + Actions */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <StatusBadge status={apt.status} />
        {apt.status === 'pending' && (
          <>
            <button
              onClick={() => handleAction('confirmed')}
              disabled={!!loading}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-lg transition-colors"
            >
              {loading === 'confirmed' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
              Accept
            </button>
            <button
              onClick={() => handleAction('rejected')}
              disabled={!!loading}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 rounded-lg transition-colors"
            >
              {loading === 'rejected' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
              Reject
            </button>
          </>
        )}
        {apt.status === 'confirmed' && (
          <button
            onClick={() => handleAction('completed')}
            disabled={!!loading}
            className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
          >
            Mark Completed
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main DoctorDashboard ─────────────────────────────────────────────────────────
export const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'confirmed' | 'all'

  const displayName = user?.fullName || user?.name || 'Practitioner';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [apptRes, convRes] = await Promise.allSettled([
        appointmentService.getMyAppointments({ limit: 50 }),
        chatService.getConversations(),
      ]);

      if (apptRes.status === 'fulfilled') {
        const list = apptRes.value.data?.data?.appointments || [];
        setAppointments(list);
      }
      if (convRes.status === 'fulfilled') {
        const list = convRes.value.data?.data?.conversations || [];
        setConversations(list);
      }
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle inline status change from AppointmentCard
  const handleStatusChange = (aptId, newStatus) => {
    setAppointments((prev) =>
      prev.map((a) => (a._id === aptId ? { ...a, status: newStatus } : a))
    );
  };

  // ── Stats ──────────────────────────────────────────────────────────────────────
  const totalToday = appointments.filter((a) => {
    const d = new Date(a.date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const pendingCount  = appointments.filter((a) => a.status === 'pending').length;
  const confirmedCount = appointments.filter((a) => a.status === 'confirmed').length;
  const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);

  // ── Filtered list ─────────────────────────────────────────────────────────────
  const filteredAppointments = appointments.filter((a) => {
    if (activeTab === 'pending')   return a.status === 'pending';
    if (activeTab === 'confirmed') return a.status === 'confirmed';
    return true; // 'all'
  });

  // Recent conversations for doctor
  const recentConvos = conversations.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* ── Welcome Banner ─────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-emerald-900 to-teal-800 rounded-3xl p-5 sm:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope className="h-4 w-4 text-emerald-300" />
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Doctor Dashboard</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-700/60 text-emerald-200 border border-emerald-600">
                ● Active
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-bold text-white">
              Welcome, Dr. {displayName}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-300 mt-1">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
            <Link
              to="/appointments"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl transition-colors"
            >
              <Calendar className="h-3.5 w-3.5" />
              Full Schedule
            </Link>
          </div>
        </div>
      </div>

      {/* ── Error Banner ──────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Stat Cards ────────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Today's Appointments"
              value={totalToday}
              icon={Calendar}
              color="bg-emerald-50 text-emerald-600"
              sub="Scheduled for today"
            />
            <StatCard
              label="Pending Requests"
              value={pendingCount}
              icon={Clock}
              color="bg-amber-50 text-amber-600"
              sub="Awaiting your response"
            />
            <StatCard
              label="Confirmed"
              value={confirmedCount}
              icon={CheckCircle}
              color="bg-sky-50 text-sky-600"
              sub="Ready to consult"
            />
            <StatCard
              label="Unread Messages"
              value={totalUnread}
              icon={MessageSquare}
              color="bg-violet-50 text-violet-600"
              sub="From patients"
            />
          </div>

          {/* ── Main Grid ──────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Appointments Section */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Appointment Requests</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Review and respond to patient bookings</p>
                  </div>
                  <Link to="/appointments" className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-0.5">
                    View all <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Tab filters - scrollable on mobile */}
                <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
                  {[
                    { key: 'pending',   label: `Pending (${pendingCount})` },
                    { key: 'confirmed', label: `Confirmed (${confirmedCount})` },
                    { key: 'all',       label: 'All' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        activeTab === tab.key
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-6 pb-6">
                {filteredAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Calendar className="h-8 w-8 mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">
                      No {activeTab === 'all' ? '' : activeTab} appointments
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {activeTab === 'pending' ? 'No pending requests from patients.' : 'Check back later.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredAppointments.map((apt) => (
                      <AppointmentCard
                        key={apt._id}
                        apt={apt}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-4 space-y-5">

              {/* Recent Patient Messages */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="px-5 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Recent Messages</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Patient conversations</p>
                  </div>
                  <Link to="/chat" className="text-xs font-semibold text-emerald-600 hover:underline">
                    Open Chat
                  </Link>
                </div>

                <div className="divide-y divide-slate-50">
                  {recentConvos.length === 0 ? (
                    <div className="px-5 py-8 text-center text-slate-400">
                      <MessageSquare className="h-6 w-6 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs">No patient messages yet</p>
                    </div>
                  ) : (
                    recentConvos.map((c) => {
                      const pName = c.participant?.fullName || c.participant?.name || 'Patient';
                      return (
                        <Link
                          key={c._id}
                          to="/chat"
                          className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors"
                        >
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {getInitials(pName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-slate-900 truncate">{pName}</p>
                              {c.unreadCount > 0 && (
                                <span className="h-4 w-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0 ml-1">
                                  {c.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {c.lastMessage || 'Start a conversation'}
                            </p>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Quick Profile Links */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Quick Actions</h3>
                {[
                  { to: '/doctor/profile',       icon: User,       label: 'Edit Profile',        sub: 'Update your information' },
                  { to: '/doctor/availability',  icon: Activity,   label: 'Set Availability',    sub: 'Manage consultation slots' },
                  { to: '/chat',                 icon: MessageSquare, label: 'Patient Messages', sub: 'Reply to patients' },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800">{item.label}</p>
                      <p className="text-[11px] text-slate-400">{item.sub}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 ml-auto shrink-0" />
                  </Link>
                ))}
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DoctorDashboard;
