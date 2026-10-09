import { useState } from 'react';
import {
  PhoneCall,
  Mail,
  AlertTriangle,
  X,
  Copy,
  Check,
  Clock,
  ShieldAlert,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../features/auth/Auth.context';

export default function EmergencyHelperWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedType, setCopiedType] = useState(null);

  // Check user role — Do NOT show on doctor accounts
  const userRole = (user?.role || '').toLowerCase();
  if (userRole === 'doctor') {
    return null;
  }

  const EMERGENCY_PHONE = '923409640';
  const EMERGENCY_EMAIL = 'sadipur92@gmail.com';

  const handleCopy = (text, type, label) => {
    navigator.clipboard?.writeText(text);
    setCopiedType(type);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <aside aria-label="Emergency Medical Assistance" className="fixed bottom-6 right-6 z-40 select-none">
      {/* ── EXPANDED EMERGENCY POPUP CARD ── */}
      {isOpen ? (
        <div className="w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-red-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                  <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight flex items-center gap-1.5">
                    Emergency Doctor Helper
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                    <span className="text-xs font-medium text-red-100 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Available 24 Hours
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition cursor-pointer"
                aria-label="Close Emergency Window"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-red-100/90 mt-2 font-medium">
              Immediate connection for critical or urgent patient cases to on-call doctors.
            </p>
          </div>

          {/* Content Body */}
          <div className="p-4 space-y-3 bg-slate-50/50">
            {/* Phone Card */}
            <div className="bg-white border border-red-100 rounded-xl p-3 shadow-sm hover:border-red-300 transition">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <PhoneCall className="w-3.5 h-3.5 text-red-600" /> Emergency Hotline
                </span>
                <button
                  onClick={() => handleCopy(EMERGENCY_PHONE, 'phone', 'Phone number')}
                  className="text-xs font-medium text-slate-500 hover:text-red-600 flex items-center gap-1 transition cursor-pointer"
                  title="Copy number"
                >
                  {copiedType === 'phone' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-lg font-extrabold text-slate-900 tracking-wide font-mono">
                  {EMERGENCY_PHONE}
                </span>
                <a
                  href={`tel:${EMERGENCY_PHONE}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  Call Now
                </a>
              </div>
            </div>

            {/* Email Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-slate-300 transition">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-600" /> Emergency Email
                </span>
                <button
                  onClick={() => handleCopy(EMERGENCY_EMAIL, 'email', 'Email')}
                  className="text-xs font-medium text-slate-500 hover:text-red-600 flex items-center gap-1 transition cursor-pointer"
                  title="Copy email"
                >
                  {copiedType === 'email' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-800 truncate" title={EMERGENCY_EMAIL}>
                  {EMERGENCY_EMAIL}
                </span>
                <a
                  href={`mailto:${EMERGENCY_EMAIL}?subject=Emergency%20Patient%20Assistance&body=Please%20connect%20me%20with%20an%20available%20doctor%20immediately.`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition shrink-0"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Mail Now
                </a>
              </div>
            </div>

            {/* WhatsApp Quick Connect (Bonus assistance) */}
            <a
              href={`https://wa.me/91${EMERGENCY_PHONE}?text=${encodeURIComponent(
                'Hello, I need urgent emergency assistance connecting to a doctor.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold transition group"
            >
              <span className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                Direct WhatsApp Doctor Connect
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 transition" />
            </a>

            {/* Safety Banner */}
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                For critical or life-threatening emergencies, call national emergency ambulance service immediately (108 / 102).
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* ── COLLAPSED FLOATING SOS BUTTON ── */
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white rounded-full shadow-2xl hover:shadow-red-500/40 border-2 border-white/30 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Open 24/7 Emergency Doctor Helper"
        >
          {/* Pulsing radar ping */}
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white" />
          </span>

          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <PhoneCall className="w-4 h-4 text-white group-hover:rotate-12 transition-transform duration-200" />
          </div>

          <div className="text-left pr-1">
            <div className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <span>Emergency 24/7</span>
              <span className="px-1.5 py-0.2 bg-white/20 text-[10px] rounded font-semibold">
                SOS
              </span>
            </div>
            <div className="text-[11px] font-medium text-red-100 flex items-center gap-1">
              <span>Doctor Helper</span>
              <span>•</span>
              <span className="text-emerald-300 font-semibold">24h</span>
            </div>
          </div>
        </button>
      )}
    </aside>
  );
}
