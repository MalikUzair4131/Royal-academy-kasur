'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { teachersApi } from '@/services/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

const INITIAL_FORM = {
  firstName: '', lastName: '', email: '', password: 'teacher123',
  phone: '', qualification: '', specialization: '', experience: 0,
  gender: '', dateOfBirth: '', cnic: '', address: '',
  joiningDate: new Date().toISOString().slice(0, 10),
  salaryType: 'fixed', fixedSalary: 0, revenueSharePercentage: 0,
  bankAccount: '', bankName: '', notes: ''
};

function TextField({ label, name, type = 'text', value, onChange }: {
  label: string; name: string; type?: string; value: any;
  onChange: (name: string, value: any) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(name, type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

export default function TeacherForm() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const handleChange = useCallback((name: string, value: any) => {
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      teachersApi.get(id).then(r => {
        const t = r.data.data;
        setForm(prev => ({
          ...prev,
          firstName: t.firstName || '', lastName: t.lastName || '',
          phone: t.phone || '', qualification: t.qualification || '',
          specialization: t.specialization || '', experience: t.experience || 0,
          gender: t.gender || '', dateOfBirth: t.dateOfBirth?.slice(0, 10) || '',
          cnic: t.cnic || '', address: t.address || '',
          joiningDate: t.joiningDate?.slice(0, 10) || '',
          salaryType: t.salaryType || 'fixed', fixedSalary: t.fixedSalary || 0,
          revenueSharePercentage: t.revenueSharePercentage || 0,
          bankAccount: t.bankAccount || '', bankName: t.bankName || '', notes: t.notes || ''
        }));
      }).catch(() => toast.error('Failed to load teacher')).finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || (!isEdit && !form.email)) {
      toast.error('First name, last name, and email are required');
      return;
    }
    setSaving(true);
    try {
      if (isEdit && id) await teachersApi.update(id, form);
      else await teachersApi.create(form);
      toast.success(isEdit ? 'Teacher updated' : 'Teacher added successfully');
      router.push('/teachers');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Teacher' : 'Add New Teacher'}</h1>
          <p className="text-gray-500 text-sm">Manage teacher information and salary settings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField label="First Name" name="firstName" value={form.firstName} onChange={handleChange} />
            <TextField label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} />
            {!isEdit && <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} />}
            {!isEdit && <TextField label="Password" name="password" type="password" value={form.password} onChange={handleChange} />}
            <TextField label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
            <TextField label="Qualification" name="qualification" value={form.qualification} onChange={handleChange} />
            <TextField label="Specialization" name="specialization" value={form.specialization} onChange={handleChange} />
            <TextField label="Experience (years)" name="experience" type="number" value={form.experience} onChange={handleChange} />
            <TextField label="CNIC" name="cnic" value={form.cnic} onChange={handleChange} />
            <TextField label="Address" name="address" value={form.address} onChange={handleChange} />
            <TextField label="Joining Date" name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select value={form.gender} onChange={e => handleChange('gender', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Salary Configuration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salary Type</label>
              <select value={form.salaryType} onChange={e => handleChange('salaryType', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="fixed">Fixed Salary</option>
                <option value="revenue_share">Revenue Sharing</option>
              </select>
            </div>
            {form.salaryType === 'fixed' ? (
              <TextField label="Fixed Monthly Salary (PKR)" name="fixedSalary" type="number" value={form.fixedSalary} onChange={handleChange} />
            ) : (
              <div>
                <TextField label="Revenue Share (%)" name="revenueSharePercentage" type="number" value={form.revenueSharePercentage} onChange={handleChange} />
                <p className="text-xs text-gray-500 mt-1">Teacher receives {form.revenueSharePercentage}% of collected fees</p>
              </div>
            )}
            <TextField label="Bank Name" name="bankName" value={form.bankName} onChange={handleChange} />
            <TextField label="Bank Account" name="bankAccount" value={form.bankAccount} onChange={handleChange} />
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Update Teacher' : 'Add Teacher'}
          </button>
        </div>
      </form>
    </div>
  );
}
