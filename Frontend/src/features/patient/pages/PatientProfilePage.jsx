import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Phone, Calendar, Mail, Save, CheckCircle2,
  Loader2, AlertCircle, Lock, Heart, ShieldAlert,
  Activity, Pill,
} from 'lucide-react';
import { useAuth } from '../../auth/Auth.context';
import apiClient from '../../../services/apiClient';
import Button from '../../../components/ui/Button';
import toast from 'react-hot-toast';

// ── Read-Only Info Row ───────────────────────────────────────────────────────────
const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
    {Icon && (
      <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5" />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-slate-800 mt-0.5 break-words">
        {value || <span className="text-slate-400 italic">Not recorded</span>}
      </p>
    </div>
    <Lock className="h-3.5 w-3.5 text-slate-300 shrink-0 mt-1" title="Read-only" />
  </div>
);

export const PatientProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);

  // Only editable fields
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: '',
  });

  const displayName = user?.fullName || user?.name || '';

  // ── Fetch real profile from backend ──────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const res = await apiClient.get('/patients/me/profile');
        const data = res.data?.data;
        const u = data?.user;
        const p = data?.profile;

        setProfile(p || {});
        setFormData({
          fullName: u?.fullName || user?.fullName || user?.name || '',
          phone: u?.phone || user?.phone || '',
          dateOfBirth: p?.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
        });
      } catch {
        // Fall back to auth context data
        setFormData({
          fullName: user?.fullName || user?.name || '',
          phone: user?.phone || '',
          dateOfBirth: '',
        });
        setProfile({});
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Save — only sends allowed fields ─────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      toast.error('Full name cannot be empty.');
      return;
    }
    setSaving(true);
    try {
      await apiClient.put('/patients/me/profile', {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        dateOfBirth: formData.dateOfBirth || undefined,
      });
      // Update auth context so Navbar reflects new name
      updateUser({ fullName: formData.fullName.trim(), name: formData.fullName.trim() });
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Read-only clinical values ─────────────────────────────────────────────────
  const genderDisplay = profile?.gender || '—';
  const bloodGroupDisplay = profile?.bloodGroup || '—';
  const allergiesDisplay = Array.isArray(profile?.allergies)
    ? profile.allergies.join(', ')
    : profile?.allergies || '—';
  const conditionsDisplay = Array.isArray(profile?.chronicConditions)
    ? profile.chronicConditions.join(', ')
    : profile?.chronicConditions || '—';
  const medicationsDisplay = Array.isArray(profile?.currentMedications)
    ? profile.currentMedications.join(', ')
    : profile?.currentMedications || '—';
  const emergencyName = profile?.emergencyContactName || '—';
  const emergencyPhone = profile?.emergencyContactPhone || '—';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-emerald-600 text-white font-bold text-xl flex items-center justify-center shadow-sm">
            {displayName.charAt(0).toUpperCase() || 'P'}
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">{displayName}</h1>
            <p className="text-xs text-slate-500 mt-0.5">Patient Profile</p>
            <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              Patient Account
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/patient/dashboard')}
          className="text-xs"
        >
          ← Back to Dashboard
        </Button>
      </div>

      {loadingProfile ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 text-emerald-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Notice Banner ─────────────────────────────────────────────────── */}
          <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <span>
              <strong>Limited editing:</strong> You can update your <strong>name</strong>, <strong>phone number</strong>, and <strong>date of birth</strong> only.
              Clinical data (blood group, gender, allergies, etc.) is managed by your healthcare provider and cannot be edited here.
            </span>
          </div>

          <form onSubmit={handleSave} className="space-y-6">

            {/* ── Editable Fields ────────────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600" />
                Personal Information
                <span className="ml-auto text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Editable
                </span>
              </h2>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition"
                    />
                  </div>
                </div>

                {/* Email — always read-only */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                    <span className="ml-2 text-[10px] font-medium text-slate-400 normal-case">(cannot be changed)</span>
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </button>
              </div>
            </div>

            {/* ── Read-Only Clinical Information ─────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-400" />
                Clinical Health Indicators
                <span className="ml-auto text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" /> Read Only
                </span>
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                This information is set by your healthcare provider. Contact your doctor to update clinical records.
              </p>

              <div className="divide-y divide-slate-100">
                <InfoRow label="Blood Group" value={bloodGroupDisplay} icon={Heart} />
                <InfoRow label="Biological Gender" value={genderDisplay} icon={User} />
                <InfoRow label="Known Allergies" value={allergiesDisplay} icon={ShieldAlert} />
                <InfoRow label="Chronic Conditions" value={conditionsDisplay} icon={Activity} />
                <InfoRow label="Current Medications" value={medicationsDisplay} icon={Pill} />
              </div>
            </div>

            {/* ── Read-Only Emergency Contact ────────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                Emergency Contact
                <span className="ml-auto text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" /> Read Only
                </span>
              </h2>

              <div className="divide-y divide-slate-100">
                <InfoRow label="Contact Person Name" value={emergencyName} icon={User} />
                <InfoRow label="Emergency Phone" value={emergencyPhone} icon={Phone} />
              </div>
            </div>

          </form>
        </>
      )}
    </div>
  );
};

export default PatientProfilePage;
