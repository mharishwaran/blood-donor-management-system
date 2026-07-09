import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || '';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const submitRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    if (error) {
      toast.error('Google authentication failed. Please try again.');
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitRef.current) return;
    if (!form.email || !form.password) {
      toast.error('Please enter both email and password');
      return;
    }

    submitRef.current = true;
    setLoading(true);
    try {
      const res = await login(form.email, form.password);
      if (!res.success) {
        toast.error(res.message || 'Invalid email or password');
        return;
      }
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.customMessage || error?.response?.data?.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
      submitRef.current = false;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.3),_transparent_30%),linear-gradient(135deg,_#0f172a_0%,_#111827_100%)] px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-400 text-2xl font-bold">BD</div>
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to manage college blood donor requests.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none ring-0" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div className="relative">
            <input className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 pr-12 outline-none ring-0" type={showPassword ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 transition hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
          <button disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-4 py-3 font-semibold transition hover:opacity-90 disabled:opacity-70">{loading ? 'Signing in...' : 'Login'}</button>
        </form>
        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-700" />
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">or</span>
          <div className="h-px flex-1 bg-slate-700" />
        </div>
        <a href={BACKEND_URL ? `${BACKEND_URL}/api/auth/google` : '/api/auth/google'} className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-white px-4 py-3 font-medium text-slate-800 transition hover:bg-slate-100">
          <FcGoogle size={20} />
          Continue with Google
        </a>
        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <Link to="/forgot-password" className="hover:text-white">Forgot password?</Link>
          <Link to="/register" className="hover:text-white">Create account</Link>
        </div>
      </motion.div>
    </div>
  );
}
