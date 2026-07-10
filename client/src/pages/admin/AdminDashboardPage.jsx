import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, HeartHandshake, ClipboardList, AlertTriangle, ShieldCheck } from 'lucide-react';
import adminApi from '../../api/adminAxios.js';

const statCards = [
  { key: 'totalUsers', label: 'Total Users', icon: Users, accent: 'from-red-500 to-orange-400' },
  { key: 'totalDonors', label: 'Total Donors', icon: HeartHandshake, accent: 'from-sky-500 to-indigo-500' },
  { key: 'totalBloodRequests', label: 'Total Blood Requests', icon: ClipboardList, accent: 'from-emerald-500 to-lime-500' },
  { key: 'totalEmergencyRequests', label: 'Total Emergency Requests', icon: AlertTriangle, accent: 'from-fuchsia-500 to-violet-500' }
];

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await adminApi.get('/api/admin/dashboard');
        setDashboard(res.data?.data || null);
      } catch {
        setDashboard(null);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const chartBars = useMemo(() => {
    if (!dashboard?.registrationSeries?.length) return [];
    const max = Math.max(...dashboard.registrationSeries.map((item) => item.count));
    return dashboard.registrationSeries.map((item) => ({ ...item, height: max ? Math.max(12, (item.count / max) * 100) : 12 }));
  }, [dashboard]);

  if (loading) {
    return <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-slate-300">Loading admin dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
        <p className="text-sm text-red-300">Administrative control center</p>
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <p className="mt-2 text-sm text-slate-400">Live MongoDB data from the blood donor system.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div key={item.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent}`}>
                <Icon className="text-white" size={20} />
              </div>
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{dashboard?.[item.key] ?? 0}</p>
            </motion.div>
          );
        })}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Registration trend</h2>
            <span className="text-sm text-slate-400">Last 12 months</span>
          </div>
          <div className="flex h-48 items-end gap-3">
            {chartBars.length > 0 ? chartBars.map((item) => (
              <div key={`${item.month}-${item.count}`} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-36 w-full items-end rounded-xl bg-slate-800 p-1">
                  <div className="w-full rounded-lg bg-gradient-to-t from-red-600 to-orange-400" style={{ height: `${item.height}%` }} />
                </div>
                <div className="text-center text-xs text-slate-400">
                  <p>{item.month}</p>
                  <p>{item.count}</p>
                </div>
              </div>
            )) : <p className="text-sm text-slate-400">No registration data yet.</p>}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Request status</h2>
            <ShieldCheck size={18} className="text-red-400" />
          </div>
          <div className="space-y-3">
            {dashboard?.emergencyByStatus?.map((item) => (
              <div key={item._id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/70 px-3 py-2">
                <span className="capitalize text-slate-300">{item._id}</span>
                <span className="font-semibold text-white">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="mb-4 text-lg font-semibold">Recently registered users</h2>
          <div className="space-y-3">
            {(dashboard?.recentUsers || []).length > 0 ? dashboard.recentUsers.map((user) => (
              <div key={user._id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/70 px-4 py-3">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-slate-400">{user.email}</p>
                </div>
                <span className="text-sm text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            )) : <p className="text-sm text-slate-400">No recent users.</p>}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="mb-4 text-lg font-semibold">Recent emergency requests</h2>
          <div className="space-y-3">
            {(dashboard?.recentEmergencyRequests || []).length > 0 ? dashboard.recentEmergencyRequests.map((request) => (
              <div key={request._id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/70 px-4 py-3">
                <div>
                  <p className="font-medium">{request.patient}</p>
                  <p className="text-sm text-slate-400">{request.hospital} • {request.location}</p>
                </div>
                <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-300">{request.status}</span>
              </div>
            )) : <p className="text-sm text-slate-400">No recent emergency requests.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
