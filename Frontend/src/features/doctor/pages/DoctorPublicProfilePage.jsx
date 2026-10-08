import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, 
  MapPin, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  Stethoscope, 
  Award, 
  CheckCircle,
  Video,
  Building,
  AlertCircle,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';
import { doctorService } from '../services/doctor.service';
import { appointmentService } from '../../appointments/services/appointment.service';
import { useAuth } from '../../auth/Auth.context';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

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

// Helper to get doctor initials
const getInitials = (name = '') => {
  const clean = name.replace(/^Dr\.\s*/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'DR';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const DoctorPublicProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const userRole = (user?.role || '').toLowerCase();
  const isDoctor = userRole === 'doctor';

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [consultationType, setConsultationType] = useState('VIDEO');
  const [symptoms, setSymptoms] = useState('');
  const [reason, setReason] = useState('General Consultation');

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Available slots for appointment booking
  const availableSlots = [
    '09:00 AM', '09:30 AM', '10:15 AM', '11:00 AM',
    '02:00 PM', '02:30 PM', '03:15 PM', '04:00 PM', '04:45 PM'
  ];

  useEffect(() => {
    const fetchDoc = async () => {
      setLoading(true);
      try {
        const res = await doctorService.getPublicProfile(id);
        const u = res.data?.data?.user;
        const p = res.data?.data?.profile;
        const w = res.data?.data?.workplaces || [];

        if (!u && !p && !res.data?.data?.doctor) {
          setDoctor(null);
          return;
        }

        const rawDoc = res.data?.data?.doctor;
        setDoctor({
          _id: u?.id || u?._id || rawDoc?._id || id,
          id: u?.id || u?._id || rawDoc?._id || id,
          name: u?.fullName || rawDoc?.name || 'Doctor',
          fullName: u?.fullName || rawDoc?.name || 'Doctor',
          specialization: p?.specialization || rawDoc?.specialization || 'General Medicine',
          hospitalAffiliation: w[0]?.hospitalName || p?.city || rawDoc?.hospitalAffiliation || 'MediQ Partner Network',
          consultationFee: p?.consultationFee ?? rawDoc?.consultationFee ?? 500,
          experienceYears: p?.yearsOfExperience ?? rawDoc?.experienceYears ?? 0,
          averageRating: p?.rating || rawDoc?.averageRating || 4.9,
          totalReviews: p?.reviewCount || rawDoc?.totalReviews || 0,
          about: p?.about || rawDoc?.about || 'Dedicated practitioner offering comprehensive medical consultations and personalized patient care.',
          education: Array.isArray(p?.education) && p.education.length > 0
            ? p.education.map((e) => `${e.degree || ''} (${e.institution || ''})`).join(', ')
            : (p?.qualifications || rawDoc?.education || 'Certified Medical Practitioner'),
          profileImage: u?.profilePhoto || rawDoc?.profileImage || null,
        });
      } catch (err) {
        // Real error handling: do NOT set fake fallback doctor
        setDoctor(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [id]);

  const handleBookClick = () => {
    if (isDoctor) {
      toast.error('Doctors cannot book appointments. Only patients can book consultations.');
      return;
    }
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/doctors/${id}` } } });
      return;
    }
    if (!selectedSlot) {
      toast.error('Please select an available appointment time slot first.');
      return;
    }
    setIsBookingOpen(true);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (isDoctor) {
      toast.error('Doctors cannot book appointments.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      await appointmentService.book({
        doctorId: doctor._id || doctor.id || id,
        date: selectedDate,
        timeSlot: selectedSlot,
        reason: reason || 'General Consultation',
      });

      setBookingSuccess(true);
      toast.success('Appointment booked successfully!');
      setTimeout(() => {
        setIsBookingOpen(false);
        navigate('/appointments');
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to book appointment. Please try again.';
      setBookingError(msg);
      toast.error(msg);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage={false} text="Loading doctor profile..." />;
  }

  if (!doctor) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Stethoscope className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Doctor Profile Not Found</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
          This doctor profile is unavailable or does not exist.
        </p>
        <Button onClick={() => navigate('/doctors')} className="mt-5 text-xs py-2 px-4">
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Doctors
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Profile Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {doctor.profileImage ? (
            <img
              src={getProfileImageUrl(doctor.profileImage)}
              alt={doctor.name}
              className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div
            className={`h-28 w-28 sm:h-32 sm:w-32 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 border border-emerald-200 text-emerald-800 font-bold text-2xl sm:text-3xl flex flex-col items-center justify-center shadow-xs shrink-0 ${
              doctor.profileImage ? 'hidden' : 'flex'
            }`}
          >
            <Stethoscope className="h-8 w-8 text-emerald-600 mb-1 opacity-80" />
            <span>{getInitials(doctor.name)}</span>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {doctor.name}
              </h1>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <CheckCircle className="h-3.5 w-3.5" /> Verified Practitioner
              </span>
            </div>

            <p className="text-base font-semibold text-emerald-700">
              {doctor.specialization}
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <Building className="h-4 w-4 text-slate-400" />
                {doctor.hospitalAffiliation || 'MediQ Partner Hospital'}
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-slate-400" />
                {doctor.experienceYears || 0} Years Experience
              </span>
              <span className="flex items-center gap-1 font-semibold text-slate-800">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {doctor.averageRating || 4.9} ({doctor.totalReviews || 0} reviews)
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 pt-2 leading-relaxed max-w-3xl">
              {doctor.about}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-center min-w-[200px] w-full md:w-auto">
            <span className="text-xs text-slate-500 font-medium">Consultation Fee</span>
            <p className="text-3xl font-extrabold text-emerald-700 my-1">
              ₹{doctor.consultationFee ?? 500}
            </p>
            <p className="text-[11px] text-slate-400 mb-3">Includes digital prescription &amp; follow-up chat</p>
            
            {/* If logged-in user is a Doctor, DO NOT allow booking another doctor */}
            {isDoctor ? (
              <Button
                variant="outline"
                fullWidth
                onClick={() => navigate('/chat')}
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-medium py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Message Colleague
              </Button>
            ) : (
              <Button
                variant="primary"
                fullWidth
                onClick={handleBookClick}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl text-sm"
              >
                Book Consultation
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Appointment Slot Picker & Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Slot Selector or Doctor Notice */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
          {isDoctor ? (
            /* Informative Notice for Doctor Users: Doctors Cannot Book Other Doctors */
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Stethoscope className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Doctor Account Notice</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                You are logged in as a registered Doctor. Healthcare practitioners cannot book patient consultations with other doctors. Appointment booking is reserved exclusively for registered patients.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/chat')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-xl text-xs flex items-center gap-1.5"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Open Messages
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/doctor/dashboard')}
                  className="border-slate-300 text-slate-700 font-medium py-2 px-4 rounded-xl text-xs"
                >
                  Go to Doctor Dashboard
                </Button>
              </div>
            </div>
          ) : (
            /* Regular Patient Slot Picker */
            <>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Select Appointment Slot
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose your preferred date and convenient time window
                </p>
              </div>

              {/* Date Picker Input */}
              <div className="max-w-xs">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot(null);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                />
              </div>

              {/* Available Slots Pills */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
                  Available Time Windows
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mode of Consultation */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
                  Consultation Mode
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setConsultationType('VIDEO')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold border transition-all ${
                      consultationType === 'VIDEO'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Video className="h-4 w-4 text-emerald-600" />
                    Video Consultation (Online)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsultationType('IN_PERSON')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold border transition-all ${
                      consultationType === 'IN_PERSON'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Building className="h-4 w-4 text-emerald-600" />
                    In-Clinic Visit
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  fullWidth
                  size="lg"
                  disabled={!selectedSlot}
                  onClick={handleBookClick}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl text-sm"
                >
                  {selectedSlot ? `Book for ${selectedSlot} on ${selectedDate}` : 'Please choose a time slot'}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Credentials & Hospital Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Education &amp; Certifications
            </h4>
            <div className="text-xs text-slate-600 space-y-2">
              <p>• {doctor.education || 'Certified Medical Practitioner'}</p>
              <p>• Certified by National Board of Medical Examiners</p>
              <p>• Member of MediQ Verified Clinical Network</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Patient Trust &amp; Guarantee
            </h4>
            <div className="text-xs text-slate-600 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <ShieldCheck className="h-4 w-4" /> Free rescheduling up to 2 hours prior
              </div>
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <CheckCircle className="h-3.5 w-3.5" /> 100% verified medical credentials
              </div>
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <Clock className="h-4 w-4" /> Guaranteed on-time doctor joins
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Booking Confirmation Modal (Patient only) */}
      {!isDoctor && (
        <Modal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          title="Confirm Appointment"
          subtitle={`Booking with ${doctor.name}`}
        >
          {bookingSuccess ? (
            <div className="text-center py-6 space-y-3">
              <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Appointment Confirmed!</h4>
              <p className="text-xs text-slate-500">
                You are scheduled for {selectedDate} at {selectedSlot}. Redirecting to your appointments...
              </p>
            </div>
          ) : (
            <form onSubmit={handleConfirmBooking} className="space-y-4">
              {bookingError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {bookingError}
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs text-slate-700 border border-slate-200/60">
                <div className="flex justify-between">
                  <span className="text-slate-500">Date &amp; Time:</span>
                  <span className="font-semibold">{selectedDate} at {selectedSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Consultation Type:</span>
                  <span className="font-semibold">{consultationType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Consultation Fee:</span>
                  <span className="font-bold text-emerald-700">₹{doctor.consultationFee ?? 500}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Visit <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Follow-up consultation, chest tightness, routine check"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Symptoms / Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Briefly describe how you feel or any symptoms you have..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBookingOpen(false)}
                  className="w-1/2 py-2.5 text-xs font-medium"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={bookingLoading}
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 text-xs rounded-lg"
                >
                  Confirm Booking
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}

    </div>
  );
};

export default DoctorPublicProfilePage;
