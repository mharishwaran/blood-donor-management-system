import { useEffect, useMemo, useState } from 'react';
import adminApi from '../../api/adminAxios.js';

export default function AdminDonorsPage() {
  const [donors, setDonors] = useState([]);
  const [search, setSearch] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [expandedId, setExpandedId] = useState('');

  useEffect(() => {
    const loadDonors = async () => {
      try {
        const res = await adminApi.get('/api/admin/donors', { params: { search } });
        setDonors(res.data?.data?.donors || []);
      } catch {
        setDonors([]);
      }
    };

    loadDonors();
  }, [search]);

  const filteredDonors = useMemo(() => {
    return donors.filter((donor) => {
      if (availabilityFilter === 'available' && !donor.availability) return false;
      if (availabilityFilter === 'unavailable' && donor.availability) return false;
      return true;
    });
  }, [donors, availabilityFilter]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
        <h1 className="text-2xl font-semibold">Donors</h1>
        <p className="mt-2 text-sm text-slate-400">View active donor records from MongoDB.</p>
      </div>
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search donors" className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white md:max-w-xs" />
          <select value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white">
            <option value="">All donors</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4">
        {filteredDonors.length > 0 ? filteredDonors.map((donor) => (
          <div key={donor._id} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-semibold">{donor.name}</p>
                <p className="text-sm text-slate-400">{donor.user?.name || donor.name} • {donor.city || 'Unknown city'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-300">{donor.bloodGroup}</span>
                <span className={`rounded-full px-3 py-1 text-sm ${donor.availability ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>{donor.availability ? 'Available' : 'Unavailable'}</span>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-300 md:grid-cols-3">
              <div><span className="text-slate-400">Department:</span> {donor.department || '—'}</div>
              <div><span className="text-slate-400">Year:</span> {donor.year || '—'}</div>
              <div><span className="text-slate-400">Phone:</span> {donor.phone || '—'}</div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-slate-400">Last updated: {new Date(donor.updatedAt || donor.createdAt).toLocaleDateString()}</p>
              <button onClick={() => setExpandedId(expandedId === donor._id ? '' : donor._id)} className="text-sm text-red-300 hover:text-red-200">{expandedId === donor._id ? 'Hide details' : 'View Details'}</button>
            </div>
            {expandedId === donor._id ? (
              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-800/70 p-4 text-sm text-slate-300">
                <p><span className="text-slate-400">Email:</span> {donor.user?.email || '—'}</p>
                <p><span className="text-slate-400">Availability:</span> {donor.availability ? 'Available for donation' : 'Not available'}</p>
              </div>
            ) : null}
          </div>
        )) : <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-slate-400">No donors found.</div>}
      </div>
    </div>
  );
}
