'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { studentsApi, classesApi, sessionsApi } from '@/services/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

// ── Reusable field components ──────────────────────────────────────────────────
interface FieldProps {
  label: string; name: string; type?: string; required?: boolean;
  value: string | number; onChange: (n: string, v: any) => void;
  options?: { value: string; label: string }[];
  placeholder?: string;
}
function Field({ label, name, type = 'text', required, value, onChange, options, placeholder }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {options ? (
        <select value={value} onChange={e => onChange(name, e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">Select {label}</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={value} placeholder={placeholder}
          onChange={e => onChange(name, e.target.value)} required={required}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      )}
    </div>
  );
}

const INITIAL_FORM = {
  // Personal Info (shown on form)
  firstName: '', lastName: '', email: '', password: 'student123',
  phone: '', dateOfBirth: '', gender: '',
  cnic: '', address: '', city: '',
  admissionDate: new Date().toISOString().slice(0, 10),
  // Academic Info (shown on form)
  classId: '',      // user picks a Class from dropdown → sent as `class` ObjectId
  sessionId: '',    // user picks a Session/Batch from dropdown → added to enrollments
  section: '', rollNumber: '',
  // Scholarship
  scholarshipType: 'none', scholarshipPercentage: 0,
  // Guardian
  guardianName: '', guardianPhone: '', guardianRelationship: 'father',
  // Notes
  notes: '',
};

export default function StudentForm() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [form, setForm] = useState(INITIAL_FORM);

  // Load classes and sessions for dropdowns
  useEffect(() => {
    classesApi.list({ isActive: true }).then(r => setClasses(r.data.data || [])).catch(() => {});
    sessionsApi.list({ isActive: true }).then(r => setSessions(r.data.data || [])).catch(() => {});
  }, []);

  // Filter sessions by selected class
  const filteredSessions = form.classId
    ? sessions.filter(s => s.class && (s.class._id === form.classId || s.class === form.classId))
    : sessions;

  // Load existing student for edit
  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    studentsApi.get(id).then(r => {
      const s = r.data.data;
      const classId = s.class?._id || s.class || '';
      const sessionId = s.enrollments?.[0]?.batch?._id || s.enrollments?.[0]?.batch || '';
      setForm(prev => ({
        ...prev,
        firstName: s.firstName || '', lastName: s.lastName || '',
        phone: s.phone || '', dateOfBirth: s.dateOfBirth?.slice(0, 10) || '',
        gender: s.gender || '', cnic: s.cnic || '',
        address: s.address || '', city: s.city || '',
        admissionDate: s.admissionDate?.slice(0, 10) || '',
        classId, sessionId, section: s.section || '', rollNumber: s.rollNumber || '',
        scholarshipType: s.scholarshipType || 'none',
        scholarshipPercentage: s.scholarshipPercentage || 0,
        guardianName: s.guardians?.[0]?.name || '',
        guardianPhone: s.guardians?.[0]?.phone || '',
        guardianRelationship: s.guardians?.[0]?.relationship || 'father',
        notes: s.notes || '',
      }));
    }).catch(() => toast.error('Failed to load student')).finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = useCallback((name: string, value: any) => {
    setForm(prev => {
      const next = { ...prev, [name]: value };
      // When class changes, reset session selection
      if (name === 'classId') next.sessionId = '';
      return next;
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = form.email?.trim();
    if (!form.firstName) { toast.error('First name is required'); return; }
    if (!isEdit && !email) { toast.error('Email is required'); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Email format is invalid');
      return;
    }

    setSaving(true);
    try {
      // Build the payload that matches the Student schema exactly:
      // - `class` = ObjectId of selected class (backend auto-resolves name too)
      // - `enrollments` = array with batch ObjectId
      // - `userId`, `studentId`, `branch` → auto-generated by backend
      const payload: any = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: email || undefined,
        password: form.password || 'student123',
        phone: form.phone || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        cnic: form.cnic || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        admissionDate: form.admissionDate,
        section: form.section || undefined,
        rollNumber: form.rollNumber || undefined,
        scholarshipType: form.scholarshipType || 'none',
        scholarshipPercentage: Number(form.scholarshipPercentage) || 0,
        notes: form.notes || undefined,
        guardians: form.guardianName
          ? [{ name: form.guardianName, phone: form.guardianPhone, relationship: form.guardianRelationship }]
          : [],
      };

      // Send classId as `class` (ObjectId)
      if (form.classId) payload.class = form.classId;

      // Build enrollments array if a session was selected
      if (form.sessionId) {
        payload.enrollments = [{
          batch: form.sessionId,
          status: 'enrolled',
          enrollDate: new Date().toISOString(),
        }];
      }

      if (isEdit && id) await studentsApi.update(id, payload);
      else await studentsApi.create(payload);

      toast.success(isEdit ? 'Student updated successfully' : 'Student enrolled successfully');
      router.push('/students');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save student');
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
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Student' : 'Enroll New Student'}</h1>
          <p className="text-gray-500 text-sm">{isEdit ? 'Update student information' : 'Register a new student in the academy'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" name="firstName" required value={form.firstName} onChange={handleChange} />
            <Field label="Last Name" name="lastName" value={form.lastName} onChange={handleChange} />
            {!isEdit && <Field label="Email Address" name="email" type="email" required value={form.email} onChange={handleChange} />}
            {!isEdit && <Field label="Password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Default: student123" />}
            <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
            <Field label="Date of Birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />
            <Field label="Gender" name="gender" value={form.gender} onChange={handleChange}
              options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }]} />
            <Field label="CNIC / B-Form" name="cnic" value={form.cnic} onChange={handleChange} placeholder="e.g. 35201-1234567-1" />
            <Field label="City" name="city" value={form.city} onChange={handleChange} />
            <Field label="Admission Date" name="admissionDate" type="date" value={form.admissionDate} onChange={handleChange} />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea value={form.address} onChange={e => handleChange('address', e.target.value)} rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </section>

        {/* Academic Info */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Academic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class / Grade</label>
              <select value={form.classId} onChange={e => handleChange('classId', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session / Year</label>
              <select value={form.sessionId} onChange={e => handleChange('sessionId', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Session</option>
                {filteredSessions.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <Field label="Section" name="section" value={form.section} onChange={handleChange} placeholder="e.g. A, B, C" />
            <Field label="Roll Number" name="rollNumber" value={form.rollNumber} onChange={handleChange} placeholder="e.g. 001" />
          </div>
        </section>

        {/* Scholarship */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Scholarship (Optional)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Scholarship Type" name="scholarshipType" value={form.scholarshipType} onChange={handleChange}
              options={[{ value: 'none', label: 'None' }, { value: 'partial', label: 'Partial' }, { value: 'full', label: 'Full' }]} />
            {form.scholarshipType !== 'none' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship %</label>
                <input type="number" min={0} max={100} value={form.scholarshipPercentage}
                  onChange={e => handleChange('scholarshipPercentage', Number(e.target.value))}
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

        {/* Notes */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Notes (Optional)</h3>
          <textarea value={form.notes} onChange={e => handleChange('notes', e.target.value)} rows={3} placeholder="Any additional information..."
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
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
