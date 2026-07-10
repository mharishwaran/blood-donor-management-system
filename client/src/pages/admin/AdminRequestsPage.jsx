import { useEffect, useState } from 'react';
import adminApi from '../../api/adminAxios.js';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    try {
      const res = await adminApi.get('/api/admin/requests');
      setRequests(res.data?.data || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await adminApi.patch(`/api/admin/requests/${id}/status`, { status });
      await loadRequests();
    } catch {
      // ignore
    }
  };

  if (loading) {
    return <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-slate-300">Loading requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
        <h1 className="text-2xl font-semibold">Blood Requests</h1>
        <p className="mt-2 text-sm text-slate-400">Review and manage blood request submissions.</p>
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
                <span className="rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-300">{request.units} units</span>
                <span className="rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-300">{request.status}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-400">Requested by {request.requestedBy?.name || 'Unknown'} • {new Date(request.createdAt).toLocaleDateString()}</p>
              <div className="flex gap-2">
                <button onClick={() => handleStatusUpdate(request._id, 'approved')} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-500">Approve</button>
                <button onClick={() => handleStatusUpdate(request._id, 'rejected')} className="rounded-xl bg-slate-700 px-3 py-2 text-sm text-white hover:bg-slate-600">Reject</button>
              </div>
            </div>
          </div>
        )) : <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-slate-400">No recent requests.</div>}
      </div>
    </div>
  );
}
