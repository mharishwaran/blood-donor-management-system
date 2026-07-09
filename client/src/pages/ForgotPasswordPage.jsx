import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/axios';
import axios from "axios";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
  e.preventDefault();

  const trimmedEmail = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    toast.error("Please enter a valid email address");
    return;
  }

  setLoading(true);

  try {
    console.log("🚀 Before API call");

  const res = await axios.post(
  "https://blood-donor-management-system-zhdz.onrender.com/api/auth/forgot-password",
  {
    email: trimmedEmail,
  },
  {
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
    },
  }
);

console.log(res.data);

    console.log("✅ After API call");
    console.log(res);

    if (res.data.success) {
      toast.success(res.data.message || "OTP sent to your email");
      navigate("/verify-otp", {
        state: { email: trimmedEmail },
      });
    } else {
      toast.error(res.data.message || "Unable to send OTP");
    }
  } catch (error) {
    console.log("========== AXIOS ERROR ==========");
    console.log("FULL ERROR:", error);
    console.log("CODE:", error.code);
    console.log("MESSAGE:", error.message);
    console.log("RESPONSE:", error.response);
    console.log("REQUEST:", error.request);
    console.log("=================================");

    toast.error(
      error.customMessage ||
      error.response?.data?.message ||
      error.message ||
      "Unable to send OTP"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.3),_transparent_30%),linear-gradient(135deg,_#0f172a_0%,_#111827_100%)] px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-400 text-2xl font-bold">BD</div>
          <h1 className="text-2xl font-semibold">Forgot password?</h1>
          <p className="mt-2 text-sm text-slate-400">Enter your registered email to receive a one-time password.</p>
        </div>
        <form onSubmit={handleSendOtp} className="space-y-4">
          <input className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 outline-none" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-4 py-3 font-semibold transition hover:opacity-90 disabled:opacity-70">{loading ? 'Sending OTP...' : 'Send OTP'}</button>
        </form>
        <div className="mt-4 text-center text-sm text-slate-400">
          <Link to="/login" className="hover:text-white">Back to login</Link>
        </div>
      </motion.div>
    </div>
  );
}
