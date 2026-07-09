import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const otpInputRef = useRef(null);
  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      toast.error('Please start the password reset process again.');
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown <= 0) return undefined;

    const timer = window.setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [countdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      toast.error('Enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/verify-otp', { email, otp });
      if (res.data.success) {
        toast.success('OTP verified successfully');
        navigate('/reset-password', { state: { email, otp } });
      } else {
        toast.error(res.data.message || 'Invalid OTP');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resending || countdown > 0) return;

    setResending(true);
    try {
      const res = await api.post('/api/auth/resend-otp', { email });
      if (res.data.success) {
        setOtp('');
        setCountdown(30);
        otpInputRef.current?.focus();
        toast.success(res.data.message || 'A new OTP has been sent to your email.');
      } else {
        toast.error(res.data.message || 'Unable to resend OTP');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.3),_transparent_30%),linear-gradient(135deg,_#0f172a_0%,_#111827_100%)] px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-400 text-2xl font-bold">BD</div>
          <h1 className="text-2xl font-semibold">Verify OTP</h1>
          <p className="mt-2 text-sm text-slate-400">Enter the 6-digit code sent to {email || 'your email'}.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input ref={otpInputRef} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none" type="text" inputMode="numeric" maxLength="6" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
          <button disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-4 py-3 font-semibold transition hover:opacity-90 disabled:opacity-70">{loading ? 'Verifying...' : 'Verify OTP'}</button>
        </form>
        <div className="mt-4 flex flex-col items-center gap-2 text-sm text-slate-400">
          <p>Didn't receive the OTP?</p>
          <button type="button" onClick={handleResendOtp} disabled={resending || countdown > 0} className="font-semibold text-red-400 transition hover:text-red-300 disabled:cursor-not-allowed disabled:text-slate-500">
            {resending ? 'Sending...' : countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
          </button>
        </div>
        <div className="mt-4 text-center text-sm text-slate-400">
          <Link to="/forgot-password" className="hover:text-white">Back</Link>
        </div>
      </motion.div>
    </div>
  );
}
