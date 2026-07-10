import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import adminApi from '../../api/adminAxios.js';

export default function AdminProfilePage() {
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await adminApi.get('/api/admin/profile');
        const nextProfile = res.data?.data || {};
        setProfile({ name: nextProfile.name || '', email: nextProfile.email || '' });
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

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await adminApi.put('/api/admin/profile', { name: profile.name });
      if (res.data?.success) {
        const nextProfile = res.data?.data?.user || { ...profile };
        setProfile({ name: nextProfile.name || profile.name, email: nextProfile.email || profile.email });
        localStorage.setItem('adminProfile', JSON.stringify(nextProfile));
        toast.success('Admin profile updated');
      }
    } catch (error) {
      toast.error(error.customMessage || error?.response?.data?.message || 'Unable to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
        <h1 className="text-2xl font-semibold">Admin Profile</h1>
        <p className="mt-2 text-sm text-slate-400">Manage the administrative identity for this workspace.</p>
      </div>
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-slate-400">Admin Name</label>
            <input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-400">Admin Email</label>
            <input value={profile.email} readOnly className="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3 text-slate-300" />
          </div>
          <button onClick={handleSave} disabled={saving} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-70">{saving ? 'Saving...' : 'Save Profile'}</button>
        </div>
      </div>
    </div>
  );
}
