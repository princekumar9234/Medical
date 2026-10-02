import { useState, useEffect } from 'react';
import { Bell, CheckCheck, Clock, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { notificationService } from '../notification.service';
import Button from '../../../components/ui/Button';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fallbackNotifications = [
    {
      _id: 'n-1',
      title: 'Appointment Confirmed',
      message: 'Your video consultation with Dr. Sarah Smith on Oct 4 at 10:30 AM is confirmed.',
      read: false,
      createdAt: '10 minutes ago',
      type: 'APPOINTMENT',
    },
    {
      _id: 'n-2',
      title: 'Digital Prescription Available',
      message: 'Dr. Sarah Smith uploaded your digital prescription for Acute Pharyngitis. PDF is ready.',
      read: false,
      createdAt: '2 hours ago',
      type: 'PRESCRIPTION',
    },
    {
      _id: 'n-3',
      title: 'Health Reminder',
      message: 'Please take your morning dosage of Amlodipine 5mg.',
      read: true,
      createdAt: 'Yesterday',
      type: 'REMINDER',
    },
  ];

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getAll();
      const list = res.data?.data?.notifications || [];
      setNotifications(list.length > 0 ? list : fallbackNotifications);
    } catch (err) {
      setNotifications(fallbackNotifications);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Alerts & Activity
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">
            Notifications Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Stay updated on appointments, clinical prescriptions, and care messages
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          className="text-xs py-2 px-3 border-slate-200 text-slate-700 flex items-center gap-1.5"
        >
          <CheckCheck className="h-4 w-4 text-emerald-600" />
          Mark all as read
        </Button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Bell className="h-10 w-10 mx-auto mb-2 text-slate-300" />
            <p className="text-xs">No notifications right now</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleMarkOneRead(n._id)}
              className={`py-4 flex items-start justify-between gap-4 cursor-pointer transition-colors px-3 rounded-2xl ${
                !n.read ? 'bg-emerald-50/40' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs shrink-0 mt-0.5 ${
                  !n.read ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {n.type === 'PRESCRIPTION' ? <FileText className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                    {!n.read && (
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 inline-block">{n.createdAt}</span>
                </div>
              </div>

              {!n.read && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkOneRead(n._id);
                  }}
                  className="text-slate-400 hover:text-emerald-600 p-1"
                  title="Mark as read"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default NotificationsPage;
