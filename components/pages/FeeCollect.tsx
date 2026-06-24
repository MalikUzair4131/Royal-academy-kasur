'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { feesApi, studentsApi, coursesApi } from '@/services/api';
import { toast } from 'sonner';
import { ArrowLeft, Save, Loader2, AlertTriangle, Phone } from 'lucide-react';
import { format } from 'date-fns';

// ─── Fee Collection Form ──────────────────────────────────────────────────────
export function FeeCollect() {
  const router = useRouter();
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    student: '', course: '', feeType: 'monthly', month: new Date().toISOString().slice(0, 7),
    originalAmount: 0, discountPercentage: 0, dueDate: new Date().toISOString().slice(0, 10),
    description: '', notes: ''
  });

  useEffect(() => {
    studentsApi.list({ isActive: true, limit: 200 }).then(r => setStudents(r.data.data)).catch(() => {});
    coursesApi.list({ isActive: true }).then(r => setCourses(r.data.data)).catch(() => {});
  }, []);

  // Auto-fill amount from course fee type
  useEffect(() => {
    if (!form.course || !form.feeType) return;
    const course = courses.find(c => c._id === form.course);
    if (!course) return;
    const amounts: Record<string, number> = {
      admission: course.admissionFee || 0, monthly: course.monthlyFee || 0,
      exam: course.examFee || 0, certificate: course.certificateFee || 0,
    };
    if (amounts[form.feeType]) setForm(p => ({ ...p, originalAmount: amounts[form.feeType] }));
  }, [form.course, form.feeType, courses]);

  const net = Math.max(0, form.originalAmount - (form.originalAmount * form.discountPercentage / 100));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student || !form.originalAmount) { toast.error('Student and amount are required'); return; }
    setSaving(true);
    try {
      await feesApi.create({ ...form, netAmount: net });
      toast.success('Fee record created successfully');
      router.push('/fees');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to create fee'); }
    finally { setSaving(false); }
  };

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push(-1)} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Fee Record</h1>
          <p className="text-gray-500 text-sm">Generate a new fee for a student</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">Fee Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
              <select value={form.student} onChange={e => set('student', e.target.value)} required
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select student</option>
                {students.map(s => <option key={s._id} value={s._id}>{s.firstName} {s.lastName} — {s.studentId}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select value={form.course} onChange={e => set('course', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select course</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type *</label>
              <select value={form.feeType} onChange={e => set('feeType', e.target.value)} required
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {[['admission','Admission Fee'],['monthly','Monthly Fee'],['exam','Exam Fee'],['certificate','Certificate Fee'],['custom','Custom Fee']].map(([v,l]) =>
                  <option key={v} value={v}>{l}</option>
                )}
              </select>
            </div>
            {form.feeType === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <input type="month" value={form.month} onChange={e => set('month', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR) *</label>
              <input type="number" min={0} value={form.originalAmount} onChange={e => set('originalAmount', Number(e.target.value))} required
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
              <input type="number" min={0} max={100} value={form.discountPercentage} onChange={e => set('discountPercentage', Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
              <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} required
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" value={form.description} onChange={e => set('description', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Net Amount Preview */}
          {form.originalAmount > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm">
              <div className="flex justify-between mb-1 text-gray-600"><span>Original Amount</span><span>PKR {form.originalAmount.toLocaleString()}</span></div>
              {form.discountPercentage > 0 && <div className="flex justify-between mb-1 text-red-600"><span>Discount ({form.discountPercentage}%)</span><span>− PKR {(form.originalAmount * form.discountPercentage / 100).toLocaleString()}</span></div>}
              <div className="flex justify-between font-bold text-blue-900 border-t border-blue-200 pt-2 mt-2"><span>Net Payable</span><span>PKR {net.toLocaleString()}</span></div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.push(-1)} className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition shadow-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Create Fee Record
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Overdue Fees List ────────────────────────────────────────────────────────
export function OverdueFees() {
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feesApi.overdueList().then(r => setFees(r.data.data)).catch(() => toast.error('Failed to load overdue fees')).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Overdue Fees</h1>
          <p className="text-gray-500 text-sm">{fees.length} overdue records require attention</p>
        </div>
      </div>

      {fees.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">
            <strong>{fees.length} students</strong> have overdue payments. Contact them immediately or send reminders.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : fees.length === 0 ? (
          <div className="text-center py-16">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No overdue fees 🎉</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr>
                <th>Student</th><th>Receipt</th><th>Fee Type</th><th>Balance</th><th>Due Date</th><th>Overdue By</th><th>Contact</th>
              </tr></thead>
              <tbody>
                {fees.map((f: any) => (
                  <tr key={f._id} className="bg-red-50/20">
                    <td>
                      <div>
                        <p className="font-medium text-gray-900">{f.student?.firstName} {f.student?.lastName}</p>
                        <p className="text-xs text-gray-400">{f.student?.studentId}</p>
                      </div>
                    </td>
                    <td className="font-mono text-xs text-gray-600">{f.receiptNo}</td>
                    <td className="capitalize"><span className="badge-gray">{f.feeType.replace('_',' ')}</span></td>
                    <td className="font-bold text-red-600">PKR {(f.netAmount - f.paidAmount).toLocaleString()}</td>
                    <td className="text-sm text-gray-500">{format(new Date(f.dueDate), 'MMM d, yyyy')}</td>
                    <td><span className="badge-red">{f.overduedays} days</span></td>
                    <td>
                      {f.student?.guardians?.[0]?.phone && (
                        <a href={`tel:${f.student.guardians[0].phone}`} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700">
                          <Phone className="w-3 h-3" />{f.student.guardians[0].phone}
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
