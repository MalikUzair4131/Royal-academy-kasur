'use client';
import { useState, useEffect, useCallback } from 'react';
import { coursesApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, BookOpen, Edit2, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Courses() {
  const { hasPermission } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', type: 'training', category: '', durationMonths: '', admissionFee: 0, monthlyFee: 0, examFee: 0, certificateFee: 0, maxStudents: 30, description: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await coursesApi.list({ search: search || undefined });
      setCourses(data.data); setTotal(data.total);
    } catch { toast.error('Failed to load courses'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    try {
      if (editing) await coursesApi.update(editing._id, form);
      else await coursesApi.create(form);
      toast.success(editing ? 'Course updated' : 'Course created');
      setShowForm(false); setEditing(null);
      setForm({ name: '', type: 'training', category: '', durationMonths: '', admissionFee: 0, monthlyFee: 0, examFee: 0, certificateFee: 0, maxStudents: 30, description: '' });
      load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to save'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deactivate this course?')) return;
    try { await coursesApi.delete(id); toast.success('Course deactivated'); load(); }
    catch { toast.error('Failed to deactivate'); }
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ name: c.name, type: c.type, category: c.category||'', durationMonths: c.durationMonths||'', admissionFee: c.admissionFee||0, monthlyFee: c.monthlyFee||0, examFee: c.examFee||0, certificateFee: c.certificateFee||0, maxStudents: c.maxStudents||30, description: c.description||'' });
    setShowForm(true);
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div><h1 className="text-2xl font-bold text-gray-900">Courses</h1><p className="text-gray-500 text-sm">{total} courses</p></div>
        {hasPermission('courses', 'create') && (
          <button onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
            <Plus className="w-4 h-4" /> Add Course
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <div className="col-span-3 flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
          : courses.length === 0 ? (
            <div className="col-span-3 text-center py-16">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No courses found</p>
            </div>
          ) : courses.map(c => (
            <div key={c._id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex gap-1">
                  {hasPermission('courses', 'edit') && (
                    <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"><Edit2 className="w-4 h-4" /></button>
                  )}
                  {hasPermission('courses', 'delete') && (
                    <button onClick={() => handleDelete(c._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{c.name}</h3>
              <p className="text-xs text-gray-500 mb-3">{c.code} · {c.category || c.type}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-500">Admission</p><p className="font-semibold text-gray-900">PKR {c.admissionFee?.toLocaleString()}</p></div>
                <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-500">Monthly</p><p className="font-semibold text-gray-900">PKR {c.monthlyFee?.toLocaleString()}</p></div>
                <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-500">Duration</p><p className="font-semibold text-gray-900">{c.durationMonths ? `${c.durationMonths} mo` : '—'}</p></div>
                <div className="bg-gray-50 rounded-lg p-2"><p className="text-gray-500">Capacity</p><p className="font-semibold text-gray-900">{c.maxStudents}</p></div>
              </div>
              <div className="mt-3"><span className={c.isActive ? 'badge-green' : 'badge-red'}>{c.isActive ? 'Active' : 'Inactive'}</span></div>
            </div>
          ))}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl my-4">
            <h3 className="font-bold text-gray-900 mb-4">{editing ? 'Edit Course' : 'Add New Course'}</h3>
            <div className="grid grid-cols-2 gap-3">
              {[['Course Name','name','text',true],['Category','category'],['Duration (months)','durationMonths','number'],['Max Students','maxStudents','number']].map(([label,key,type='text',full]) => (
                <div key={key as string} className={full ? 'col-span-2' : ''}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{label as string}</label>
                  <input type={type as string} value={(form as any)[key as string]}
                    onChange={e => setForm(p => ({ ...p, [key as string]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="training">Training</option><option value="school">School</option>
                </select>
              </div>
              {[['Admission Fee','admissionFee'],['Monthly Fee','monthlyFee'],['Exam Fee','examFee'],['Certificate Fee','certificateFee']].map(([label,key]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                  <input type="number" min={0} value={(form as any)[key]}
                    onChange={e => setForm(p => ({ ...p, [key]: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">Save Course</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
