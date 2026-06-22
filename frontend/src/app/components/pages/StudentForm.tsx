import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { studentsApi, coursesApi } from '../../services/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function StudentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: 'student123',
    phone: '', dateOfBirth: '', gender: '', address: '', city: '',
    cnic: '', admissionDate: new Date().toISOString().slice(0, 10),
    class: '', section: '', rollNumber: '',
    scholarshipType: 'none', scholarshipPercentage: 0,
    guardianName: '', guardianPhone: '', guardianRelationship: 'father',
    notes: ''
  });

  useEffect(() => {
    coursesApi.list({ isActive: true }).then(r => setCourses(r.data.data)).catch(() => {});
    if (isEdit) {
      setLoading(true);
      studentsApi.get(id!).then(r => {
        const s = r.data.data;
        setForm(prev => ({
          ...prev,
          firstName: s.firstName || '', lastName: s.lastName || '',
          phone: s.phone || '', dateOfBirth: s.dateOfBirth?.slice(0, 10) || '',
          gender: s.gender || '', address: s.address || '', city: s.city || '',
          cnic: s.cnic || '', admissionDate: s.admissionDate?.slice(0, 10) || '',
          class: s.class || '', section: s.section || '', rollNumber: s.rollNumber || '',
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

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || (!isEdit && !form.email)) {
      toast.error('First name, last name, and email are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        guardians: form.guardianName ? [{ name: form.guardianName, phone: form.guardianPhone, relationship: form.guardianRelationship }] : []
      };
      if (isEdit) await studentsApi.update(id!, payload);
      else await studentsApi.create(payload);
      toast.success(isEdit ? 'Student updated successfully' : 'Student enrolled successfully');
      navigate('/students');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save student');
    } finally { setSaving(false); }
  };

  const Field = ({ label, name, type = 'text', options, required }: any) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {options ? (
        <select value={(form as any)[name]} onChange={e => set(name, e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">Select {label}</option>
          {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type} value={(form as any)[name]} onChange={e => set(name, e.target.value)}
          required={required}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      )}
    </div>
  );

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100">
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
            <Field label="First Name" name="firstName" required />
            <Field label="Last Name" name="lastName" required />
            {!isEdit && <Field label="Email Address" name="email" type="email" required />}
            {!isEdit && <Field label="Password" name="password" type="password" />}
            <Field label="Phone" name="phone" type="tel" />
            <Field label="Date of Birth" name="dateOfBirth" type="date" />
            <Field label="Gender" name="gender" options={[{value:'male',label:'Male'},{value:'female',label:'Female'},{value:'other',label:'Other'}]} />
            <Field label="CNIC / B-Form" name="cnic" />
            <Field label="City" name="city" />
            <Field label="Admission Date" name="admissionDate" type="date" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </section>

        {/* Academic Info */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Academic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Class / Grade" name="class" />
            <Field label="Section" name="section" />
            <Field label="Roll Number" name="rollNumber" />
          </div>
        </section>

        {/* Scholarship */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Scholarship</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Scholarship Type" name="scholarshipType"
              options={[{value:'none',label:'None'},{value:'partial',label:'Partial'},{value:'full',label:'Full'}]} />
            {form.scholarshipType !== 'none' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Percentage (%)</label>
                <input type="number" min={0} max={100} value={form.scholarshipPercentage}
                  onChange={e => set('scholarshipPercentage', Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
          </div>
        </section>

        {/* Guardian */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Guardian Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Guardian Name" name="guardianName" />
            <Field label="Guardian Phone" name="guardianPhone" type="tel" />
            <Field label="Relationship" name="guardianRelationship"
              options={[{value:'father',label:'Father'},{value:'mother',label:'Mother'},{value:'guardian',label:'Guardian'}]} />
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)}
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
