import { useEffect, useState } from 'react';
import { Trash2, Pencil } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function EmergencyPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ hospital: '', patient: '', phoneNumber: '', bloodGroup: 'O+', units: '', location: '', urgency: '' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [editingForm, setEditingForm] = useState({ hospital: '', patient: '', phoneNumber: '', bloodGroup: 'O+', units: '', location: '', urgency: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRequests = async () => {
    try {
      const res = await api.get('/api/emergency-requests');
      setRequests(res.data.data || []);
    } catch {
      setRequests([]);
    }
  };

  useEffect(() => { loadRequests(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.hospital.trim() || !form.patient.trim() || !form.phoneNumber.trim() || !form.location.trim() || !form.urgency) {
      toast.error('Please fill in all required fields');
      return;
    }

    const phone = form.phoneNumber.replace(/\D/g, '');
    if (phone.length < 10 || phone.length > 10) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    const unitsValue = Number(form.units);
    if (!Number.isInteger(unitsValue) || unitsValue < 1) {
      toast.error('Units must be a whole number greater than or equal to 1');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/api/emergency-requests', { ...form, phoneNumber: phone, units: unitsValue, urgency: form.urgency });
      if (res.data.success) {
        toast.success('Emergency request created');
        setForm({ hospital: '', patient: '', phoneNumber: '', bloodGroup: 'O+', units: '', location: '', urgency: '' });
        await loadRequests();
        window.dispatchEvent(new CustomEvent('dashboard:refresh'));
      } else {
        toast.error(res.data.message || 'Unable to create emergency request');
      }
    } catch (error) {
      toast.error(error.customMessage || error?.response?.data?.message || 'Failed to create emergency request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await api.delete(`/api/emergency-requests/${deleteTarget._id}`);
      if (res.data.success) {
        toast.success('Emergency request removed successfully.');
        setDeleteTarget(null);
        loadRequests();
        window.dispatchEvent(new CustomEvent('dashboard:refresh'));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete emergency request');
    }
  };

  const handleEditClick = (request) => {
    setEditingRequest(request);
    setEditingForm({
      hospital: request.hospital || '',
      patient: request.patient || '',
      phoneNumber: request.phoneNumber || '',
      bloodGroup: request.bloodGroup || 'O+',
      units: request.units?.toString() || '',
      location: request.location || '',
      urgency: request.urgency || 'high'
    });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingRequest) return;

    if (!editingForm.hospital.trim() || !editingForm.patient.trim() || !editingForm.phoneNumber.trim() || !editingForm.location.trim() || !editingForm.urgency) {
      toast.error('Please fill in all required fields');
      return;
    }

    const phone = editingForm.phoneNumber.replace(/\D/g, '');
    if (phone.length < 10 || phone.length > 10) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    const unitsValue = Number(editingForm.units);
    if (!Number.isInteger(unitsValue) || unitsValue < 1) {
      toast.error('Units must be a whole number greater than or equal to 1');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await api.put(`/api/emergency-requests/${editingRequest._id}`, {
        ...editingForm,
        phoneNumber: phone,
        units: unitsValue,
        urgency: editingForm.urgency,
      });

      if (res.data.success) {
        toast.success('Emergency request updated successfully.');
        setEditingRequest(null);
        setEditingForm({ hospital: '', patient: '', phoneNumber: '', bloodGroup: 'O+', units: '', location: '', urgency: '' });
        await loadRequests();
        window.dispatchEvent(new CustomEvent('dashboard:refresh'));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update emergency request');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-red-500/20 bg-slate-900/80 p-6 shadow-2xl">
        <h1 className="text-2xl font-semibold">Emergency blood requests</h1>
        <p className="mt-2 text-sm text-slate-400">Create urgent requests and notify available donors instantly.</p>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <input className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3" placeholder="Hospital" value={form.hospital} onChange={(e) => setForm({ ...form, hospital: e.target.value })} />
          <input className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3" placeholder="Patient" value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })} />
          <input className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3" type="tel" inputMode="numeric" pattern="[0-9]{10}" placeholder="Enter patient contact number" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value.replace(/\D/g, '') })} />
          <select className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
            <option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="O+">O+</option><option value="O-">O-</option><option value="AB+">AB+</option><option value="AB-">AB-</option>
          </select>
          <input className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3" type="number" min="1" placeholder="Units" value={form.units} onChange={(e) => setForm({ ...form, units: e.target.value })} />
          <input className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <select className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3" value={form.urgency} onChange={(e) => setForm({ ...form, urgency: e.target.value })}>
            <option value="">Select Urgency</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
          <div className="md:col-span-2"><button className="w-full rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-4 py-3 font-semibold">Create Request</button></div>
        </form>
      </div>
      <div className="grid gap-4">
        {requests.map((request) => (
          <div key={request._id} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{request.hospital}</p>
                <p className="text-sm text-slate-400">Patient: {request.patient} • {request.location}</p>
                <p className="mt-1 text-sm text-slate-400">Phone: {request.phoneNumber || 'Not provided'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm font-medium text-red-300">{request.status}</span>
                {user?._id && request.requestedBy?._id === user._id && (
                  <>
                    <button
                      onClick={() => handleEditClick(request)}
                      className="flex items-center gap-2 rounded-full border border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                    >
                      <Pencil size={16} />
                      Update
                    </button>
                    <button
                      onClick={() => setDeleteTarget(request)}
                      className="flex items-center gap-2 rounded-full border border-red-500/40 px-3 py-1.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-400">
              <span className="rounded-full bg-slate-800 px-3 py-1">Blood: {request.bloodGroup}</span>
              <span className="rounded-full bg-slate-800 px-3 py-1">Units: {request.units}</span>
              <span className="rounded-full bg-slate-800 px-3 py-1">Urgency: {request.urgency}</span>
            </div>
          </div>
        ))}
      </div>

      {editingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-white">Update Emergency Request</h3>
            <form onSubmit={handleUpdateSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
              <input className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3" placeholder="Hospital" value={editingForm.hospital} onChange={(e) => setEditingForm({ ...editingForm, hospital: e.target.value })} />
              <input className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3" placeholder="Patient" value={editingForm.patient} onChange={(e) => setEditingForm({ ...editingForm, patient: e.target.value })} />
              <input className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3" type="tel" inputMode="numeric" pattern="[0-9]{10}" placeholder="Enter patient contact number" value={editingForm.phoneNumber} onChange={(e) => setEditingForm({ ...editingForm, phoneNumber: e.target.value.replace(/\D/g, '') })} />
              <select className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3" value={editingForm.bloodGroup} onChange={(e) => setEditingForm({ ...editingForm, bloodGroup: e.target.value })}>
                <option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option><option value="O+">O+</option><option value="O-">O-</option><option value="AB+">AB+</option><option value="AB-">AB-</option>
              </select>
              <input className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3" type="number" min="1" placeholder="Units" value={editingForm.units} onChange={(e) => setEditingForm({ ...editingForm, units: e.target.value })} />
              <input className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3" placeholder="Location" value={editingForm.location} onChange={(e) => setEditingForm({ ...editingForm, location: e.target.value })} />
              <select className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3" value={editingForm.urgency} onChange={(e) => setEditingForm({ ...editingForm, urgency: e.target.value })}>
                <option value="">Select Urgency</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select>
              <div className="flex justify-end gap-3 md:col-span-2">
                <button type="button" onClick={() => setEditingRequest(null)} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800">Cancel</button>
                <button type="submit" disabled={isUpdating} className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-70">{isUpdating ? 'Saving...' : 'Save Update'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-white">Delete Emergency Request?</h3>
            <p className="mt-2 text-sm text-slate-400">This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800">Cancel</button>
              <button onClick={handleDelete} className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
