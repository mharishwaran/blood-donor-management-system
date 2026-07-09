import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import api from '../api/axios';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      toast.error('Please verify your OTP before resetting password.');
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.password || form.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/auth/reset-password', {
        email,
        otp: location.state?.otp || '',
        password: form.password,
        confirmPassword: form.confirmPassword
      });
      if (res.data.success) {
        toast.success('Password reset successfully');
        navigate('/login');
      } else {
        toast.error(res.data.message || 'Unable to reset password');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.3),_transparent_30%),linear-gradient(135deg,_#0f172a_0%,_#111827_100%)] px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-400 text-2xl font-bold">BD</div>
          <h1 className="text-2xl font-semibold">Reset Password</h1>
          <p className="mt-2 text-sm text-slate-400">Create a strong new password for your account.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 pr-12 outline-none" type={showPassword ? 'text' : 'password'} placeholder="New password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          <div className="relative">
            <input className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 pr-12 outline-none" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
            <button type="button" onClick={() => setShowConfirmPassword((prev) => !prev)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition hover:text-white" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
              {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          <button disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-4 py-3 font-semibold transition hover:opacity-90 disabled:opacity-70">{loading ? 'Resetting...' : 'Reset Password'}</button>
        </form>
        <div className="mt-4 text-center text-sm text-slate-400">
          <Link to="/login" className="hover:text-white">Back to login</Link>
        </div>
      </motion.div>
    </div>
  );
}
