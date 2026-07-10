import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Users, AlertCircle, HeartHandshake, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const [stats, setStats] = useState({ donors: 0, requests: 0, active: 0 });
  const [requests, setRequests] = useState([]);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const [donorsRes, requestsRes] = await Promise.allSettled([api.get('/api/donors'), api.get('/api/emergency-requests')]);
      const donorsCount = donorsRes.status === 'fulfilled' ? donorsRes.value.data.data.total || 0 : 0;
      const emergencyRequests = requestsRes.status === 'fulfilled' ? requestsRes.value.data.data || [] : [];

      setStats({
        donors: donorsCount,
        requests: emergencyRequests.length || 0,
        active: emergencyRequests.filter((r) => r.status === 'active').length || 0
      });
      setRequests(emergencyRequests.slice(0, 4));
    } catch {
      setStats((prev) => ({ ...prev }));
      setRequests([]);
    }
  };

  useEffect(() => {
    const shouldShowWelcome = localStorage.getItem('showWelcomeMessage') === 'true';
    if (shouldShowWelcome && user?.name) {
      setWelcomeMessage(`Welcome, ${user.name}`);
      localStorage.removeItem('showWelcomeMessage');
    } else if (user?.name) {
      setWelcomeMessage(`Welcome back, ${user.name}`);
    }

    fetchStats();

    const handleRefresh = () => {
      fetchStats();
    };

    window.addEventListener('dashboard:refresh', handleRefresh);
    window.addEventListener('focus', handleRefresh);

    return () => {
      window.removeEventListener('dashboard:refresh', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
    };
  }, [user?.name]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-red-300">Operations Center</p>
          <h1 className="text-3xl font-semibold">Blood donor dashboard</h1>
          {welcomeMessage && <p className="mt-2 text-sm text-slate-300">{welcomeMessage}</p>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: 'Total Donors', value: stats.donors, icon: Users, accent: 'from-red-500 to-orange-400', path: '/dashboard/all-donors' },
          { label: 'Requests', value: stats.requests, icon: HeartHandshake, accent: 'from-sky-500 to-indigo-500', path: '/dashboard/all-requests' },
          { label: 'Active Emergencies', value: stats.active, icon: AlertCircle, accent: 'from-emerald-500 to-lime-500' }
        ].map((item, index) => {
          const isClickable = Boolean(item.path);
          const cardContent = (
            <>
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.accent}`}>
                <item.icon className="text-white" size={20} />
              </div>
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold">{item.value}</p>
            </>
          );

          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-left shadow-xl transition duration-200 sm:p-5 ${isClickable ? 'cursor-pointer hover:-translate-y-1 hover:shadow-2xl' : 'cursor-default'}`}
              onClick={() => isClickable && navigate(item.path)}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onKeyDown={(event) => {
                if (isClickable && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  navigate(item.path);
                }
              }}
            >
              {cardContent}
            </motion.div>
          );
        })}
      </div>
      <div className="grid gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h2 className="mb-4 text-lg font-semibold">Recent emergency requests</h2>
          <div className="min-h-[240px]">
            {requests.length > 0 ? (
              <div className="space-y-3">
                {requests.map((request) => (
                  <div key={request._id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-800/70 p-4">
                    <div>
                      <p className="font-medium">{request.hospital}</p>
                      <p className="text-sm text-slate-400">{request.patient} • {request.bloodGroup}</p>
                    </div>
                    <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-300">{request.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-800/40 px-6 py-8 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-red-300">
                  <ClipboardList size={20} />
                </div>
                <h3 className="text-lg font-semibold text-white">No Recent Emergency Requests</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">There are currently no emergency requests. New requests will appear here when they are created.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
