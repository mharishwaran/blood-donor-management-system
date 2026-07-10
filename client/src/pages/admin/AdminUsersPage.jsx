import { useEffect, useMemo, useState } from 'react';
import adminApi from '../../api/adminAxios.js';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [expandedId, setExpandedId] = useState('');
  const limit = 8;

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await adminApi.get('/api/admin/users', { params: { page, limit, search } });
        setUsers(res.data?.data?.users || []);
        setTotal(res.data?.data?.total || 0);
      } catch {
        setUsers([]);
        setTotal(0);
      }
    };

    loadUsers();
  }, [page, search]);

  const filteredUsers = useMemo(() => {
    if (!filter) return users;
    return users.filter((user) => user.bloodGroup === filter);
  }, [users, filter]);

  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-2 text-sm text-slate-400">Manage registered users from MongoDB.</p>
      </div>
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search users" className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white md:max-w-xs" />
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white">
            <option value="">All blood groups</option>
            {Array.from(new Set(users.map((user) => user.bloodGroup).filter(Boolean))).map((bloodGroup) => (
              <option key={bloodGroup} value={bloodGroup}>{bloodGroup}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-800/80 text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Blood Group</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Registered</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
              <>
                <tr key={user._id} className="bg-slate-900/60">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.phone || '—'}</td>
                  <td className="px-4 py-3">{user.bloodGroup || '—'}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs ${user.isBlocked ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>{user.isBlocked ? 'Blocked' : 'Active'}</span></td>
                  <td className="px-4 py-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><button onClick={() => setExpandedId(expandedId === user._id ? '' : user._id)} className="text-sm text-red-300 hover:text-red-200">View Details</button></td>
                </tr>
                {expandedId === user._id ? (
                  <tr className="bg-slate-800/50">
                    <td colSpan="7" className="px-4 py-3 text-sm text-slate-300">
                      <div className="grid gap-2 md:grid-cols-3">
                        <div><span className="text-slate-400">Department:</span> {user.department || '—'}</div>
                        <div><span className="text-slate-400">Year:</span> {user.year || '—'}</div>
                        <div><span className="text-slate-400">City:</span> {user.city || '—'}</div>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </>
            )) : <tr><td colSpan="7" className="px-4 py-6 text-center text-slate-400">No users found.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
        <p className="text-sm text-slate-400">Page {page} of {pageCount}</p>
        <div className="flex gap-2">
          <button onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1} className="rounded-xl border border-slate-700 px-3 py-2 text-sm disabled:opacity-50">Previous</button>
          <button onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))} disabled={page === pageCount} className="rounded-xl border border-slate-700 px-3 py-2 text-sm disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}
