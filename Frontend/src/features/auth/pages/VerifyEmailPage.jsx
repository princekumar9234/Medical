import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, XCircle, Mail, Loader2, ArrowRight, RefreshCw, Heart, AlertCircle, KeyRound } from 'lucide-react';
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

  // OTP state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const otpRefs = useRef([]);

  // Guard to ensure verification is executed only once, even in React 18 StrictMode
  const verificationAttempted = useRef(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (verificationAttempted.current) return;
    verificationAttempted.current = true;

    const runVerification = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await authService.verifyEmail(token, emailFromUrl);
        setSuccess(true);
        setError('');
        toast.success(res.data?.message || 'Email verified successfully!');
        if (updateUser) {
          updateUser({ isEmailVerified: true });
        }
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          'Verification link is invalid or has expired. Please request a new one.';
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    runVerification();
  }, [token, emailFromUrl, updateUser]);

  const handleOtpChange = (index, value) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);
    // Focus last filled or last box
    const lastFilled = Math.min(pasted.length, 5);
    otpRefs.current[lastFilled]?.focus();
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length < 6) {
      toast.error('Please enter all 6 digits of the verification code.');
      return;
    }
    if (!resendEmail) {
      toast.error('Please enter your email address below.');
      return;
    }

    setOtpVerifying(true);
    setError('');
    try {
      const res = await authService.verifyEmailOtp(otp, resendEmail);
      setSuccess(true);
      toast.success(res.data?.message || 'Email verified successfully!');
      if (updateUser) updateUser({ isEmailVerified: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired code. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail) {
      toast.error('Please enter your registered email address.');
      return;
    }

    setResending(true);
    setResendSuccess(false);
    setOtpDigits(['', '', '', '', '', '']);
    try {
      await authService.resendVerification(resendEmail);
      setResendSuccess(true);
      toast.success('Verification code sent! Please check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send verification code.');
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
              Medi<span className="text-emerald-600">Q</span>
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
                Your email address has been confirmed. You now have full access to MediQ.
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

          {/* Case 3: Waiting for verification (no token yet, or error) */}
          {!loading && !success && (
            <div className="space-y-5">
              <div className={`h-16 w-16 mx-auto rounded-2xl flex items-center justify-center ${error ? 'bg-rose-50 border border-rose-200' : 'bg-emerald-50 border border-emerald-100'}`}>
                {error ? <XCircle className="h-9 w-9 text-rose-500" /> : <Mail className="h-8 w-8 text-emerald-600" />}
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {error ? 'Verification Failed' : 'Verify Your Email'}
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  {error
                    ? error
                    : 'Check your inbox for the 6-digit code or click the verification link we sent.'}
                </p>
              </div>

              {/* Redirect banner from login */}
              {redirectedDueToVerification && !resendSuccess && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5 text-left">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Email not verified.</strong> A new 6-digit code has been sent to <strong>{resendEmail}</strong>. Check your inbox (and spam folder).
                  </p>
                </div>
              )}

              {/* ── OTP Entry ── */}
              <form onSubmit={handleOtpVerify} className="space-y-4 text-left">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-emerald-600" /> Enter 6-Digit Code
                </label>

                {/* 6-digit OTP boxes */}
                <div className="flex items-center justify-between gap-1.5" onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-full aspect-square text-center text-lg font-bold text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-600/20 focus:bg-white outline-none transition"
                      autoComplete="off"
                    />
                  ))}
                </div>

                {/* Email field for OTP verification */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Your Email</label>
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
                </div>

                <Button
                  type="submit"
                  fullWidth
                  disabled={otpVerifying || otpDigits.join('').length < 6}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  {otpVerifying ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Verifying...</>
                  ) : (
                    <><CheckCircle2 className="h-3.5 w-3.5" /> Verify Code</>
                  )}
                </Button>
              </form>

              {/* ── Divider ── */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Or resend</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* Resend Button */}
              <div className="space-y-2">
                {resendSuccess && (
                  <p className="text-xs text-emerald-600 font-medium text-center">
                    ✓ New verification code sent to your email!
                  </p>
                )}
                <Button
                  type="button"
                  onClick={handleResend}
                  fullWidth
                  disabled={resending}
                  className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 shadow-none"
                >
                  {resending ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending...</>
                  ) : (
                    <><RefreshCw className="h-3.5 w-3.5 text-emerald-600" /> Send New Code</>
                  )}
                </Button>
              </div>

              <div className="pt-1 text-center">
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
