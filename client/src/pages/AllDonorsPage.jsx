import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function AllDonorsPage() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDonors = async () => {
      try {
        const res = await api.get('/api/donors?limit=100');
        const list = res.data?.data?.donors || [];
        setDonors(list);
      } catch {
        setDonors([]);
      } finally {
        setLoading(false);
      }
    };

    loadDonors();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <h1 className="text-2xl font-semibold">All Donors</h1>
        <p className="mt-2 text-sm text-slate-400">Registered donors available in the system.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
        {loading ? (
          <div className="p-6 text-sm text-slate-400">Loading donors...</div>
        ) : donors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-800/70 text-left text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Blood Group</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Availability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {donors.map((donor) => (
                  <tr key={donor._id} className="bg-slate-900/40">
                    <td className="px-4 py-3 font-medium">{donor.name}</td>
                    <td className="px-4 py-3">{donor.bloodGroup}</td>
                    <td className="px-4 py-3">{donor.city || '—'}</td>
                    <td className="px-4 py-3">{donor.phone || '—'}</td>
                    <td className="px-4 py-3">{donor.department || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${donor.availability ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
                        {donor.availability ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-sm text-slate-400">No donors found.</div>
        )}
      </div>
    </div>
  );
}
