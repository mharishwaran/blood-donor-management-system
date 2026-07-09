import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function AdminPage() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    api.get('/api/emergency-requests').then((res) => setRequests(res.data.data || [])).catch(() => setRequests([]));
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <p className="mt-2 text-sm text-slate-400">Overview of donor activity, emergency requests, and system alerts.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">Manage users</div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">Approve requests</div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">Monitor notifications</div>
      </div>
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        <h2 className="mb-4 text-lg font-semibold">Recent emergency requests</h2>
        <div className="space-y-3">
          {requests.map((request) => (
            <div key={request._id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-800/70 p-4">
              <div>
                <p className="font-medium">{request.hospital}</p>
                <p className="text-sm text-slate-400">{request.patient} • {request.location}</p>
              </div>
              <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm text-red-300">{request.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
