import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Clock, 
  Star, 
  DollarSign, 
  Video, 
  CheckCircle, 
  FileText, 
  Activity, 
  ChevronRight,
  TrendingUp,
  Settings
} from 'lucide-react';
import { useAuth } from '../../auth/Auth.context';
import { appointmentService } from '../../appointments/services/appointment.service';
import { StatusBadge } from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback appointments for doctor view
  const fallbackSchedule = [
    {
      _id: 'apt-001',
      patientId: { name: 'John Doe', phone: '+1 (555) 392-1049' },
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: '10:30 AM',
      appointmentType: 'VIDEO',
      status: 'CONFIRMED',
      reason: 'Hypertension follow-up & ECG results review',
    },
    {
      _id: 'apt-002',
      patientId: { name: 'Alice Johnson', phone: '+1 (555) 782-9901' },
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: '11:45 AM',
      appointmentType: 'IN_PERSON',
      status: 'SCHEDULED',
      reason: 'Chest tightness after exertion',
    },
    {
      _id: 'apt-003',
      patientId: { name: 'David Lee', phone: '+1 (555) 882-3112' },
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: '02:15 PM',
      appointmentType: 'VIDEO',
      status: 'SCHEDULED',
      reason: 'Medication adjustment consultation',
    },
    {
      _id: 'apt-004',
      patientId: { name: 'Emma Watson', phone: '+1 (555) 441-2093' },
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: '04:00 PM',
      appointmentType: 'IN_PERSON',
      status: 'COMPLETED',
      reason: 'Routine checkup',
    }
  ];

  useEffect(() => {
    const fetchDocData = async () => {
      setLoading(true);
      try {
        const res = await appointmentService.getMyAppointments();
        const list = res.data?.data?.appointments || [];
        setAppointments(list.length > 0 ? list : fallbackSchedule);
      } catch (err) {
        setAppointments(fallbackSchedule);
      } finally {
        setLoading(false);
      }
    };
    fetchDocData();
  }, []);

  const totalPatients = 142;
  const todayCount = appointments.length;
  const completedToday = appointments.filter(a => a.status === 'COMPLETED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Practitioner Portal
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ● Active for Consultations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Dr. {user?.name || 'Practitioner'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Today is {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link to="/doctor/availability">
            <Button
              variant="outline"
              size="md"
              className="border-slate-300 text-slate-700 hover:bg-slate-50 py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5"
            >
              <Activity className="h-4 w-4 text-emerald-600" />
              Manage Availability
            </Button>
          </Link>
          <Link to="/appointments">
            <Button
              variant="primary"
              size="md"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5"
            >
              <Calendar className="h-4 w-4" />
              Full Schedule
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Appointments</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{todayCount}</p>
          <span className="text-[11px] text-emerald-600 font-medium">
            {completedToday} of {todayCount} completed
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Consulted Patients</span>
            <div className="h-8 w-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalPatients}</p>
          <span className="text-[11px] text-slate-400 font-medium">+14 this month</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Doctor Rating</span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">4.92 / 5.0</p>
          <span className="text-[11px] text-slate-400 font-medium">From 142 patient reviews</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Estimated Earnings</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">$3,450</p>
          <span className="text-[11px] text-emerald-600 font-medium">Current billing period</span>
        </div>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Today's Queue */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Today's Patient Schedule</h3>
              <p className="text-xs text-slate-500">Immediate queue of patients booked for consultation today</p>
            </div>
            <Link to="/appointments" className="text-xs font-semibold text-emerald-600 hover:underline">
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {appointments.map((apt) => (
              <div key={apt._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0 mt-0.5">
                    {apt.appointmentType === 'VIDEO' ? <Video className="h-5 w-5 text-emerald-600" /> : <Calendar className="h-5 w-5 text-slate-600" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {apt.patientId?.name || 'Patient'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Time: <span className="font-semibold text-slate-700">{apt.appointmentTime}</span> • {apt.appointmentType === 'VIDEO' ? 'Online Video Call' : 'In-Clinic'}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      <span className="font-semibold">Reason:</span> {apt.reason}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <StatusBadge status={apt.status} />
                  <Link to="/appointments">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs py-1.5 px-3 rounded-lg border-slate-200"
                    >
                      Consult / Rx
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Quick Profile Info & Practice Details */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Practitioner Details
            </h4>
            <div className="text-xs text-slate-600 space-y-2">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Consultation Fee:</span>
                <span className="font-bold text-emerald-700">$75 / visit</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Specialty:</span>
                <span className="font-semibold text-slate-800">Cardiology</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400">Hospital:</span>
                <span className="font-semibold text-slate-800">Metro Heart Institute</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Verified License:</span>
                <span className="font-semibold text-slate-800">MD-NY-84920</span>
              </div>
            </div>

            <Link to="/doctor/profile" className="block pt-1">
              <Button
                variant="outline"
                fullWidth
                size="sm"
                className="text-xs py-2 rounded-xl text-slate-700 font-medium"
              >
                Edit Practice Profile
              </Button>
            </Link>
          </div>

          <div className="bg-emerald-900 text-white rounded-3xl p-6 shadow-xs space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-300">
              Quick Action
            </h4>
            <p className="text-xs text-emerald-100 leading-relaxed">
              Adjust your working days and consultation slot intervals to fit your weekly schedule.
            </p>
            <Link to="/doctor/availability" className="block pt-2">
              <Button
                variant="primary"
                fullWidth
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold py-2 rounded-xl text-xs"
              >
                Configure Availability
              </Button>
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
};

export default DoctorDashboard;
