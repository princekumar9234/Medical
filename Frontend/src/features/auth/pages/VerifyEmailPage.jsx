import { useState, useEffect } from 'react';
import { Link, useSearchParams, useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, XCircle, Mail, Loader2, ArrowRight, RefreshCw, Heart, AlertCircle } from 'lucide-react';
import { authService } from '../services/auth.service';
import { useAuth } from '../Auth.context';
import Button from '../../../components/ui/Button';
import toast from 'react-hot-toast';

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const { token: paramToken } = useParams();
  const token = searchParams.get('token') || paramToken;
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useAuth();

  // Email can come from: URL param ?email=..., navigation state, or logged-in user
  const emailFromUrl = searchParams.get('email') || '';
  const emailFromState = location.state?.email || '';
  const redirectedDueToVerification = location.state?.requiresEmailVerification || false;

  const [loading, setLoading] = useState(Boolean(token));
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [resendEmail, setResendEmail] = useState(emailFromUrl || emailFromState || user?.email || '');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const runVerification = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await authService.verifyEmail(token);
        if (isMounted) {
          setSuccess(true);
          toast.success(res.data?.message || 'Email verified successfully!');
          if (updateUser) {
            updateUser({ isEmailVerified: true });
          }
        }
      } catch (err) {
        if (isMounted) {
          const msg =
            err.response?.data?.message ||
            'Verification link is invalid or has expired. Please request a new one.';
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    runVerification();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) {
      toast.error('Please enter your registered email address.');
      return;
    }

    setResending(true);
    setResendSuccess(false);
    try {
      await authService.resendVerification(resendEmail);
      setResendSuccess(true);
      toast.success('Verification link sent! Please check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send verification link.');
    } finally {
      setResending(false);
    }
  };

  const handleContinue = () => {
    if (user) {
      const role = (user.role || '').toLowerCase();
      navigate(role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="w-full mx-auto sm:max-w-md">
        
        {/* Brand */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-11 w-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Heart className="h-6 w-6 fill-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Care<span className="text-emerald-600">Connect</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200/90 rounded-3xl text-center">
          
          {/* Case 1: Verifying in progress */}
          {loading && (
            <div className="py-6 space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Verifying Your Email...</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Please wait while we confirm your email address and update your credentials.
              </p>
            </div>
          )}

          {/* Case 2: Verification Successful */}
          {!loading && success && (
            <div className="py-4 space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Email Verified Successfully!</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Your email address has been confirmed. You now have full access to doctor bookings, appointments, and care services.
              </p>
              <div className="pt-2">
                <Button
                  onClick={handleContinue}
                  fullWidth
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2"
                >
                  {user ? 'Continue to Dashboard' : 'Proceed to Login'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Case 3: Error or Invalid Link */}
          {!loading && !success && (
            <div className="space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                {error ? <XCircle className="h-9 w-9 text-rose-600" /> : <Mail className="h-8 w-8 text-emerald-600" />}
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                {error ? 'Verification Failed' : 'Verify Your Email Address'}
              </h2>

              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                {error
                  ? error
                  : 'Please check your inbox and click the verification link sent by MediQ.'}
              </p>

              {/* Banner: redirected from login because email not verified */}
              {redirectedDueToVerification && !resendSuccess && (
                <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Email not verified.</strong> Your account is registered but your email address hasn't been verified yet. A new verification link has been sent to <strong>{resendEmail}</strong>. Please check your inbox (and spam folder).
                  </p>
                </div>
              )}

              {/* Resend Verification Form */}
              <form onSubmit={handleResend} className="pt-4 text-left space-y-3 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Resend Verification Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
                  />
                </div>

                {resendSuccess && (
                  <p className="text-xs text-emerald-600 font-medium">
                    ✓ New verification link has been sent to your email!
                  </p>
                )}

                <Button
                  type="submit"
                  fullWidth
                  disabled={resending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5"
                >
                  {resending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" /> Send Verification Link
                    </>
                  )}
                </Button>
              </form>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
