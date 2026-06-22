import { useState, useEffect, useCallback } from 'react';
import { salaryApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Banknote, TrendingUp, Loader2, Play, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Salary() {
  const { hasPermission } = useAuth();
  const [salaries, setSalaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showProcess, setShowProcess] = useState(false);
  const [processMonth, setProcessMonth] = useState(month);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await salaryApi.list({ month });
      setSalaries(data.data);
    } catch { toast.error('Failed to load salaries'); }
    finally { setLoading(false); }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const { data } = await salaryApi.calculate({ month: processMonth });
      toast.success(`Salary calculated for ${data.data.length} teachers`);
      setShowProcess(false);
      load();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to process salary'); }
    finally { setProcessing(false); }
  };

  const handlePay = async (id: string) => {
    if (!confirm('Mark this salary as paid?')) return;
    try {
      await salaryApi.pay(id, { paymentMethod: 'bank_transfer' });
      toast.success('Salary paid successfully');
      load();
    } catch { toast.error('Failed to mark as paid'); }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salary Management</h1>
          <p className="text-gray-500 text-sm">Fixed & revenue-sharing teacher payroll</p>
        </div>
        <div className="flex gap-3">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {hasPermission('salary', 'create') && (
            <button onClick={() => setShowProcess(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
              <Play className="w-4 h-4" /> Process Salary
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : salaries.length === 0 ? (
          <div className="text-center py-16">
            <Banknote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No salary records for {month}</p>
            <p className="text-gray-400 text-sm mt-1">Click "Process Salary" to calculate</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr>
                <th>Teacher</th><th>Type</th><th>Gross</th><th>Deductions</th>
                <th>Net Salary</th><th>Status</th><th className="text-right">Action</th>
              </tr></thead>
              <tbody>
                {salaries.map((s: any) => (
                  <tr key={s._id}>
                    <td>
                      <div>
                        <p className="font-medium text-gray-900">{s.teacher?.firstName} {s.teacher?.lastName}</p>
                        <p className="text-xs text-gray-400">{s.teacher?.teacherId}</p>
                      </div>
                    </td>
                    <td>
                      {s.salaryType === 'fixed' ? (
                        <span className="flex items-center gap-1 text-sm text-gray-600"><Banknote className="w-3.5 h-3.5 text-green-600" /> Fixed</span>
                      ) : (
                        <div>
                          <span className="flex items-center gap-1 text-sm text-gray-600"><TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Revenue {s.revenueSharePercentage}%</span>
                          <p className="text-xs text-gray-400">Fees: PKR {s.totalFeesCollected?.toLocaleString()}</p>
                        </div>
                      )}
                    </td>
                    <td className="font-medium text-gray-900">PKR {s.grossSalary?.toLocaleString()}</td>
                    <td className="text-red-500 text-sm">
                      {s.deductions > 0 ? `−PKR ${s.deductions?.toLocaleString()}` : '—'}
                      {s.absenceDeduction > 0 && <div className="text-xs text-gray-400">Absence: PKR {s.absenceDeduction?.toLocaleString()}</div>}
                    </td>
                    <td className="font-bold text-gray-900 text-base">PKR {s.netSalary?.toLocaleString()}</td>
                    <td><span className={s.status === 'paid' ? 'badge-green' : s.status === 'processed' ? 'badge-blue' : 'badge-yellow'}>{s.status}</span></td>
                    <td className="text-right">
                      {s.status !== 'paid' && hasPermission('salary', 'edit') && (
                        <button onClick={() => handlePay(s._id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition font-medium">
                          Mark Paid
                        </button>
                      )}
                      {s.status === 'paid' && <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Process Modal */}
      {showProcess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowProcess(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-2">Process Salary</h3>
            <p className="text-sm text-gray-500 mb-4">Calculate salaries for all active teachers. Fixed salary teachers will have attendance-based deductions applied.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <input type="month" value={processMonth} onChange={e => setProcessMonth(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="bg-blue-50 rounded-xl p-3 mt-4 text-sm text-blue-700">
              ℹ️ Revenue-sharing teachers: earnings calculated from fees collected in {processMonth} for their courses.
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowProcess(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleProcess} disabled={processing}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition flex items-center justify-center gap-2">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {processing ? 'Processing...' : 'Calculate Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
