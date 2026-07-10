import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function AllRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const res = await api.get('/api/emergency-requests');
        const list = res.data?.data || [];
        setRequests(list);
      } catch {
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <h1 className="text-2xl font-semibold">All Requests</h1>
        <p className="mt-2 text-sm text-slate-400">Emergency blood requests recorded in the system.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80">
        {loading ? (
          <div className="p-6 text-sm text-slate-400">Loading requests...</div>
        ) : requests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-800/70 text-left text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Blood Group</th>
                  <th className="px-4 py-3 font-medium">Hospital</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {requests.map((request) => (
                  <tr key={request._id} className="bg-slate-900/40">
                    <td className="px-4 py-3 font-medium">{request.patient}</td>
                    <td className="px-4 py-3">{request.bloodGroup}</td>
                    <td className="px-4 py-3">{request.hospital}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${request.status === 'active' ? 'bg-red-500/20 text-red-300' : 'bg-slate-700 text-slate-300'}`}>
                        {request.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{request.location || '—'}</td>
                    <td className="px-4 py-3">{request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-sm text-slate-400">No requests found.</div>
        )}
      </div>
    </div>
  );
}
