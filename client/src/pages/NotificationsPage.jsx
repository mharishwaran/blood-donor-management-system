import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';
import api from '../api/axios';

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      setItems(res.data.data || []);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      loadNotifications();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update notification');
    }
  };

  const confirmDelete = async () => {
    if (!selectedId) return;

    setIsDeleting(true);
    try {
      await api.delete(`/api/notifications/${selectedId}`);
      await loadNotifications();
      toast.success('Notification deleted successfully.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to delete notification');
    } finally {
      setIsDeleting(false);
      setSelectedId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Notifications</h1>
      {items.length === 0 ? (
        <div className="flex min-h-[60vh] items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-center">
          <div>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800 text-slate-300">
              <span className="text-2xl">🔔</span>
            </div>
            <h2 className="text-lg font-semibold">No Notifications Available</h2>
            <p className="mt-2 max-w-md text-sm text-slate-400">You don't have any notifications yet. New emergency alerts and updates will appear here.</p>
          </div>
        </div>
      ) : (
        items.map((item) => (
        <div key={item._id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-slate-400">{item.message}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs ${item.read ? 'bg-slate-800 text-slate-300' : 'bg-red-500/20 text-red-300'}`}>{item.read ? 'Read' : 'New'}</span>
              {!item.read && (
                <button onClick={() => markRead(item._id)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm transition hover:bg-slate-800">
                  Mark read
                </button>
              )}
              <button
                onClick={() => setSelectedId(item._id)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-300 transition hover:bg-slate-800 hover:text-red-300"
                aria-label="Delete notification"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
        ))
      )}

      <ConfirmationModal
        isOpen={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
