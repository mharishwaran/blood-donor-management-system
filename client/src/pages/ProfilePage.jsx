import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const dateInputRef = useRef(null);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    city: user?.city || '',
    department: user?.department || '',
    year: user?.year || '',
    bloodGroup: user?.bloodGroup || '',
    availability: user?.availability ?? true,
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
  });

  useEffect(() => {
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      city: user?.city || '',
      department: user?.department || '',
      year: user?.year || '',
      bloodGroup: user?.bloodGroup || '',
      availability: user?.availability ?? true,
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    });
  }, [user]);

  const formatDateForDisplay = (value) => {
    if (!value) return '';
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = {
        ...form,
        dateOfBirth: form.dateOfBirth || null
      };
      const res = await api.put('/api/users/profile', payload);
      if (res.data.success) {
        updateUser(res.data.data.user);
        toast.success('Profile updated');
      }
    } catch (error) {
      toast.error('Unable to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-orange-400 text-xl font-semibold">
              {user?.name?.[0]}
            </div>

            <div>
              <h1 className="text-2xl font-semibold">{user?.name}</h1>
              <p className="text-sm text-slate-400">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={loading} className="rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-4 py-3 font-semibold hover:opacity-90 transition disabled:opacity-70">
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

        </div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-2">

        {/* Personal Information */}

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">

          <h2 className="mb-4 text-lg font-semibold">
            Personal information
          </h2>

          <div className="space-y-4">

            <input
              type="text"
              placeholder="Enter your full name"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <input
              type="email"
              placeholder="Enter your email address"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
            />

            <input
              type="tel"
              placeholder="Enter your phone number"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
            />

          </div>

        </div>

        {/* Blood Details */}

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">

          <h2 className="mb-4 text-lg font-semibold">
            Blood details
          </h2>

          <div className="space-y-4">

            <select
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
              value={form.bloodGroup}
              onChange={(e) =>
                setForm({ ...form, bloodGroup: e.target.value })
              }
            >
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>

            <input
              type="text"
              placeholder="Enter your department"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
              value={form.department}
              onChange={(e) =>
                setForm({ ...form, department: e.target.value })
              }
            />

            <input
              type="text"
              placeholder="Enter your year (e.g. 3rd Year)"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
              value={form.year}
              onChange={(e) =>
                setForm({ ...form, year: e.target.value })
              }
            />

            <input
              type="text"
              placeholder="Enter your city"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
              value={form.city}
              onChange={(e) =>
                setForm({ ...form, city: e.target.value })
              }
            />

            <div
              className="relative"
              onClick={() => dateInputRef.current?.showPicker?.()}
            >
              <input
                ref={dateInputRef}
                type="date"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3"
                style={{
                  color: form.dateOfBirth ? 'inherit' : 'transparent',
                  WebkitTextFillColor: form.dateOfBirth ? 'currentColor' : 'transparent',
                }}
                value={form.dateOfBirth}
                onChange={(e) =>
                  setForm({
                    ...form,
                    dateOfBirth: e.target.value,
                  })
                }
                onFocus={() => dateInputRef.current?.showPicker?.()}
              />
              {!form.dateOfBirth && (
                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-slate-400">
                  Date of Birth
                </div>
              )}
            </div>

            <label className="flex items-center gap-3 text-sm text-slate-300">

              <input
                type="checkbox"
                checked={form.availability}
                onChange={(e) =>
                  setForm({
                    ...form,
                    availability: e.target.checked,
                  })
                }
              />

              Available for donation

            </label>

          </div>

        </div>

      </div>

    </div>
  );
}