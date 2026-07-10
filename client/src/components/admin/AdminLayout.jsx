import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, HeartHandshake, ClipboardList, AlertTriangle, UserCircle, Bell, LogOut } from 'lucide-react';
import adminApi, { ADMIN_TOKEN_KEY } from '../../api/adminAxios.js';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/dashboard/users', label: 'Users', icon: Users },
  { to: '/admin/dashboard/donors', label: 'Donors', icon: HeartHandshake },
  { to: '/admin/dashboard/requests', label: 'Requests', icon: ClipboardList },
  { to: '/admin/dashboard/emergency', label: 'Emergency Requests', icon: AlertTriangle },
  { to: '/admin/dashboard/profile', label: 'Admin Profile', icon: UserCircle },
  { to: '/admin/dashboard/notifications', label: 'Notifications', icon: Bell }
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: 'Admin', email: '' });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await adminApi.get('/api/admin/profile');
        const nextProfile = res.data?.data || {};
        setProfile({ name: nextProfile.name || 'Admin', email: nextProfile.email || '' });
        localStorage.setItem('adminProfile', JSON.stringify(nextProfile));
      } catch {
        const cached = localStorage.getItem('adminProfile');
        if (cached) {
          try {
            setProfile(JSON.parse(cached));
          } catch {
            // ignore
          }
        }
      }
    };

    loadProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem('adminSessionVerified');
    localStorage.removeItem('adminProfile');
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem('adminSessionVerified');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row">
        <aside className="w-full border-b border-slate-800 bg-slate-900/90 p-4 backdrop-blur lg:w-72 lg:min-h-screen lg:border-b-0 lg:border-r">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm font-semibold text-red-300">Blood Donor Admin</p>
            <p className="text-xs text-slate-400">Separate administrative workspace</p>
          </div>
          <nav className="mt-6 space-y-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 transition ${isActive ? 'bg-red-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-800/80 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-400 font-semibold text-white">
                {profile.name?.[0] || 'A'}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{profile.name}</p>
                <p className="truncate text-xs text-slate-400">{profile.email}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="mt-4 flex items-center gap-2 rounded-xl bg-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-600">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </aside>
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
