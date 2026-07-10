import { useEffect, useState } from 'react';
import api from '../../api/axios.js';

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const res = await api.get('/api/notifications');
        setNotifications(res.data?.data || []);
      } catch {
        setNotifications([]);
      }
    };

    loadNotifications();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="mt-2 text-sm text-slate-400">Monitor recent notifications from the system.</p>
      </div>
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
        {notifications.length > 0 ? notifications.map((notification) => (
          <div key={notification._id} className="mb-3 rounded-2xl border border-slate-800 bg-slate-800/70 p-4">
            <p className="font-medium">{notification.title}</p>
            <p className="mt-1 text-sm text-slate-400">{notification.message}</p>
          </div>
        )) : <p className="text-sm text-slate-400">No notifications yet.</p>}
      </div>
    </div>
  );
}
