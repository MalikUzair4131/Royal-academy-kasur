'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { teachersApi } from '@/services/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function TeacherForm() {
  const params = useParams(); const id = params?.id as string;
  const router = useRouter();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: 'teacher123',
    phone: '', qualification: '', specialization: '', experience: 0,
    gender: '', dateOfBirth: '', cnic: '', address: '',
    joiningDate: new Date().toISOString().slice(0, 10),
    salaryType: 'fixed', fixedSalary: 0, revenueSharePercentage: 0,
    bankAccount: '', bankName: '', notes: ''
  });

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      teachersApi.get(id!).then(r => {
        const t = r.data.data;
        setForm(prev => ({
          ...prev, firstName: t.firstName, lastName: t.lastName,
          phone: t.phone||'', qualification: t.qualification||'',
          specialization: t.specialization||'', experience: t.experience||0,
          gender: t.gender||'', dateOfBirth: t.dateOfBirth?.slice(0,10)||'',
          cnic: t.cnic||'', address: t.address||'',
          joiningDate: t.joiningDate?.slice(0,10)||'',
          salaryType: t.salaryType, fixedSalary: t.fixedSalary||0,
          revenueSharePercentage: t.revenueSharePercentage||0,
          bankAccount: t.bankAccount||'', bankName: t.bankName||'', notes: t.notes||''
        }));
      }).catch(() => toast.error('Failed to load teacher')).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) await teachersApi.update(id!, form);
      else await teachersApi.create(form);
      toast.success(isEdit ? 'Teacher updated' : 'Teacher added successfully');
      router.push('/teachers');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push(-1)} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Teacher' : 'Add New Teacher'}</h1>
          <p className="text-gray-500 text-sm">Manage teacher information and salary settings</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[['First Name','firstName'],['Last Name','lastName'],['Phone','phone'],['Qualification','qualification'],
              ['Specialization','specialization'],['Experience (years)','experience','number'],
              ['CNIC','cnic'],['City / Address','address'],
              ['Joining Date','joiningDate','date'],
              ...(!isEdit ? [['Email','email','email'],['Password','password','password']] : [])
            ].map(([label,name,type='text']) => (
              <div key={name as string}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label as string}</label>
                <input type={type as string} value={(form as any)[name as string]}
                  onChange={e => set(name as string, type === 'number' ? Number(e.target.value) : e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select value={form.gender} onChange={e => set('gender', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select</option>
                <option value="male">Male</option><option value="female">Female</option>
              </select>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Salary Configuration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary Type</label>
              <select value={form.salaryType} onChange={e => set('salaryType', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="fixed">Fixed Salary</option>
                <option value="revenue_share">Revenue Sharing</option>
              </select>
            </div>
            {form.salaryType === 'fixed' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fixed Monthly Salary (PKR)</label>
                <input type="number" min={0} value={form.fixedSalary} onChange={e => set('fixedSalary', Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Revenue Share (%)</label>
                <input type="number" min={0} max={100} value={form.revenueSharePercentage}
                  onChange={e => set('revenueSharePercentage', Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-500 mt-1">Teacher receives {form.revenueSharePercentage}% of collected fees from their courses</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
              <input type="text" value={form.bankName} onChange={e => set('bankName', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
              <input type="text" value={form.bankAccount} onChange={e => set('bankAccount', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.push(-1)} className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Update Teacher' : 'Add Teacher'}
          </button>
        </div>
      </form>
    </div>
  );
}
