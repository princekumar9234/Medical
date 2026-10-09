import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams, useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, XCircle, Mail, Loader2, ArrowRight, RefreshCw, Heart, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { authService } from '../services/auth.service';
import { useAuth } from '../Auth.context';
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
  const [countdown, setCountdown] = useState(0);

  // OTP state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const otpRefs = useRef([]);

  // Guard to ensure verification is executed only once, even in React 18 StrictMode
  const verificationAttempted = useRef(false);

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

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
    // Focus last filled box
    const lastFilled = Math.min(pasted.length, 5);
    otpRefs.current[lastFilled]?.focus();
  };

  const handleOtpVerify = async (e) => {
    if (e) e.preventDefault();
    const otp = otpDigits.join('');
    if (otp.length < 6) {
      toast.error('Please enter all 6 digits of the verification code.');
      return;
    }
    if (!resendEmail || !resendEmail.trim()) {
      toast.error('Please enter your registered email address.');
      return;
    }

    setOtpVerifying(true);
    setError('');
    try {
      const res = await authService.verifyEmailOtp(otp, resendEmail.trim());
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
    if (e) e.preventDefault();
    if (countdown > 0) return;
    if (!resendEmail || !resendEmail.trim()) {
      toast.error('Please enter your registered email address.');
      return;
    }

    setResending(true);
    setResendSuccess(false);
    setOtpDigits(['', '', '', '', '', '']);
    try {
      await authService.resendVerification(resendEmail.trim());
      setResendSuccess(true);
      setCountdown(60); // 60s cooldown
      toast.success('New verification code sent! Please check your inbox.');
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
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 to-slate-100/60">
      <div className="w-full mx-auto sm:max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="h-11 w-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition duration-200">
              <Heart className="h-6 w-6 fill-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Medi<span className="text-emerald-600">Q</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 border border-slate-200/80 rounded-3xl text-center">
          
          {/* Case 1: Verifying link in progress */}
          {loading && (
            <div className="py-6 space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Verifying Your Email...</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Please wait while we confirm your email address and activate your account.
              </p>
            </div>
          )}

          {/* Case 2: Verification Successful */}
          {!loading && success && (
            <div className="py-4 space-y-5">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="h-9 w-9 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Email Verified Successfully!</h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Your email address has been confirmed. You now have full access to your MediQ account.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleContinue}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition duration-150"
                >
                  <span>{user ? 'Continue to Dashboard' : 'Proceed to Sign In'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Case 3: Waiting for verification (OTP entry / Resend) */}
          {!loading && !success && (
            <div className="space-y-5">
              <div className={`h-16 w-16 mx-auto rounded-2xl flex items-center justify-center transition-colors duration-200 ${error ? 'bg-rose-50 border border-rose-200 text-rose-500' : 'bg-emerald-50 border border-emerald-100 text-emerald-600'}`}>
                {error ? <XCircle className="h-8 w-8" /> : <Mail className="h-8 w-8" />}
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {error ? 'Verification Issue' : 'Verify Your Email'}
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  {error
                    ? error
                    : 'Enter the 6-digit code sent to your email to verify your account.'}
                </p>
              </div>

              {/* Redirect banner from login */}
              {redirectedDueToVerification && !resendSuccess && (
                <div className="rounded-xl bg-amber-50 border border-amber-200/90 p-3.5 flex items-start gap-2.5 text-left">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <p className="text-xs text-amber-900 leading-relaxed">
                    <strong>Verification Required:</strong> A 6-digit code was sent to <strong>{resendEmail}</strong>. Please check your inbox and spam folder.
                  </p>
                </div>
              )}

              {/* ── OTP Entry Form ── */}
              <form onSubmit={handleOtpVerify} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5 text-emerald-600" /> Enter 6-Digit OTP Code
                  </label>

                  {/* 6-digit OTP input boxes */}
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2" onPaste={handleOtpPaste}>
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
                        className={`w-full aspect-square text-center text-xl font-bold rounded-xl border-2 transition-all duration-150 outline-none ${
                          digit
                            ? 'border-emerald-500 bg-emerald-50/40 text-emerald-900 shadow-sm'
                            : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20'
                        }`}
                        autoComplete="off"
                      />
                    ))}
                  </div>
                </div>

                {/* Email field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="e.g. name@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition"
                    />
                  </div>
                </div>

                {/* Verify Code Button */}
                <button
                  type="submit"
                  disabled={otpVerifying || otpDigits.join('').length < 6}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition duration-150"
                >
                  {otpVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Verify Code</span>
                    </>
                  )}
                </button>
              </form>

              {/* ── Divider ── */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Didn't get code?
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* ── Beautiful Resend Action Box ── */}
              <div className="p-3.5 bg-slate-50/80 border border-slate-200/90 rounded-2xl space-y-2.5 text-left">
                {resendSuccess && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-xl py-2 px-3">
                    <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>New OTP sent to your inbox! Check now.</span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Resend Verification Code</p>
                    <p className="text-[11px] text-slate-500">We'll send a fresh 6-digit OTP to your email.</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending || countdown > 0}
                    className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 border ${
                      countdown > 0
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300 hover:border-emerald-400 shadow-sm active:scale-95'
                    }`}
                  >
                    {resending ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : countdown > 0 ? (
                      <span>Wait {countdown}s</span>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Resend Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Back to Sign In Link */}
              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
                >
                  ← Back to Sign In
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
