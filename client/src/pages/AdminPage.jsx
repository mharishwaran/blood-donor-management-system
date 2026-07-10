import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi, { ADMIN_TOKEN_KEY } from '../api/adminAxios.js';
import api from '../api/axios.js';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await adminApi.get('/api/admin/dashboard');
        setDashboard(res.data?.data || null);
        setAuthorized(true);
        navigate('/admin/dashboard', { replace: true });
      } catch (err) {
        const message = err.customMessage || err?.response?.data?.message || 'Admin access required.';
        if (message.includes('Authentication') || message.includes('Admin access') || message.includes('Please log in')) {
          setAuthorized(false);
        } else {
          setAuthorized(false);
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleAuthorize = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const res = await api.post('/api/admin/authorize', { password });
      if (res.data?.success) {
        const token = res.data?.data?.token || '';
        if (token) {
          localStorage.setItem(ADMIN_TOKEN_KEY, token);
          window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
        }
        setAuthorized(true);
        setPassword('');
        const dashboardRes = await adminApi.get('/api/admin/dashboard');
        setDashboard(dashboardRes.data?.data || null);
        toast.success('Admin access granted');
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      const message = err.customMessage || err?.response?.data?.message || 'Unable to authorize admin access.';
      setError(message);
      toast.error(message);
    }
  };

  const stats = useMemo(() => [
    { label: 'Total users', value: dashboard?.totalUsers ?? 0 },
    { label: 'Total donors', value: dashboard?.totalDonors ?? 0 },
    { label: 'Pending requests', value: dashboard?.pendingRequests ?? 0 }
  ], [dashboard]);

  if (loading) {
    return <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-slate-300">Checking admin access...</div>;
  }

  if (!authorized) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
        <h1 className="text-2xl font-semibold">Admin access</h1>
        <p className="mt-2 text-sm text-slate-400">Enter the admin password to continue to the dashboard.</p>
        <form onSubmit={handleAuthorize} className="mt-6 max-w-md space-y-4">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Admin password"
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white outline-none ring-0"
          />
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button type="submit" className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500">
            Continue
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <p className="mt-2 text-sm text-slate-400">Overview of donor activity, emergency requests, and system alerts.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent emergency requests</h2>
          <button onClick={() => navigate('/profile')} className="text-sm text-red-300 hover:text-red-200">View profile</button>
        </div>
        <div className="space-y-3">
          {(dashboard?.recentRequests || []).length > 0 ? (
            (dashboard?.recentRequests || []).map((request) => (
              <div key={request._id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/70 p-4">
                <div>
                  <p className="font-medium">{request.hospital}</p>
                  <p className="text-sm text-slate-400">{request.patient} • {request.location}</p>
                </div>
                <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-300">{request.status}</span>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-800/50 p-4 text-sm text-slate-400">No recent emergency requests.</div>
          )}
        </div>
      </div>
    </div>
  );
}
