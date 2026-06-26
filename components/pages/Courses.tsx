'use client';
// This file now manages CLASSES (renamed from Courses for school ERP)
import { useState, useEffect, useCallback } from 'react';
import { classesApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, GraduationCap, Edit2, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY_FORM = { name: '', description: '' };

export default function Classes() {
  const { hasPermission } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await classesApi.list({ search: search || undefined });
      setClasses(data.data || []);
    } catch { toast.error('Failed to load classes'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Class name is required'); return; }
    setSaving(true);
    try {
      if (editing) await classesApi.update(editing._id, form);
      else await classesApi.create(form);
      toast.success(editing ? 'Class updated' : 'Class created');
      setShowForm(false); setEditing(null); setForm(EMPTY_FORM);
      load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to save class'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this class?')) return;
    try { await classesApi.delete(id); toast.success('Class deleted'); load(); }
    catch { toast.error('Failed to delete class'); }
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || '' });
    setShowForm(true);
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-500 text-sm">{classes.length} classes</p>
        </div>
        {hasPermission('courses', 'create') && (
          <button onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
            <Plus className="w-4 h-4" /> Add Class
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search classes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : classes.length === 0 ? (
          <div className="col-span-3 text-center py-16">
            <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No classes yet</p>
            <p className="text-gray-400 text-sm mt-1">Run the seed script or create classes manually</p>
          </div>
        ) : classes.map(c => (
          <div key={c._id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex gap-1">
                {hasPermission('courses', 'edit') && (
                  <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition">
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                {hasPermission('courses', 'delete') && (
                  <button onClick={() => handleDelete(c._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{c.name}</h3>
            <p className="text-xs text-gray-500 mb-2">{c.code}</p>
            {c.description && <p className="text-xs text-gray-400">{c.description}</p>}
            <div className="mt-3">
              <span className={c.isActive ? 'badge-green' : 'badge-red'}>{c.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-4">{editing ? 'Edit Class' : 'Add New Class'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Class Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Grade 9, Junior Grade"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60">
                {saving ? 'Saving...' : editing ? 'Update Class' : 'Create Class'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
