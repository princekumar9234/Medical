import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Building, Award, Save, CheckCircle2, Loader2, ArrowLeft, Camera, Upload } from 'lucide-react';
import { useAuth } from '../../auth/Auth.context';
import { doctorService } from '../services/doctor.service';
import Button from '../../../components/ui/Button';
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

export const DoctorProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(user?.profilePhoto || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: 'General Medicine',
    hospitalAffiliation: '',
    consultationFee: '500',
    experienceYears: '0',
    licenseNumber: '',
    about: '',
    education: '',
  });

  const specializations = [
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

  // Fetch real profile from backend
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await doctorService.getMyProfile();
        const u = res.data?.data?.user;
        const p = res.data?.data?.profile;

        if (u?.profilePhoto) {
          setPhotoUrl(u.profilePhoto);
        } else if (user?.profilePhoto) {
          setPhotoUrl(user.profilePhoto);
        }

        setFormData({
          name: u?.fullName || user?.fullName || user?.name || '',
          email: u?.email || user?.email || '',
          phone: u?.phone || user?.phone || '',
          specialization: p?.specialization || 'General Medicine',
          hospitalAffiliation: p?.city || '',
          consultationFee: p?.consultationFee !== undefined ? String(p.consultationFee) : '500',
          experienceYears: p?.yearsOfExperience !== undefined ? String(p.yearsOfExperience) : '0',
          licenseNumber: p?.registrationNumber || '',
          about: p?.about || '',
          education: Array.isArray(p?.education) && p.education.length > 0
            ? p.education.map((e) => `${e.degree || ''} (${e.institution || ''})`).join(', ')
            : (p?.qualifications || ''),
        });
      } catch (err) {
        setFormData({
          name: user?.fullName || user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          specialization: 'General Medicine',
          hospitalAffiliation: '',
          consultationFee: '500',
          experienceYears: '0',
          licenseNumber: '',
          about: '',
          education: '',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await doctorService.updateMyProfile({
        fullName: formData.name,
        phone: formData.phone,
        specialization: formData.specialization,
        city: formData.hospitalAffiliation,
        consultationFee: Number(formData.consultationFee) || 500,
        yearsOfExperience: Number(formData.experienceYears) || 0,
        registrationNumber: formData.licenseNumber,
        about: formData.about,
        qualifications: formData.education,
      });
      setSuccess(true);
      toast.success('Practitioner profile saved successfully!');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save practitioner profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('photo', file);

    setUploadingPhoto(true);
    try {
      const res = await doctorService.uploadPhoto(uploadData);
      const newPhoto = res.data?.data?.profilePhoto;
      setPhotoUrl(newPhoto);
      if (updateUser) {
        updateUser({ profilePhoto: newPhoto });
      }
      toast.success('Doctor profile photo updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage={false} text="Loading practitioner profile..." />;
  }

  const initial = formData.name?.charAt(0)?.toUpperCase() || 'D';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          
          {/* Profile Photo / Initials & Upload button */}
          <div className="relative group">
            {photoUrl ? (
              <img
                src={getProfileImageUrl(photoUrl)}
                alt={formData.name}
                className="h-20 w-20 rounded-2xl object-cover border-2 border-emerald-500/30 shadow-xs"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextElementSibling) {
                    e.currentTarget.nextElementSibling.style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div
              className={`h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 border border-emerald-200 text-emerald-800 font-bold text-2xl flex flex-col items-center justify-center shadow-xs ${
                photoUrl ? 'hidden' : 'flex'
              }`}
            >
              <Stethoscope className="h-5 w-5 text-emerald-600 mb-0.5 opacity-80" />
              <span>{initial}</span>
            </div>

            <label
              htmlFor="doctor-photo-upload"
              className="absolute -bottom-2 -right-2 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl cursor-pointer shadow-md transition-all hover:scale-105 flex items-center justify-center"
              title="Upload / Update Profile Photo"
            >
              {uploadingPhoto ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
              <input
                id="doctor-photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Dr. {formData.name || 'Practitioner'}</h1>
              {photoUrl ? (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Photo Uploaded
                </span>
              ) : (
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  No Photo Uploaded
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-700 font-semibold mt-0.5">{formData.specialization} • Licensed Practitioner</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Click the camera icon to upload your profile photo anytime.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/doctor/dashboard')}
          className="text-xs flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          Practitioner profile and credentials saved successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Credentials & Details */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Professional Profile &amp; Practice Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Legal Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Dr. Full Name"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Specialization
              </label>
              <select
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
              >
                {specializations.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Contact Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Hospital / Clinic City / Affiliation
              </label>
              <input
                type="text"
                name="hospitalAffiliation"
                value={formData.hospitalAffiliation}
                onChange={handleChange}
                placeholder="City or Hospital Name"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Medical License / Registration #
              </label>
              <input
                type="text"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleChange}
                placeholder="e.g. MD-NY-12345"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Consultation Fee (₹ INR)
              </label>
              <input
                type="number"
                name="consultationFee"
                value={formData.consultationFee}
                onChange={handleChange}
                placeholder="500"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Years of Clinical Practice
              </label>
              <input
                type="number"
                name="experienceYears"
                value={formData.experienceYears}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Education &amp; Board Certifications
              </label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleChange}
                placeholder="Degree, medical school, fellowship"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Biography / Clinical Philosophy
              </label>
              <textarea
                rows={4}
                name="about"
                value={formData.about}
                onChange={handleChange}
                placeholder="Describe your clinical background, areas of expertise, and care philosophy..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-6 rounded-xl text-sm flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Profile
          </Button>
        </div>
      </form>

    </div>
  );
};

export default DoctorProfilePage;
