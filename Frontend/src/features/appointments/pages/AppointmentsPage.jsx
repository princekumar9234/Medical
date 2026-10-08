import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  Building,
  User,
  Stethoscope,
  FileText,
  XCircle,
  CheckCircle,
  MessageSquare,
  Download,
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../auth/Auth.context';
import { appointmentService } from '../services/appointment.service';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

// ── Helpers ─────────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
};

const getInitials = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

// Helper to resolve uploaded profile photo URL
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

// ── Status Badge ─────────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    pending:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    confirmed: { label: 'Confirmed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    rejected:  { label: 'Rejected',  cls: 'bg-red-50 text-red-700 border-red-200' },
    cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
    completed: { label: 'Completed', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  };
  const s = map[status?.toLowerCase()] || { label: status || '—', cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${s.cls}`}>
      {s.label}
    </span>
  );
};

// ── Empty State ──────────────────────────────────────────────────────────────────
const EmptyState = ({ isDoctor }) => (
  <div className="bg-white border border-slate-200 rounded-3xl p-14 text-center">
    <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-4" />
    <h3 className="text-base font-semibold text-slate-800">No appointments found</h3>
    <p className="text-xs text-slate-500 mt-1.5 max-w-xs mx-auto">
      {isDoctor
        ? 'You have no patient appointments here. Patients will appear when they book a consultation with you.'
        : 'You have no appointments yet. Click "Book a Doctor" to schedule your first consultation.'}
    </p>
  </div>
);

// ── Main Page ────────────────────────────────────────────────────────────────────
export const AppointmentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Role — always lowercase comparison
  const userRole = (user?.role || '').toLowerCase();
  const isDoctor = userRole === 'doctor';

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Prescription modal
  const [prescriptionModal, setPrescriptionModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState(null);
  const [rxDiagnosis, setRxDiagnosis] = useState('');
  const [rxMedicines, setRxMedicines] = useState([{ name: '', dosage: '', frequency: '', duration: '' }]);
  const [rxNotes, setRxNotes] = useState('');
  const [rxLoading, setRxLoading] = useState(false);

  // Cancel confirm
  const [cancellingId, setCancellingId] = useState(null);

  // ── Fetch from API only — NO FALLBACK DATA ────────────────────────────────────
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await appointmentService.getMyAppointments({ limit: 100 });
      const list = res.data?.data?.appointments || [];
      setAppointments(list);
    } catch (err) {
      setError('Failed to load appointments. Please try again.');
      setAppointments([]); // Show empty — no fake data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  // ── Tab filtering — matches lowercase backend status ─────────────────────────
  const tabs = [
    { key: 'all',       label: 'All' },
    { key: 'pending',   label: 'Pending' },
    { key: 'upcoming',  label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled / Rejected' },
  ];

  const filteredAppointments = appointments.filter((apt) => {
    const s = (apt.status || '').toLowerCase();
    if (activeTab === 'all')       return true;
    if (activeTab === 'upcoming')  return s === 'confirmed';
    if (activeTab === 'pending')   return s === 'pending';
    if (activeTab === 'completed') return s === 'completed';
    if (activeTab === 'cancelled') return s === 'cancelled' || s === 'rejected';
    return true;
  });

  // ── Update status (Doctor only) ───────────────────────────────────────────────
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await appointmentService.updateStatus(id, { status: newStatus });
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: newStatus } : a))
      );
      toast.success(`Appointment marked as ${newStatus}.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  // ── Cancel (Patient only) ─────────────────────────────────────────────────────
  const handleCancel = async (id) => {
    setCancellingId(id);
    try {
      await appointmentService.cancel(id, { cancelReason: 'Cancelled by patient' });
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: 'cancelled' } : a))
      );
      toast.success('Appointment cancelled.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment.');
    } finally {
      setCancellingId(null);
    }
  };

  // ── Prescription PDF ──────────────────────────────────────────────────────────
  const openPrescriptionModal = (apt) => {
    setSelectedApt(apt);
    setRxDiagnosis('');
    setRxMedicines([{ name: '', dosage: '', frequency: '', duration: '' }]);
    setRxNotes('');
    setPrescriptionModal(true);
  };

  const handleGeneratePrescription = (e) => {
    e.preventDefault();
    if (!rxDiagnosis.trim()) { toast.error('Please enter a diagnosis.'); return; }
    setRxLoading(true);

    try {
      const doc = new jsPDF();
      // Header
      doc.setFillColor(22, 163, 74);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('CareConnect Healthcare Platform', 15, 19);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text('Official Digital Prescription', 148, 19);

      // Patient Info
      const patientName = selectedApt?.patient?.fullName || selectedApt?.patient?.name || 'Patient';
      const doctorName = user?.fullName || user?.name || 'Doctor';
      const aptDate = selectedApt?.date ? formatDate(selectedApt.date) : new Date().toLocaleDateString();

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11); doc.setFont('helvetica', 'bold');
      doc.text(`Patient: ${patientName}`, 15, 44);
      doc.setFont('helvetica', 'normal');
      doc.text(`Prescribing Doctor: Dr. ${doctorName}`, 15, 52);
      doc.text(`Date: ${aptDate}  |  Time: ${selectedApt?.timeSlot || '—'}`, 15, 60);
      doc.text(`Clinical Diagnosis: ${rxDiagnosis}`, 15, 68);

      doc.setDrawColor(203, 213, 225);
      doc.line(15, 76, 195, 76);

      doc.setFont('helvetica', 'bold');
      doc.text('Rx — Prescribed Medications:', 15, 86);

      let yPos = 96;
      rxMedicines.forEach((m, idx) => {
        if (m.name) {
          doc.setFont('helvetica', 'bold');
          doc.text(`${idx + 1}. ${m.name}${m.dosage ? ` (${m.dosage})` : ''}`, 20, yPos);
          doc.setFont('helvetica', 'normal');
          doc.text(`Instructions: ${m.frequency || 'As directed'} | Duration: ${m.duration || 'N/A'}`, 25, yPos + 7);
          yPos += 18;
        }
      });

      if (rxNotes) {
        doc.setFont('helvetica', 'bold');
        doc.text('Doctor Notes / Dietary Advice:', 15, yPos + 6);
        doc.setFont('helvetica', 'normal');
        const splitNotes = doc.splitTextToSize(rxNotes, 175);
        doc.text(splitNotes, 20, yPos + 14);
      }

      doc.setFontSize(8); doc.setTextColor(100, 116, 139);
      doc.text('Digitally generated & authenticated via CareConnect Healthcare EHR Platform.', 15, 278);

      doc.save(`Prescription_${selectedApt?._id || 'Apt'}.pdf`);

      // Mark as completed after issuing prescription
      if (selectedApt) {
        handleUpdateStatus(selectedApt._id, 'completed');
      }
      setPrescriptionModal(false);
      toast.success('Prescription generated & appointment completed.');
    } catch {
      toast.error('Failed to generate prescription.');
    } finally {
      setRxLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            {isDoctor ? 'Practitioner Schedule' : 'My Care Appointments'}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
            {isDoctor ? 'Patient Appointment Queue' : 'My Consultations'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isDoctor
              ? 'Review, confirm, reject, and manage patient bookings.'
              : 'Track your upcoming and past doctor consultations.'}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchAppointments}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>

          {/* "Book a Doctor" — ONLY for patients, NEVER for doctors */}
          {!isDoctor && (
            <button
              onClick={() => navigate('/doctors')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              Book a Doctor
            </button>
          )}
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-slate-200">
        {tabs.map((tab) => {
          const count = tab.key === 'all'
            ? appointments.length
            : appointments.filter((a) => {
                const s = (a.status || '').toLowerCase();
                if (tab.key === 'upcoming')  return s === 'confirmed';
                if (tab.key === 'cancelled') return s === 'cancelled' || s === 'rejected';
                return s === tab.key;
              }).length;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap pb-3 px-1 mr-4 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === tab.key ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Appointment Cards ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 text-emerald-600 animate-spin" />
          <span className="ml-3 text-sm text-slate-500">Loading appointments...</span>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <EmptyState isDoctor={isDoctor} />
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => {
            const status = (apt.status || '').toLowerCase();

            // Person to display changes by role
            const otherPerson = isDoctor
              ? (apt.patient?.fullName || apt.patient?.name || 'Patient')
              : (apt.doctor?.fullName || apt.doctor?.name || 'Doctor');

            const otherSub = isDoctor
              ? `Phone: ${apt.patient?.phone || 'On File'}`
              : (apt.doctor?.specialization || 'Healthcare Specialist');

            const canCancel = !isDoctor && (status === 'pending' || status === 'confirmed');
            const canDoctorAct = isDoctor && status !== 'cancelled' && status !== 'completed' && status !== 'rejected';

            return (
              <div
                key={apt._id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">

                  {/* Person Info */}
                  <div className="flex items-start gap-3.5">
                    {(isDoctor ? apt.patient?.profilePhoto : apt.doctor?.profilePhoto) ? (
                      <img
                        src={getProfileImageUrl(isDoctor ? apt.patient?.profilePhoto : apt.doctor?.profilePhoto)}
                        alt={otherPerson}
                        className="h-11 w-11 rounded-xl object-cover border border-slate-200 shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextElementSibling) {
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className={`h-11 w-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0 ${
                        (isDoctor ? apt.patient?.profilePhoto : apt.doctor?.profilePhoto) ? 'hidden' : 'flex'
                      }`}
                    >
                      {isDoctor
                        ? <User className="h-5 w-5" />
                        : <Stethoscope className="h-5 w-5" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {isDoctor ? otherPerson : `Dr. ${otherPerson}`}
                      </h3>
                      <p className="text-xs text-emerald-700 font-medium">{otherSub}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-medium text-slate-700">{formatDate(apt.date)}</span>
                        </span>
                        {apt.timeSlot && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {apt.timeSlot}
                          </span>
                        )}
                        {apt.type && (
                          <span className="flex items-center gap-1">
                            {apt.type === 'video'
                              ? <Video className="h-3.5 w-3.5 text-emerald-600" />
                              : <Building className="h-3.5 w-3.5 text-slate-500" />}
                            {apt.type === 'video' ? 'Video Call' : 'In-Clinic'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <StatusBadge status={apt.status} />
                </div>

                {/* Reason */}
                {apt.reason && (
                  <div className="mt-3 px-3 py-2 bg-slate-50 rounded-xl text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Reason:</span> {apt.reason}
                  </div>
                )}

                {/* Cancel reason */}
                {(status === 'cancelled' || status === 'rejected') && apt.cancelReason && (
                  <div className="mt-2 px-3 py-2 bg-red-50 rounded-xl text-xs text-red-700">
                    <span className="font-semibold">Reason:</span> {apt.cancelReason}
                  </div>
                )}

                {/* Actions Row */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  {/* Left: Open Chat */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/chat')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                      Open Chat
                    </button>
                  </div>

                  {/* Right: Role-specific actions */}
                  <div className="flex items-center gap-2">

                    {/* ── DOCTOR ACTIONS ── */}
                    {canDoctorAct && (
                      <>
                        {status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(apt._id, 'confirmed')}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Confirm
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(apt._id, 'rejected')}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </>
                        )}
                        {status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => openPrescriptionModal(apt)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Issue Prescription
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(apt._id, 'completed')}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors"
                            >
                              Complete Visit
                            </button>
                          </>
                        )}
                      </>
                    )}

                    {/* ── PATIENT ACTIONS ── */}
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(apt._id)}
                        disabled={cancellingId === apt._id}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors disabled:opacity-60"
                      >
                        {cancellingId === apt._id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <XCircle className="h-3.5 w-3.5" />}
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Prescription Modal (Doctor only) ──────────────────────────────────── */}
      <Modal
        isOpen={prescriptionModal}
        onClose={() => setPrescriptionModal(false)}
        title="Issue Digital Prescription"
        subtitle={`Patient: ${selectedApt?.patient?.fullName || selectedApt?.patient?.name || 'Patient'}`}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleGeneratePrescription} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Diagnosis <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={rxDiagnosis}
              onChange={(e) => setRxDiagnosis(e.target.value)}
              placeholder="e.g. Acute Pharyngitis, Type 2 Diabetes follow-up"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700">Prescribed Medications</label>
              <button
                type="button"
                onClick={() => setRxMedicines([...rxMedicines, { name: '', dosage: '', frequency: '', duration: '' }])}
                className="text-xs text-emerald-600 font-semibold hover:underline"
              >
                + Add Medicine
              </button>
            </div>
            <div className="space-y-2">
              {rxMedicines.map((med, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Medicine name"
                      value={med.name}
                      onChange={(e) => {
                        const u = [...rxMedicines]; u[idx].name = e.target.value; setRxMedicines(u);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Dosage"
                      value={med.dosage}
                      onChange={(e) => {
                        const u = [...rxMedicines]; u[idx].dosage = e.target.value; setRxMedicines(u);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Frequency"
                      value={med.frequency}
                      onChange={(e) => {
                        const u = [...rxMedicines]; u[idx].frequency = e.target.value; setRxMedicines(u);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Duration"
                      value={med.duration}
                      onChange={(e) => {
                        const u = [...rxMedicines]; u[idx].duration = e.target.value; setRxMedicines(u);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Instructions &amp; Dietary Advice (Optional)
            </label>
            <textarea
              rows={2}
              value={rxNotes}
              onChange={(e) => setRxNotes(e.target.value)}
              placeholder="Take with meals, avoid direct sunlight, drink plenty of water..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setPrescriptionModal(false)}
              className="px-4 py-2 text-xs font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rxLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-60"
            >
              {rxLoading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Download className="h-3.5 w-3.5" />}
              Generate Prescription PDF
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default AppointmentsPage;
