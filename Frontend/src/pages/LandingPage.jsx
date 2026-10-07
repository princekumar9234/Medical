import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  Award, 
  Heart, 
  ArrowRight, 
  Star, 
  CheckCircle2, 
  Activity, 
  Users, 
  FileText, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import Button from '../components/ui/Button';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');

  const specialties = [
    { name: 'Cardiology', icon: '❤️', doctors: '48 Doctors', description: 'Heart health, hypertension & rhythm' },
    { name: 'General Medicine', icon: '🩺', doctors: '120 Doctors', description: 'Routine checkups, fever & preventive care' },
    { name: 'Dermatology', icon: '✨', doctors: '64 Doctors', description: 'Skin allergies, acne & hair treatments' },
    { name: 'Pediatrics', icon: '👶', doctors: '52 Doctors', description: 'Child wellness, growth & vaccinations' },
    { name: 'Orthopedics', icon: '🦴', doctors: '41 Doctors', description: 'Bone fractures, joints & spine care' },
    { name: 'Neurology', icon: '🧠', doctors: '33 Doctors', description: 'Headaches, nerve care & cognitive health' },
    { name: 'Psychiatry', icon: '🌱', doctors: '29 Doctors', description: 'Mental wellness, anxiety & therapy' },
    { name: 'Ophthalmology', icon: '👁️', doctors: '37 Doctors', description: 'Vision care, eye fatigue & checks' },
  ];

  const featuredDoctors = [
    {
      id: 'doc-1',
      name: 'Dr. Sarah Smith, MD',
      specialty: 'Cardiology',
      hospital: 'Metro Heart Institute',
      experience: '12 yrs exp',
      rating: 4.9,
      reviews: 142,
      fee: '$75',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'doc-2',
      name: 'Dr. Marcus Vance, DO',
      specialty: 'General Medicine',
      hospital: 'City Health Clinic',
      experience: '9 yrs exp',
      rating: 4.8,
      reviews: 98,
      fee: '$50',
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'doc-3',
      name: 'Dr. Emily Chen, MBBS',
      specialty: 'Dermatology',
      hospital: 'Apex Skin & Laser Center',
      experience: '11 yrs exp',
      rating: 4.95,
      reviews: 210,
      fee: '$85',
      image: 'https://images.unsplash.com/photo-1594824813637-67c4e51145b2?auto=format&fit=crop&q=80&w=300',
    },
    {
      id: 'doc-4',
      name: 'Dr. Robert Jenkins, MD',
      specialty: 'Pediatrics',
      hospital: 'Children’s Medical Center',
      experience: '15 yrs exp',
      rating: 4.9,
      reviews: 175,
      fee: '$65',
      image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
    },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (searchTerm) query.set('q', searchTerm);
    if (selectedSpecialty) query.set('specialty', selectedSpecialty);
    navigate(`/doctors?${query.toString()}`);
  };

  return (
    <div className="space-y-12 sm:space-y-16 sm:space-y-24">
      {/* ─── HERO SECTION ─── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/50 via-white to-slate-50 pt-10 pb-12 lg:pt-20 lg:pb-24 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                Trusted by 50,000+ Patients Nationwide
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Compassionate healthcare,{' '}
                <span className="text-emerald-600">connected directly</span> to you.
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Book verified doctors, get real-time consultations, track digital prescriptions, and securely manage your medical records all in one place.
              </p>

              {/* Search Bar Box */}
              <form onSubmit={handleSearch} className="bg-white p-2.5 rounded-2xl shadow-md border border-slate-200/90 max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6 flex items-center px-3 gap-2.5 border-b sm:border-b-0 sm:border-r border-slate-100 py-2 sm:py-0">
                    <Search className="h-5 w-5 text-emerald-600 shrink-0" />
                    <input
                      type="text"
                      placeholder="Doctor name, condition, symptom..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-4 flex items-center px-3 gap-2.5 py-2 sm:py-0">
                    <select
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                      className="w-full text-sm text-slate-700 bg-transparent focus:outline-none cursor-pointer"
                    >
                      <option value="">All Specialties</option>
                      {specialties.map((s) => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl text-sm"
                    >
                      Search
                    </Button>
                  </div>
                </div>
              </form>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>100% Verified Practitioners</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span>Instant Slot Confirmation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Encrypted Health Records</span>
                </div>
              </div>
            </div>

            {/* Hero Visual Card — hidden on small screens */}
            <div className="hidden lg:block lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md bg-white rounded-3xl p-6 shadow-xl border border-slate-200/80">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
                      Dr
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Dr. Sarah Smith, MD</h4>
                      <p className="text-xs text-slate-500">Chief of Cardiology</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ● Available Now
                  </span>
                </div>

                <div className="py-4 space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-600">Next Available Slot</span>
                    <span className="font-semibold text-slate-900">Today, 2:30 PM</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-600">Consultation Fee</span>
                    <span className="font-bold text-emerald-700">$75.00</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-600">Patient Satisfaction</span>
                    <div className="flex items-center gap-1 font-semibold text-slate-900">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      4.9 (142 reviews)
                    </div>
                  </div>
                </div>

                <Link to="/doctors">
                  <Button
                    variant="primary"
                    fullWidth
                    size="md"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl text-sm"
                  >
                    Book Consultation
                  </Button>
                </Link>

                {/* Floating pill badge */}
                <div className="absolute -bottom-4 -left-4 bg-white border border-slate-200 shadow-md rounded-2xl py-2 px-3.5 flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-800">Digital Prescription</p>
                    <p className="text-[9px] text-slate-400">Instant PDF download</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── STATS COUNTER ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 sm:p-8 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <div className="text-center py-2">
            <p className="text-2xl sm:text-4xl font-extrabold text-slate-900">500+</p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Verified Doctors</p>
          </div>
          <div className="text-center py-2">
            <p className="text-2xl sm:text-4xl font-extrabold text-emerald-600">50,000+</p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Consultations Done</p>
          </div>
          <div className="text-center py-2">
            <p className="text-2xl sm:text-4xl font-extrabold text-slate-900">98.4%</p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Satisfaction Rate</p>
          </div>
          <div className="text-center py-2">
            <p className="text-2xl sm:text-4xl font-extrabold text-emerald-600">24/7</p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Doctor Availability</p>
          </div>
        </div>
      </section>

      {/* ─── SPECIALTIES GRID ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              Specialized Care
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Consult Top Specialists Across All Domains
            </p>
          </div>
          <Link
            to="/doctors"
            className="mt-3 sm:mt-0 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Browse all doctors <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {specialties.map((item) => (
            <div
              key={item.name}
              onClick={() => navigate(`/doctors?specialty=${encodeURIComponent(item.name)}`)}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  {item.doctors}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                {item.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              Simple 3-Step Process
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              How CareConnect Works
            </p>
            <p className="text-sm text-slate-600 mt-2">
              Book consultations from anywhere in less than 2 minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs relative">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg mb-5">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Find Your Doctor</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Filter verified specialists by specialty, consultation fees, experience, and authentic patient ratings.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs relative">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg mb-5">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Select Time & Book</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Choose an available slot according to your schedule. Receive instant confirmation and reminder notifications.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-xs relative">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg mb-5">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Consult & Get Rx</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Connect via secure real-time messaging or in-clinic visit, and immediately download official digital prescriptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURED DOCTORS ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
          <div>
            <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
              Top Rated Doctors
            </h2>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Book Today with Verified Specialists
            </p>
          </div>
          <Link
            to="/doctors"
            className="mt-3 sm:mt-0 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            View all 500+ doctors <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all"
            >
              <div className="p-5">
                <div className="flex items-center gap-3.5 mb-4">
                  <img
                    src={doc.image}
                    alt={doc.name}
                    className="h-14 w-14 rounded-full object-cover border-2 border-emerald-500/20"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight">
                      {doc.name}
                    </h4>
                    <p className="text-xs font-medium text-emerald-700 mt-0.5">
                      {doc.specialty}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {doc.experience} • {doc.hospital}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between py-2.5 px-3 bg-slate-50 rounded-xl mb-4 text-xs">
                  <div className="flex items-center gap-1 font-semibold text-slate-800">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{doc.rating}</span>
                    <span className="text-slate-400 font-normal">({doc.reviews})</span>
                  </div>
                  <div className="font-bold text-emerald-700">
                    {doc.fee} <span className="text-slate-400 font-normal text-[10px]">/ visit</span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link to="/doctors">
                  <Button
                    variant="primary"
                    fullWidth
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs py-2 font-medium"
                  >
                    Book Appointment
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CALL TO ACTION BANNER ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-12 text-white relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <ShieldCheck className="h-4 w-4" /> HIPAA-Compliant & Safe
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to take control of your health?
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Create your patient account now for fast appointments, or register as a certified doctor to provide seamless virtual and in-person care.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
            <Link to="/register" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-6 py-3 rounded-xl text-sm"
              >
                Register as Patient
              </Button>
            </Link>
            <Link to="/register" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                fullWidth
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 font-medium px-6 py-3 rounded-xl text-sm"
              >
                Join as Doctor
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
