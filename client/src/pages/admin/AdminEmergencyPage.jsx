import { useEffect, useState } from 'react';
import adminApi from '../../api/adminAxios.js';

export default function AdminEmergencyPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEmergency = async () => {
      try {
        const res = await adminApi.get('/api/admin/emergency-requests');
        const payload = res.data?.data;
        setRequests(Array.isArray(payload) ? payload : payload?.requests || []);
      } catch {
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    loadEmergency();
  }, []);

  if (loading) {
    return <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-slate-300">Loading emergency requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
        <h1 className="text-2xl font-semibold">Emergency Requests</h1>
       
      </div>
      <div className="grid gap-4">
        {requests.length > 0 ? requests.map((request) => (
          <div key={request._id} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-semibold">{request.patient}</p>
                <p className="text-sm text-slate-400">{request.hospital} • {request.location}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-300">{request.bloodGroup}</span>
                <span className="rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-300">{request.status}</span>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-300 md:grid-cols-3">
              <div><span className="text-slate-400">Contact:</span> {request.phoneNumber || '—'}</div>
              <div><span className="text-slate-400">City:</span> {request.location || '—'}</div>
              <div><span className="text-slate-400">Date:</span> {new Date(request.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        )) : <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-slate-400">No recent emergency requests.</div>}
      </div>
    </div>
  );
}
