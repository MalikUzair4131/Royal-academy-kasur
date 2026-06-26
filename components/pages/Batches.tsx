'use client';
// Sessions = year-based groups within a class (e.g. "Grade 9 – 2026")
import { useState, useEffect, useCallback } from 'react';
import { sessionsApi, classesApi, teachersApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Calendar, Loader2, Edit2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_STYLE: Record<string, string> = {
  upcoming: 'badge-yellow', active: 'badge-green', completed: 'badge-gray', cancelled: 'badge-red'
};

const EMPTY_FORM = {
  name: '', classId: '', instructorId: '',
  startDate: '', endDate: '', status: 'active',
  maxStudents: 50, schedule: '', notes: '',
};

export default function Sessions() {
  const { hasPermission } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sd, cd, td] = await Promise.all([
        sessionsApi.list({}),
        classesApi.list({ isActive: true }),
        teachersApi.list({ isActive: true }),
      ]);
      setSessions(sd.data.data || []);
      setTotal(sd.data.total ?? (sd.data.data?.length || 0));
      setClasses(cd.data.data || []);
      setTeachers(td.data.data || []);
    } catch { toast.error('Failed to load sessions'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Session name is required'); return; }
    setSaving(true);
    try {
      // Payload matches Batch schema:
      // name (required), code (auto-generated), class (ObjectId), instructor (ObjectId),
      // startDate, endDate, status, maxStudents, schedule, notes, branch (auto from user)
      const payload: any = {
        name: form.name.trim(),
        status: form.status,
        maxStudents: Number(form.maxStudents) || 50,
        schedule: form.schedule || undefined,
        notes: form.notes || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      };
      if (form.classId) payload.class = form.classId;
      if (form.instructorId) payload.instructor = form.instructorId;

      if (editing) await sessionsApi.update(editing._id, payload);
      else await sessionsApi.create(payload);

      toast.success(editing ? 'Session updated' : 'Session created');
      setShowForm(false); setEditing(null); setForm(EMPTY_FORM);
      load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to save session'); }
    finally { setSaving(false); }
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      name: s.name, classId: s.class?._id || s.class || '',
      instructorId: s.instructor?._id || '',
      startDate: s.startDate?.slice(0, 10) || '',
      endDate: s.endDate?.slice(0, 10) || '',
      status: s.status || 'active',
      maxStudents: s.maxStudents || 50,
      schedule: s.schedule || '', notes: s.notes || '',
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
          <p className="text-gray-500 text-sm">{total} sessions (annual / term groups)</p>
        </div>
        {hasPermission('courses', 'create') && (
          <button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
            <Plus className="w-4 h-4" /> Create Session
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : sessions.length === 0 ? (
          <div className="col-span-3 text-center py-16">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No sessions yet</p>
            <p className="text-gray-400 text-sm mt-1">Run the seed script or create sessions manually</p>
          </div>
        ) : sessions.map(s => (
          <div key={s._id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className={STATUS_STYLE[s.status] || 'badge-gray'}>{s.status}</span>
                <h3 className="font-semibold text-gray-900 mt-2">{s.name}</h3>
                <p className="text-xs text-gray-500">{s.code}</p>
                {s.class && <p className="text-xs text-blue-600 font-medium mt-0.5">{s.class.name || s.class}</p>}
              </div>
              {hasPermission('courses', 'edit') && (
                <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition">
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Instructor</span>
                <span className="text-gray-900">
                  {s.instructor ? `${s.instructor.firstName || s.instructor.name || ''}${s.instructor.lastName ? ' ' + s.instructor.lastName : ''}`.trim() : '—'}
                </span>
              </div>
              {s.startDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Start</span>
                  <span className="text-gray-900">{format(new Date(s.startDate), 'MMM d, yyyy')}</span>
                </div>
              )}
              {s.endDate && (
                <div className="flex justify-between">
                  <span className="text-gray-500">End</span>
                  <span className="text-gray-900">{format(new Date(s.endDate), 'MMM d, yyyy')}</span>
                </div>
              )}
              {s.schedule && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Schedule</span>
                  <span className="text-gray-900 text-xs">{s.schedule}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-gray-500 pt-1 border-t border-gray-50">
                <Users className="w-3.5 h-3.5" />
                <span>Max {s.maxStudents} students</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Session Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl my-4">
            <h3 className="font-bold text-gray-900 mb-4">{editing ? 'Edit Session' : 'Create New Session'}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Session Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Grade 9 – 2026 Annual Session"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Class / Grade</label>
                <select value={form.classId} onChange={e => setForm(p => ({ ...p, classId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select class (optional)</option>
                  {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Class Teacher / Instructor</label>
                <select value={form.instructorId} onChange={e => setForm(p => ({ ...p, instructorId: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select teacher (optional)</option>
                  {teachers.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.firstName && t.lastName ? `${t.firstName} ${t.lastName}` : t.name || t.email}
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
                  placeholder="e.g. Mon–Fri 8:00 AM – 2:00 PM"
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
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60">
                {saving ? 'Saving...' : editing ? 'Update Session' : 'Create Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
