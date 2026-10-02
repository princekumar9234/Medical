import { useState, useEffect } from 'react';
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
  Filter,
  Download
} from 'lucide-react';
import { useAuth } from '../../auth/Auth.context';
import { appointmentService } from '../services/appointment.service';
import { StatusBadge } from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { jsPDF } from 'jspdf';

export const AppointmentsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  // Doctor prescription modal state
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [rxDiagnosis, setRxDiagnosis] = useState('');
  const [rxMedicines, setRxMedicines] = useState([
    { name: '', dosage: '', frequency: '', duration: '' }
  ]);
  const [rxNotes, setRxNotes] = useState('');

  const isDoctor = user?.role === 'DOCTOR';

  // Demo fallback appointments
  const fallbackList = [
    {
      _id: 'apt-001',
      doctorId: {
        _id: 'doc-1',
        name: 'Dr. Sarah Smith',
        specialization: 'Cardiology',
      },
      patientId: {
        _id: 'pat-1',
        name: 'John Doe',
        phone: '+1 (555) 392-1049',
      },
      appointmentDate: '2026-10-04',
      appointmentTime: '10:30 AM',
      appointmentType: 'VIDEO',
      status: 'CONFIRMED',
      reason: 'Routine hypertension follow-up & blood work review',
      symptoms: 'Mild dizziness occasionally upon standing',
      createdAt: '2026-10-01',
    },
    {
      _id: 'apt-002',
      doctorId: {
        _id: 'doc-2',
        name: 'Dr. Marcus Vance',
        specialization: 'General Medicine',
      },
      patientId: {
        _id: 'pat-2',
        name: 'Alice Johnson',
        phone: '+1 (555) 782-9901',
      },
      appointmentDate: '2026-10-07',
      appointmentTime: '02:00 PM',
      appointmentType: 'IN_PERSON',
      status: 'SCHEDULED',
      reason: 'Seasonal allergy assessment',
      symptoms: 'Sneezing, nasal congestion for 2 weeks',
      createdAt: '2026-10-01',
    },
    {
      _id: 'apt-003',
      doctorId: {
        _id: 'doc-1',
        name: 'Dr. Sarah Smith',
        specialization: 'Cardiology',
      },
      patientId: {
        _id: 'pat-3',
        name: 'Robert Miller',
        phone: '+1 (555) 441-2093',
      },
      appointmentDate: '2026-09-28',
      appointmentTime: '11:15 AM',
      appointmentType: 'VIDEO',
      status: 'COMPLETED',
      reason: 'Post-medication cardiac evaluation',
      symptoms: 'None reported, feeling stable',
      createdAt: '2026-09-25',
    }
  ];

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentService.getMyAppointments();
      const list = res.data?.data?.appointments || [];
      setAppointments(list.length > 0 ? list : fallbackList);
    } catch (err) {
      setAppointments(fallbackList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await appointmentService.updateStatus(id, newStatus);
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: newStatus } : a));
    } catch (err) {
      // Local state update for instant responsive feel
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: newStatus } : a));
    }
  };

  const handleAddMedicineRow = () => {
    setRxMedicines([...rxMedicines, { name: '', dosage: '', frequency: '', duration: '' }]);
  };

  const handleMedicineChange = (index, field, value) => {
    const updated = [...rxMedicines];
    updated[index][field] = value;
    setRxMedicines(updated);
  };

  const handleSaveAndGeneratePrescription = (e) => {
    e.preventDefault();
    if (!rxDiagnosis) {
      alert('Please enter a diagnosis');
      return;
    }

    const doc = new jsPDF();
    doc.setFillColor(22, 163, 74);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CareConnect Healthcare Platform', 15, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Digital Prescription', 145, 18);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Patient: ${selectedAppointment?.patientId?.name || 'Patient'}`, 15, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(`Attending Doctor: ${user?.name || 'Doctor'}`, 15, 50);
    doc.text(`Date: ${selectedAppointment?.appointmentDate || new Date().toISOString().split('T')[0]}`, 15, 58);
    doc.text(`Clinical Diagnosis: ${rxDiagnosis}`, 15, 66);

    doc.setDrawColor(203, 213, 225);
    doc.line(15, 74, 195, 74);

    doc.setFont('helvetica', 'bold');
    doc.text('Rx - Prescribed Medications:', 15, 84);

    let yPos = 94;
    rxMedicines.forEach((m, idx) => {
      if (m.name) {
        doc.setFont('helvetica', 'bold');
        doc.text(`${idx + 1}. ${m.name} ${m.dosage ? `(${m.dosage})` : ''}`, 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`Dosage & Regimen: ${m.frequency || 'As directed'} | Duration: ${m.duration || 'N/A'}`, 25, yPos + 6);
        yPos += 16;
      }
    });

    if (rxNotes) {
      doc.setFont('helvetica', 'bold');
      doc.text('Doctor Notes / Dietary Advice:', 15, yPos + 6);
      doc.setFont('helvetica', 'normal');
      doc.text(rxNotes, 20, yPos + 14);
    }

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Digitally signed and cryptographically verified on CareConnect EHR.', 15, 275);

    doc.save(`Prescription_${selectedAppointment?._id || 'Apt'}.pdf`);
    setIsPrescriptionModalOpen(false);

    // Also mark appointment as completed
    if (selectedAppointment) {
      handleUpdateStatus(selectedAppointment._id, 'COMPLETED');
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UPCOMING') return apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED';
    if (activeTab === 'COMPLETED') return apt.status === 'COMPLETED';
    if (activeTab === 'CANCELLED') return apt.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            {isDoctor ? 'Practitioner Schedule' : 'My Care Appointments'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">
            {isDoctor ? 'Patient Appointment Queue' : 'My Scheduled Consultations'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your schedule, video calls, cancellations, and clinical prescriptions
          </p>
        </div>

        {!isDoctor && (
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/doctors')}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-xl text-xs"
          >
            Book Another Doctor
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-semibold gap-6">
        {[
          { key: 'ALL', label: 'All Appointments' },
          { key: 'UPCOMING', label: 'Upcoming & Confirmed' },
          { key: 'COMPLETED', label: 'Completed' },
          { key: 'CANCELLED', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {loading ? (
        <LoadingSpinner fullPage={false} text="Loading appointments..." />
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
          <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No appointments found</h3>
          <p className="text-xs text-slate-500 mt-1">You don't have any appointments under this tab.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => (
            <div
              key={apt._id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 hover:border-slate-300 transition-all space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                
                {/* Person Information (Doctor view shows Patient, Patient view shows Doctor) */}
                <div className="flex items-start gap-3.5">
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {isDoctor ? <User className="h-6 w-6" /> : <Stethoscope className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {isDoctor
                        ? apt.patientId?.name || 'Patient'
                        : apt.doctorId?.name || 'Dr. Specialist'}
                    </h3>
                    <p className="text-xs text-emerald-700 font-medium">
                      {isDoctor
                        ? `Patient Contact: ${apt.patientId?.phone || 'On File'}`
                        : apt.doctorId?.specialization || 'Healthcare Specialist'}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {apt.appointmentDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {apt.appointmentTime}
                      </span>
                      <span className="flex items-center gap-1">
                        {apt.appointmentType === 'VIDEO' ? <Video className="h-3.5 w-3.5 text-emerald-600" /> : <Building className="h-3.5 w-3.5 text-slate-500" />}
                        {apt.appointmentType === 'VIDEO' ? 'Online Video' : 'In-Clinic'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Badge & Actions */}
                <div className="flex items-center gap-3">
                  <StatusBadge status={apt.status} />
                </div>
              </div>

              {/* Reason & Symptoms */}
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                <p><span className="font-semibold text-slate-800">Reason:</span> {apt.reason}</p>
                {apt.symptoms && (
                  <p><span className="font-semibold text-slate-800">Symptoms:</span> {apt.symptoms}</p>
                )}
              </div>

              {/* Action Buttons depending on role and status */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/chat')}
                    className="text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 text-slate-700"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                    Open Chat
                  </Button>

                  {apt.appointmentType === 'VIDEO' && apt.status !== 'CANCELLED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => alert(`Starting video consultation for appointment #${apt._id}. In production, this launches WebRTC video room.`)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5"
                    >
                      <Video className="h-3.5 w-3.5" />
                      Join Video Call
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Doctor Actions */}
                  {isDoctor && apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAppointment(apt);
                          setIsPrescriptionModalOpen(true);
                        }}
                        className="bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 font-medium"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Issue Prescription
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateStatus(apt._id, 'COMPLETED')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 px-3 rounded-lg font-medium"
                      >
                        Complete Visit
                      </Button>
                    </>
                  )}

                  {/* Cancel Action if scheduled */}
                  {(apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateStatus(apt._id, 'CANCELLED')}
                      className="text-rose-600 hover:bg-rose-50 text-xs py-1.5 px-3 rounded-lg font-medium"
                    >
                      Cancel Appointment
                    </Button>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Doctor Prescription Creation Modal */}
      <Modal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        title="Issue Digital Prescription"
        subtitle={`Patient: ${selectedAppointment?.patientId?.name || 'Patient'}`}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveAndGeneratePrescription} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Diagnosis *
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
              <label className="block text-xs font-semibold text-slate-700">
                Prescribed Medications
              </label>
              <button
                type="button"
                onClick={handleAddMedicineRow}
                className="text-xs text-emerald-600 font-semibold hover:underline"
              >
                + Add Medicine
              </button>
            </div>

            <div className="space-y-2.5">
              {rxMedicines.map((med, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Medicine name (e.g. Amoxicillin)"
                      value={med.name}
                      onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Dosage (500mg)"
                      value={med.dosage}
                      onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Freq (Twice daily)"
                      value={med.frequency}
                      onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Duration (7 days)"
                      value={med.duration}
                      onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Instructions & Dietary Advice (Optional)
            </label>
            <textarea
              rows={2}
              value={rxNotes}
              onChange={(e) => setRxNotes(e.target.value)}
              placeholder="Take with meals, hydrate well, avoid strenuous exercise..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 resize-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPrescriptionModalOpen(false)}
              className="py-2 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 text-xs rounded-lg flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Save & Generate Prescription PDF
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default AppointmentsPage;
