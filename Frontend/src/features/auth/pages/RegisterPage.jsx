import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, User, Stethoscope, Mail, Lock, Phone, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../Auth.context';
import Button from '../../../components/ui/Button';

export const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('PATIENT');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    // Doctor specific fields
    specialization: 'General Medicine',
    licenseNumber: '',
    consultationFee: '',
    experienceYears: '',
    hospitalAffiliation: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  const handleChange = (e) => {
    if (error) setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const cleanPhone = formData.phone && formData.phone.trim() ? formData.phone.trim() : undefined;
      const payload = {
        fullName: formData.name.trim(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.password,
        phone: cleanPhone,
        role: role.toLowerCase(),
      };

      if (role === 'DOCTOR') {
        payload.specialization = formData.specialization || 'General Medicine';
        payload.qualification = 'MBBS / Medical Degree';
        payload.licenseNumber = formData.licenseNumber || `MD-${Math.floor(100000 + Math.random() * 900000)}`;
        payload.consultationFee = Number(formData.consultationFee) || 500;
        payload.experienceYears = Number(formData.experienceYears) || 3;
        payload.hospitalAffiliation = formData.hospitalAffiliation;
      }

      const result = await registerUser(payload);

      if (result.success) {
        // Registration successful — backend requires email verification before login
        // Redirect to verify-email page with email pre-filled
        setSuccess('Account created! Please check your email to verify your account.');
        setTimeout(() => {
          navigate(`/verify-email?email=${encodeURIComponent(formData.email.trim())}`, {
            replace: true,
            state: { requiresEmailVerification: true, email: formData.email.trim() },
          });
        }, 1000);
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="w-full mx-auto sm:max-w-xl">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Heart className="h-6 w-6 fill-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Medi<span className="text-emerald-600">Q</span>
            </span>
          </Link>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Create your MediQ account
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Join thousands of patients and practitioners on our verified platform
          </p>
        </div>

        <div className="mt-6 sm:mt-8 bg-white py-6 sm:py-8 px-4 sm:px-10 shadow-sm border border-slate-200/90 rounded-2xl">
          
          {/* Role selector tabs */}
          <div className="grid grid-cols-2 gap-3 mb-6 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setRole('PATIENT')}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                role === 'PATIENT'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="h-4 w-4 text-emerald-600" />
              I'm a Patient
            </button>
            <button
              type="button"
              onClick={() => setRole('DOCTOR')}
              className={`flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                role === 'DOCTOR'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="h-4 w-4 text-emerald-600" />
              I'm a Doctor
            </button>
          </div>

          {error && (
            <div className="mb-5 rounded-lg bg-rose-50 border border-rose-200 p-3.5 flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 flex items-start gap-2.5 text-xs text-emerald-700">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder={role === 'DOCTOR' ? 'Dr. Sarah Smith' : 'John Doe'}
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@domain.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    placeholder="Min. 8 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 pr-10 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-emerald-600 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>

            {/* Doctor-specific fields */}
            {role === 'DOCTOR' && (
              <div className="pt-2 border-t border-slate-100 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Practitioner Credentials
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Specialization
                    </label>
                    <select
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-colors"
                    >
                      {specializations.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Medical License #
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      placeholder="e.g. MED-847291"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Consultation Fee (₹ INR)
                    </label>
                    <input
                      type="number"
                      name="consultationFee"
                      min="0"
                      placeholder="500"
                      value={formData.consultationFee}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Experience (Years)
                    </label>
                    <input
                      type="number"
                      name="experienceYears"
                      min="0"
                      value={formData.experienceYears}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Hospital / Clinic
                    </label>
                    <input
                      type="text"
                      name="hospitalAffiliation"
                      placeholder="City General Hospital"
                      value={formData.hospitalAffiliation}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="lg"
                isLoading={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg shadow-xs"
              >
                {role === 'DOCTOR' ? 'Register as Doctor' : 'Create Patient Account'}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
