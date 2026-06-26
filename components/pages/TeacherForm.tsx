'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { teachersApi } from '@/services/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

// Teacher schema fields (from User model with teacher profile fields):
// name (auto-built), firstName, lastName, email, password, phone,
// qualification, specialization, experience, gender, dateOfBirth,
// cnic, address, joiningDate, salaryType, fixedSalary,
// revenueSharePercentage, bankAccount, bankName, notes

const INITIAL_FORM = {
  firstName: '', lastName: '',
  email: '', password: 'teacher123',
  phone: '', qualification: '', specialization: '',
  experience: 0, gender: '',
  dateOfBirth: '', cnic: '', address: '',
  joiningDate: new Date().toISOString().slice(0, 10),
  salaryType: 'fixed', fixedSalary: 0,
  revenueSharePercentage: 0,
  bankName: '', bankAccount: '', notes: '',
};

function Field({ label, name, type = 'text', value, onChange, options, placeholder }: {
  label: string; name: string; type?: string; value: any;
  onChange: (n: string, v: any) => void;
  options?: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {options ? (
        <select value={value} onChange={e => onChange(name, e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Select {label}</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value} placeholder={placeholder}
          onChange={e => onChange(name, type === 'number' ? Number(e.target.value) : e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      )}
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
    if (!isEdit || !id) return;
    setLoading(true);
    teachersApi.get(id).then(r => {
      const t = r.data.data;
      setForm(prev => ({
        ...prev,
        firstName: t.firstName || (t.name?.split(' ')[0] ?? ''),
        lastName: t.lastName || (t.name?.split(' ').slice(1).join(' ') ?? ''),
        phone: t.phone || '', qualification: t.qualification || '',
        specialization: t.specialization || '', experience: t.experience || 0,
        gender: t.gender || '', dateOfBirth: t.dateOfBirth?.slice(0, 10) || '',
        cnic: t.cnic || '', address: t.address || '',
        joiningDate: t.joiningDate?.slice(0, 10) || '',
        salaryType: t.salaryType || 'fixed', fixedSalary: t.fixedSalary || 0,
        revenueSharePercentage: t.revenueSharePercentage || 0,
        bankName: t.bankName || '', bankAccount: t.bankAccount || '',
        notes: t.notes || '',
      }));
    }).catch(() => toast.error('Failed to load teacher')).finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName) { toast.error('First name is required'); return; }
    if (!isEdit && !form.email) { toast.error('Email is required'); return; }

    setSaving(true);
    try {
      // Build payload matching User model with teacher fields
      const payload: any = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        // `name` is auto-built by the API from firstName + lastName
        phone: form.phone || undefined,
        qualification: form.qualification || undefined,
        specialization: form.specialization || undefined,
        experience: Number(form.experience) || 0,
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        cnic: form.cnic || undefined,
        address: form.address || undefined,
        joiningDate: form.joiningDate || undefined,
        salaryType: form.salaryType || 'fixed',
        fixedSalary: Number(form.fixedSalary) || 0,
        revenueSharePercentage: Number(form.revenueSharePercentage) || 0,
        bankName: form.bankName || undefined,
        bankAccount: form.bankAccount || undefined,
        notes: form.notes || undefined,
      };

      if (!isEdit) {
        payload.email = form.email.trim().toLowerCase();
        payload.password = form.password || 'teacher123';
      }

      if (isEdit && id) await teachersApi.update(id, payload);
      else await teachersApi.create(payload);

      toast.success(isEdit ? 'Teacher updated successfully' : 'Teacher added successfully');
      router.push('/teachers');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save teacher');
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
        {/* Personal Info */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" name="firstName" value={form.firstName} onChange={handleChange} />
            <Field label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} />
            {!isEdit && <Field label="Email" name="email" type="email" value={form.email} onChange={handleChange} />}
            {!isEdit && <Field label="Password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Default: teacher123" />}
            <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
            <Field label="CNIC" name="cnic" value={form.cnic} onChange={handleChange} placeholder="35201-1234567-1" />
            <Field label="Gender" name="gender" value={form.gender} onChange={handleChange}
              options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} />
            <Field label="Date of Birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />
            <Field label="Joining Date" name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} />
            <Field label="Address" name="address" value={form.address} onChange={handleChange} />
          </div>
        </section>

        {/* Qualification */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Qualification</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Qualification" name="qualification" value={form.qualification} onChange={handleChange} placeholder="e.g. MSc Mathematics" />
            <Field label="Specialization" name="specialization" value={form.specialization} onChange={handleChange} placeholder="e.g. Physics" />
            <Field label="Experience (years)" name="experience" type="number" value={form.experience} onChange={handleChange} />
          </div>
        </section>

        {/* Salary */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Salary Configuration</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Salary Type" name="salaryType" value={form.salaryType} onChange={handleChange}
              options={[{ value: 'fixed', label: 'Fixed Salary' }, { value: 'revenue_share', label: 'Revenue Sharing' }]} />
            {form.salaryType === 'fixed'
              ? <Field label="Fixed Monthly Salary (PKR)" name="fixedSalary" type="number" value={form.fixedSalary} onChange={handleChange} />
              : <Field label="Revenue Share (%)" name="revenueSharePercentage" type="number" value={form.revenueSharePercentage} onChange={handleChange} />
            }
            <Field label="Bank Name" name="bankName" value={form.bankName} onChange={handleChange} />
            <Field label="Bank Account Number" name="bankAccount" value={form.bankAccount} onChange={handleChange} />
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
