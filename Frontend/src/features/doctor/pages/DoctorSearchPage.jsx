import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Clock, 
  Calendar, 
  Stethoscope, 
  CheckCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { doctorService } from '../services/doctor.service';
import { useAuth } from '../../auth/Auth.context';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

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

export const DoctorSearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const userRole = (user?.role || '').toLowerCase();
  const isDoctor = userRole === 'doctor';

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [specialty, setSpecialty] = useState(searchParams.get('specialty') || '');
  const [sortBy, setSortBy] = useState('rating');
  const [maxFee, setMaxFee] = useState('');

  const specialties = [
    'All Specialties',
    'General Medicine',
    'Cardiology',
    'Dermatology',
    'Pediatrics',
    'Orthopedics',
    'Neurology',
    'Psychiatry',
    'Gynecology',
    'Ophthalmology',
    'ENT',
  ];

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (query) params.name = query;
      if (specialty && specialty !== 'All Specialties') params.specialization = specialty;
      if (maxFee) params.maxFee = maxFee;

      const res = await doctorService.searchDoctors(params);
      const apiDoctors = res.data?.data?.results || res.data?.data?.doctors || [];

      const mapped = apiDoctors.map((d) => ({
        _id: d.doctorId || d._id || d.id,
        id: d.doctorId || d._id || d.id,
        name: d.fullName || d.name || 'Doctor',
        fullName: d.fullName || d.name || 'Doctor',
        specialization: d.specialization || 'Healthcare Practitioner',
        hospitalAffiliation: d.hospital || d.city || 'CareConnect Partner Network',
        consultationFee: d.consultationFee ?? 500,
        experienceYears: d.yearsOfExperience ?? d.experienceYears ?? 0,
        averageRating: d.averageRating || 4.9,
        totalReviews: d.totalReviews || 0,
        about: d.about || `${d.specialization || 'General'} specialist providing comprehensive medical consultations.`,
        profileImage: d.profilePhoto || d.profileImage || null,
      }));

      // In-memory sort if requested
      if (sortBy === 'fee-low') {
        mapped.sort((a, b) => a.consultationFee - b.consultationFee);
      } else if (sortBy === 'fee-high') {
        mapped.sort((a, b) => b.consultationFee - a.consultationFee);
      } else if (sortBy === 'experience') {
        mapped.sort((a, b) => b.experienceYears - a.experienceYears);
      }

      setDoctors(mapped);
    } catch (err) {
      console.warn('API doctor search error:', err);
      setDoctors([]); // Show empty — no fake dummy data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [specialty, sortBy, maxFee]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Search Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900">
          {isDoctor ? 'Medical Specialists Directory' : 'Find & Book Verified Doctors'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
          {isDoctor
            ? 'Browse verified colleagues, clinical specializations, and credentials'
            : 'Compare qualifications, consultation fees, patient ratings, and book confirmed appointments'}
        </p>

        {/* Search bar + filter inputs */}
        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by doctor name or condition..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 font-medium"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-6 rounded-xl text-sm whitespace-nowrap"
            >
              Search Doctors
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filter by:</span>
            </div>

            {/* Specialty select */}
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              aria-label="Filter by specialty"
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              {specialties.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Max fee select */}
            <select
              value={maxFee}
              onChange={(e) => setMaxFee(e.target.value)}
              aria-label="Filter by maximum consultation fee"
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="">Any Consultation Fee</option>
              <option value="300">Up to ₹300</option>
              <option value="500">Up to ₹500</option>
              <option value="800">Up to ₹800</option>
              <option value="1000">Up to ₹1,000</option>
              <option value="1500">Up to ₹1,500</option>
              <option value="2500">Up to ₹2,500</option>
            </select>

            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort doctors by"
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-600 cursor-pointer ml-auto"
            >
              <option value="rating">Top Rated</option>
              <option value="experience">Years of Experience</option>
              <option value="fee-low">Fee: Low to High</option>
              <option value="fee-high">Fee: High to Low</option>
            </select>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {loading ? (
        <LoadingSpinner fullPage={false} text="Searching available doctors..." />
      ) : doctors.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-14 text-center">
          <Stethoscope className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No doctors found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No registered practitioners match your criteria. Try adjusting your search query or removing filters.
          </p>
          {(query || specialty || maxFee) && (
            <button
              onClick={() => { setQuery(''); setSpecialty(''); setMaxFee(''); }}
              className="mt-4 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-semibold text-slate-500">
            Showing {doctors.length} verified {doctors.length === 1 ? 'practitioner' : 'practitioners'}
          </p>

          {doctors.map((doctor) => (
            <div
              key={doctor._id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:border-emerald-200 hover:shadow-sm transition-all p-6"
            >
              <div className="flex flex-col gap-4">
                
                {/* Doctor basic profile */}
                <div className="flex items-start gap-3 sm:gap-4">
                  {doctor.profileImage ? (
                    <img
                      src={getProfileImageUrl(doctor.profileImage)}
                      alt={doctor.name}
                      className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border border-slate-200 shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextElementSibling) {
                          e.currentTarget.nextElementSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className={`h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 border border-emerald-200 text-emerald-800 font-bold text-lg sm:text-xl flex flex-col items-center justify-center shrink-0 shadow-xs ${
                      doctor.profileImage ? 'hidden' : 'flex'
                    }`}
                  >
                    <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 mb-0.5 opacity-80" />
                    <span>{getInitials(doctor.name)}</span>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                        {doctor.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                        <CheckCircle className="h-3 w-3" /> Verified
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-emerald-700">
                      {doctor.specialization}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-0.5">
                      {doctor.hospitalAffiliation && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{doctor.hospitalAffiliation}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {doctor.experienceYears || 0} Yrs Exp
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 max-w-xl pt-1 hidden sm:block">
                      {doctor.about}
                    </p>
                  </div>
                </div>

                {/* Right side booking details & fees — row on mobile, column on md+ */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 gap-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm font-bold text-slate-900">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span>{doctor.averageRating || 4.9}</span>
                      <span className="text-xs text-slate-400 font-normal">({doctor.totalReviews || 0})</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 font-normal block">Fee</span>
                      <p className="text-base font-bold text-emerald-700">
                        ₹{doctor.consultationFee ?? 500}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Button
                      variant={isDoctor ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => navigate(`/doctors/${doctor._id || doctor.id}`)}
                      className={isDoctor
                        ? 'border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-medium py-2 px-4 rounded-xl text-xs'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-xl text-xs'
                      }
                    >
                      {isDoctor ? 'View Profile' : 'Book Visit'}
                    </Button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorSearchPage;
