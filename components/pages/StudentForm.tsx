'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { studentsApi } from '@/services/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

// School class list — mirrors seed data
const SCHOOL_CLASSES = [
  { value: 'Junior Grade', label: 'Junior Grade' },
  { value: 'Grade 9', label: 'Grade 9' },
  { value: 'Grade 10', label: 'Grade 10' },
  { value: 'Grade 11', label: 'Grade 11' },
  { value: 'Grade 12', label: 'Grade 12' },
  { value: 'Supplementary Students', label: 'Supplementary Students' },
];

// ✅ Field component defined OUTSIDE StudentForm so it never re-creates on every keystroke
interface FieldProps {
  label: string;
  name: string;
  type?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  value: string | number;
  onChange: (name: string, value: any) => void;
}

function Field({ label, name, type = 'text', options, required, value, onChange }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {options ? (
        <select
          value={value}
          onChange={e => onChange(name, e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Select {label}</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(name, e.target.value)}
          required={required}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}
    </div>
  );
}

const INITIAL_FORM = {
  firstName: '', lastName: '', email: '',
  phone: '', dateOfBirth: '', gender: '', address: '', city: '',
  cnic: '', admissionDate: new Date().toISOString().slice(0, 10),
  class: '', section: '', rollNumber: '',
  scholarshipType: 'none', scholarshipPercentage: 0,
  guardianName: '', guardianPhone: '', guardianRelationship: 'father',
  notes: ''
};

export default function StudentForm() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      studentsApi.get(id).then(r => {
        const s = r.data.data;
        const classValue = s.class && typeof s.class !== 'string' ? (s.class as any).name || String(s.class) : s.class || '';
        setForm(prev => ({
          ...prev,
          firstName: s.firstName || '', lastName: s.lastName || '',
          email: s.email || '',
          phone: s.phone || '', dateOfBirth: s.dateOfBirth?.slice(0, 10) || '',
          gender: s.gender || '', address: s.address || '', city: s.city || '',
          cnic: s.cnic || '', admissionDate: s.admissionDate?.slice(0, 10) || '',
          class: classValue, section: s.section || '', rollNumber: s.rollNumber || '',
          scholarshipType: s.scholarshipType || 'none',
          scholarshipPercentage: s.scholarshipPercentage || 0,
          guardianName: s.guardians?.[0]?.name || '',
          guardianPhone: s.guardians?.[0]?.phone || '',
          guardianRelationship: s.guardians?.[0]?.relationship || 'father',
          notes: s.notes || ''
        }));
      }).catch(() => toast.error('Failed to load student'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  // ✅ useCallback prevents handler recreation on each render
  const handleChange = useCallback((name: string, value: any) => {
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName) {
      toast.error('First name and last name are required');
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSaving(true);
    try {
      const { password, guardianName, guardianPhone, guardianRelationship, ...rest } = form;
      const payload = {
        ...rest,
        scholarshipPercentage: Number(form.scholarshipPercentage) || 0,
        guardians: guardianName
          ? [{ name: guardianName, phone: guardianPhone, relationship: guardianRelationship }]
          : []
      };
      if (!isEdit) {
        payload['password'] = password;
      }
      console.log('Student Enrollment Payload:', payload);
      if (isEdit && id) await studentsApi.update(id, payload);
      else await studentsApi.create(payload);
      toast.success(isEdit ? 'Student updated successfully' : 'Student enrolled successfully');
      router.push('/students');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Student' : 'Enroll New Student'}</h1>
          <p className="text-gray-500 text-sm">{isEdit ? 'Update student information' : 'Add a new student to the academy'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" name="firstName" required value={form.firstName} onChange={handleChange} />
            <Field label="Last Name" name="lastName" required value={form.lastName} onChange={handleChange} />
            <Field label="Email Address" name="email" type="email" value={form.email} onChange={handleChange} />
            <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
            <Field label="Date of Birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />
            <Field label="Gender" name="gender" value={form.gender} onChange={handleChange}
              options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} />
            <Field label="CNIC / B-Form" name="cnic" value={form.cnic} onChange={handleChange} />
            <Field label="City" name="city" value={form.city} onChange={handleChange} />
            <Field label="Admission Date" name="admissionDate" type="date" value={form.admissionDate} onChange={handleChange} />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={form.address}
              onChange={e => handleChange('address', e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </section>

        {/* Academic Info */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Academic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class / Grade</label>
              <select
                value={form.class}
                onChange={e => handleChange('class', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select class</option>
                {SCHOOL_CLASSES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <Field label="Section" name="section" value={form.section} onChange={handleChange} />
            <Field label="Roll Number" name="rollNumber" value={form.rollNumber} onChange={handleChange} />
          </div>
        </section>

        {/* Scholarship */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Scholarship</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Scholarship Type" name="scholarshipType" value={form.scholarshipType} onChange={handleChange}
              options={[{ value: 'none', label: 'None' }, { value: 'partial', label: 'Partial' }, { value: 'full', label: 'Full' }]} />
            {form.scholarshipType !== 'none' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Percentage (%)</label>
                <input type="number" min={0} max={100} value={form.scholarshipPercentage}
                  onChange={e => handleChange('scholarshipPercentage', Number(e.target.valueAsNumber || 0))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
          </div>
        </section>

        {/* Guardian */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Guardian Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Guardian Name" name="guardianName" value={form.guardianName} onChange={handleChange} />
            <Field label="Guardian Phone" name="guardianPhone" type="tel" value={form.guardianPhone} onChange={handleChange} />
            <Field label="Relationship" name="guardianRelationship" value={form.guardianRelationship} onChange={handleChange}
              options={[{ value: 'father', label: 'Father' }, { value: 'mother', label: 'Mother' }, { value: 'guardian', label: 'Guardian' }]} />
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
            {isEdit ? 'Update Student' : 'Enroll Student'}
          </button>
        </div>
      </form>
    </div>
  );
}
