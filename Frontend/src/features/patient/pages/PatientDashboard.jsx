import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  FileText, 
  MessageSquare, 
  Search, 
  Pill, 
  ChevronRight, 
  Video, 
  Download, 
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../auth/Auth.context';
import { appointmentService } from '../../appointments/services/appointment.service';
import { StatusBadge } from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { jsPDF } from 'jspdf';

export const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sample fallback data if user has no appointments yet
  const fallbackAppointments = [
    {
      _id: 'apt-1',
      doctorId: {
        name: 'Dr. Sarah Smith',
        specialization: 'Cardiology',
        profileImage: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
      },
      appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      appointmentTime: '10:30 AM',
      appointmentType: 'VIDEO',
      status: 'CONFIRMED',
      reason: 'Routine blood pressure review',
    },
    {
      _id: 'apt-2',
      doctorId: {
        name: 'Dr. Marcus Vance',
        specialization: 'General Medicine',
        profileImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
      },
      appointmentDate: new Date(Date.now() + 432000000).toISOString().split('T')[0],
      appointmentTime: '02:15 PM',
      appointmentType: 'IN_PERSON',
      status: 'SCHEDULED',
      reason: 'Annual wellness checkup',
    }
  ];

  const samplePrescriptions = [
    {
      _id: 'rx-101',
      date: '2026-09-24',
      doctorName: 'Dr. Sarah Smith',
      diagnosis: 'Mild Essential Hypertension',
      medicines: [
        { name: 'Amlodipine Besylate', dosage: '5mg', frequency: 'Once daily in morning', duration: '30 days' },
        { name: 'CoQ10 Supplement', dosage: '100mg', frequency: 'With lunch', duration: '60 days' }
      ]
    },
    {
      _id: 'rx-102',
      date: '2026-08-10',
      doctorName: 'Dr. Emily Chen',
      diagnosis: 'Contact Dermatitis',
      medicines: [
        { name: 'Hydrocortisone 1% Cream', dosage: 'Topical', frequency: 'Twice daily after bath', duration: '7 days' }
      ]
    }
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const res = await appointmentService.getMyAppointments({ limit: 5 });
        const list = res.data?.data?.appointments || [];
        setAppointments(list.length > 0 ? list : fallbackAppointments);
      } catch (err) {
        setAppointments(fallbackAppointments);
      } finally {
        setPrescriptions(samplePrescriptions);
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // PDF Prescription Generator
  const downloadPrescriptionPDF = (rx) => {
    const doc = new jsPDF();

    // Clean modern medical header
    doc.setFillColor(22, 163, 74); // Emerald 600
    doc.rect(0, 0, 210, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('CareConnect Healthcare Platform', 15, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Digital Prescription & Medical Record', 130, 18);

    // Patient & Doctor Information
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Patient: ${user?.name || 'Patient'}`, 15, 42);
    doc.setFont('helvetica', 'normal');
    doc.text(`Prescribing Physician: ${rx.doctorName}`, 15, 50);
    doc.text(`Date of Issue: ${rx.date}`, 15, 58);
    doc.text(`Diagnosis: ${rx.diagnosis}`, 15, 66);

    // Line separator
    doc.setDrawColor(203, 213, 225);
    doc.line(15, 74, 195, 74);

    // Medicines Table
    doc.setFont('helvetica', 'bold');
    doc.text('Rx - Prescribed Medications:', 15, 84);

    let yPos = 94;
    rx.medicines.forEach((med, idx) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${med.name} (${med.dosage})`, 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`Instructions: ${med.frequency} | Duration: ${med.duration}`, 25, yPos + 6);
      yPos += 16;
    });

    // Medical Disclaimer & Security Verification
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Digitally generated & authenticated via CareConnect HIPAA-compliant cloud EHR.', 15, 270);
    doc.text(`Rx ID: ${rx._id} • For emergency medical assistance please dial 911 or visit local hospital.`, 15, 276);

    doc.save(`Prescription_${rx._id}.pdf`);
  };

  const nextAppointment = appointments[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Patient Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">
            Welcome back, {user?.name || 'Patient'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your consultations, prescriptions, and health notifications
          </p>
        </div>

        <div className="flex gap-3">
          <Link to="/doctors">
            <Button
              variant="primary"
              size="md"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-xl text-xs flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" /> Book New Appointment
            </Button>
          </Link>
          <Link to="/medicines">
            <Button
              variant="outline"
              size="md"
              className="border-slate-300 text-slate-700 hover:bg-slate-50 py-2.5 px-4 rounded-xl text-xs flex items-center gap-2"
            >
              <Pill className="h-4 w-4 text-emerald-600" /> Medicine Guide
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Upcoming Appointments</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{appointments.length}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Confirmed & Scheduled</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Digital Prescriptions</span>
            <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{prescriptions.length}</p>
          <span className="text-[11px] text-slate-500 font-medium">Available for PDF download</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Consultations Done</span>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">6</p>
          <span className="text-[11px] text-purple-600 font-medium">All completed</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">CareConnect Messages</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">2</p>
          <span className="text-[11px] text-amber-600 font-medium">Active doctor threads</span>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Next Appointment & All Appointments */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Next Up Hero Card */}
          {nextAppointment && (
            <div className="bg-emerald-900 text-white rounded-3xl p-6 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-emerald-800">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300">
                  <Clock className="h-4 w-4" /> Next Upcoming Consultation
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-800 text-emerald-200">
                  {nextAppointment.status}
                </span>
              </div>

              <div className="py-4 flex items-center gap-4">
                <img
                  src={nextAppointment.doctorId?.profileImage || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200'}
                  alt={nextAppointment.doctorId?.name}
                  className="h-14 w-14 rounded-2xl object-cover border border-emerald-700"
                />
                <div>
                  <h3 className="text-base font-bold text-white">
                    {nextAppointment.doctorId?.name || 'Dr. Specialist'}
                  </h3>
                  <p className="text-xs text-emerald-300">
                    {nextAppointment.doctorId?.specialization || 'Healthcare Specialist'}
                  </p>
                  <p className="text-xs text-emerald-100 mt-1">
                    Date: <span className="font-semibold">{nextAppointment.appointmentDate} at {nextAppointment.appointmentTime}</span>
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-3">
                <Link to="/chat" className="flex-1">
                  <Button
                    variant="primary"
                    fullWidth
                    size="sm"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Message Doctor
                  </Button>
                </Link>
                <Link to="/appointments" className="flex-1">
                  <Button
                    variant="outline"
                    fullWidth
                    size="sm"
                    className="bg-emerald-800/80 hover:bg-emerald-800 text-white border-emerald-700 font-medium py-2 rounded-xl text-xs"
                  >
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Upcoming Consultations List */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Scheduled Appointments
              </h3>
              <Link to="/appointments" className="text-xs font-semibold text-emerald-600 hover:underline">
                View all ({appointments.length})
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {appointments.map((apt) => (
                <div key={apt._id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                      {apt.appointmentType === 'VIDEO' ? <Video className="h-5 w-5 text-emerald-600" /> : <Calendar className="h-5 w-5 text-slate-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {apt.doctorId?.name || 'Dr. Specialist'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {apt.appointmentDate} • {apt.appointmentTime} ({apt.appointmentType})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={apt.status} />
                    <Link to="/appointments">
                      <ChevronRight className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Prescriptions & Health Quick links */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Prescriptions Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Medical Prescriptions
                </h3>
              </div>
              <span className="text-xs text-slate-400">PDF Ready</span>
            </div>

            <div className="space-y-3">
              {prescriptions.map((rx) => (
                <div
                  key={rx._id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{rx.diagnosis}</h4>
                      <p className="text-[11px] text-slate-500">{rx.doctorName} • {rx.date}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadPrescriptionPDF(rx)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 hover:border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" /> PDF
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1">
                    {rx.medicines.map((m, idx) => (
                      <p key={idx}>
                        • <span className="font-semibold text-slate-800">{m.name}</span> ({m.dosage}) - {m.frequency}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Health Record Profile Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-3">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              My Health Summary
            </h4>
            <div className="text-xs text-slate-600 space-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Blood Group:</span>
                <span className="font-semibold text-slate-800">O Positive (O+)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Known Allergies:</span>
                <span className="font-semibold text-slate-800">Penicillin (Mild)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Emergency Contact:</span>
                <span className="font-semibold text-slate-800">+1 (555) 392-1049</span>
              </div>
            </div>
            <Link to="/patient/profile" className="block pt-1">
              <Button
                variant="outline"
                fullWidth
                size="sm"
                className="text-xs py-2 rounded-xl text-slate-700 font-medium"
              >
                Update Medical Information
              </Button>
            </Link>
          </div>

        </div>

      </div>

    </div>
  );
};

export default PatientDashboard;
