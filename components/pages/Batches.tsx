'use client';
import { useState, useEffect, useCallback } from 'react';
import { batchesApi, teachersApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Calendar, Loader2, Edit2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_STYLE: Record<string, string> = {
  upcoming: 'badge-yellow', active: 'badge-green', completed: 'badge-gray', cancelled: 'badge-red'
};

// School classes — these mirror the seed data and the Classes collection
const SCHOOL_CLASSES = [
  'Junior Grade',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
  'Supplementary Students',
];

const EMPTY_FORM = {
  name: '', className: '', instructor: '', startDate: '', endDate: '',
  status: 'upcoming', maxStudents: 30, schedule: '', notes: ''
};

export default function Batches() {
  const { hasPermission } = useAuth();
  const [batches, setBatches] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bd, td] = await Promise.all([
        batchesApi.list({}),
        teachersApi.list({ isActive: true }),
      ]);
      setBatches(bd.data.data);
      setTotal(bd.data.total ?? bd.data.data.length);
      setTeachers(td.data.data);
    } catch {
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.name) { toast.error('Batch name is required'); return; }
    try {
      // Build payload — className is human-readable, backend resolves/creates Class
      const payload: any = {
        name: form.name,
        status: form.status,
        maxStudents: form.maxStudents,
        schedule: form.schedule,
        notes: form.notes,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        instructor: form.instructor || undefined,
      };
      // Pass class name as a string; the API will resolve or create it
      if (form.className) payload.className = form.className;

      if (editing) await batchesApi.update(editing._id, payload);
      else await batchesApi.create(payload);

      toast.success(editing ? 'Batch updated' : 'Batch created');
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save batch');
    }
  };

  const openEdit = (b: any) => {
    setEditing(b);
    setForm({
      name: b.name,
      className: b.class?.name || b.className || '',
      instructor: b.instructor?._id || '',
      startDate: b.startDate?.slice(0, 10) || '',
      endDate: b.endDate?.slice(0, 10) || '',
      status: b.status,
      maxStudents: b.maxStudents,
      schedule: b.schedule || '',
      notes: b.notes || '',
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batches</h1>
          <p className="text-gray-500 text-sm">{total} batches</p>
        </div>
        {hasPermission('courses', 'create') && (
          <button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
            <Plus className="w-4 h-4" /> Create Batch
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : batches.length === 0 ? (
          <div className="col-span-3 text-center py-16">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No batches yet. Create the first one!</p>
          </div>
        ) : batches.map(b => (
          <div key={b._id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className={STATUS_STYLE[b.status] || 'badge-gray'}>{b.status}</span>
                <h3 className="font-semibold text-gray-900 mt-2">{b.name}</h3>
                <p className="text-xs text-gray-500">{b.code}</p>
                {(b.class?.name || b.className) && (
                  <p className="text-xs text-blue-600 font-medium mt-0.5">{b.class?.name || b.className}</p>
                )}
              </div>
              {hasPermission('courses', 'edit') && (
                <button onClick={() => openEdit(b)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition">
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Instructor</span>
                <span className="text-gray-900">
                  {b.instructor ? `${b.instructor.firstName || ''} ${b.instructor.lastName || b.instructor.name || ''}`.trim() : '—'}
                </span>
              </div>
              {b.startDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Start</span>
                  <span className="text-gray-900">{format(new Date(b.startDate), 'MMM d, yyyy')}</span>
                </div>
              )}
              {b.endDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">End</span>
                  <span className="text-gray-900">{format(new Date(b.endDate), 'MMM d, yyyy')}</span>
                </div>
              )}
              {b.schedule && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Schedule</span>
                  <span className="text-gray-900 text-xs">{b.schedule}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Users className="w-3.5 h-3.5" />
                  <span>Max {b.maxStudents} students</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Batch Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl my-4">
            <h3 className="font-bold text-gray-900 mb-4">{editing ? 'Edit Batch' : 'Create New Batch'}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Batch Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Grade 9 – 2026 Batch"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Class / Grade</label>
                <select value={form.className} onChange={e => setForm(p => ({ ...p, className: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select class (optional)</option>
                  {SCHOOL_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Instructor</label>
                <select value={form.instructor} onChange={e => setForm(p => ({ ...p, instructor: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select instructor (optional)</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.firstName && t.lastName ? `${t.firstName} ${t.lastName}` : t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Max Students</label>
                <input type="number" min={1} value={form.maxStudents} onChange={e => setForm(p => ({ ...p, maxStudents: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Schedule</label>
                <input value={form.schedule} onChange={e => setForm(p => ({ ...p, schedule: e.target.value }))}
                  placeholder="e.g. Mon-Fri 9:00 AM – 1:00 PM"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowForm(false); setEditing(null); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">
                Save Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
