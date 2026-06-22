import { useState, useEffect, useCallback } from 'react';
import { feesApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Search, CreditCard, AlertTriangle, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Fee {
  _id: string; receiptNo: string; feeType: string; month?: string;
  netAmount: number; paidAmount: number; status: string;
  dueDate: string; isOverdue: boolean; overduedays: number;
  student?: { firstName: string; lastName: string; studentId: string };
  course?: { name: string };
}

const STATUS_STYLE: Record<string, string> = {
  paid: 'badge-green', partial: 'badge-yellow', pending: 'badge-gray',
  overdue: 'badge-red', waived: 'badge-blue', cancelled: 'badge-gray'
};
const STATUS_ICON: Record<string, React.ReactNode> = {
  paid: <CheckCircle2 className="w-3.5 h-3.5" />,
  partial: <Clock className="w-3.5 h-3.5" />,
  overdue: <AlertTriangle className="w-3.5 h-3.5" />,
  pending: <Clock className="w-3.5 h-3.5" />,
};

export default function Fees() {
  const { hasPermission } = useAuth();
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showPayModal, setShowPayModal] = useState<Fee | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await feesApi.list({ page, limit, status: statusFilter || undefined });
      setFees(data.data); setTotal(data.total); setStats(data.stats || {});
    } catch { toast.error('Failed to load fees'); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handlePayment = async () => {
    if (!showPayModal || !payAmount) return;
    try {
      await feesApi.addPayment(showPayModal._id, { amount: Number(payAmount), method: payMethod });
      toast.success('Payment recorded successfully');
      setShowPayModal(null); setPayAmount('');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment failed');
    }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fees & Payments</h1>
          <p className="text-gray-500 text-sm">{total} fee records</p>
        </div>
        {hasPermission('fees', 'create') && (
          <a href="/fees/collect" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
            <Plus className="w-4 h-4" /> Record Fee
          </a>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Due', value: stats.totalDue, icon: <CreditCard className="w-4 h-4 text-gray-600" />, color: 'bg-gray-100' },
          { label: 'Collected', value: stats.totalCollected, icon: <CheckCircle2 className="w-4 h-4 text-green-600" />, color: 'bg-green-100' },
          { label: 'Pending', value: stats.totalPending, icon: <Clock className="w-4 h-4 text-amber-600" />, color: 'bg-amber-100' },
          { label: 'Overdue Records', value: stats.overdueCount, icon: <AlertTriangle className="w-4 h-4 text-red-600" />, color: 'bg-red-100' },
        ].map(card => (
          <div key={card.label} className="stat-card">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${card.color} flex items-center justify-center`}>{card.icon}</div>
              <div>
                <p className="text-xs text-gray-500">{card.label}</p>
                <p className="font-bold text-gray-900 text-sm">
                  {typeof card.value === 'number' && card.label !== 'Overdue Records'
                    ? `PKR ${card.value?.toLocaleString()}`
                    : card.value ?? 0}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Status</option>
          <option value="pending">Pending</option><option value="partial">Partial</option>
          <option value="paid">Paid</option><option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : fees.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No fee records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr>
                <th>Receipt</th><th>Student</th><th>Type</th><th>Amount</th>
                <th>Paid</th><th>Balance</th><th>Due Date</th><th>Status</th>
                {hasPermission('fees', 'edit') && <th className="text-right">Action</th>}
              </tr></thead>
              <tbody>
                {fees.map(f => {
                  const balance = f.netAmount - f.paidAmount;
                  return (
                    <tr key={f._id} className={f.isOverdue && f.status !== 'paid' ? 'bg-red-50/30' : ''}>
                      <td><span className="font-mono text-xs text-gray-600">{f.receiptNo}</span></td>
                      <td>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{f.student?.firstName} {f.student?.lastName}</p>
                          <p className="text-xs text-gray-400">{f.student?.studentId}</p>
                        </div>
                      </td>
                      <td><span className="capitalize badge-gray">{f.feeType.replace('_', ' ')}</span></td>
                      <td className="font-semibold text-gray-900">PKR {f.netAmount.toLocaleString()}</td>
                      <td className="text-green-600 font-medium">PKR {f.paidAmount.toLocaleString()}</td>
                      <td className={balance > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>
                        {balance > 0 ? `PKR ${balance.toLocaleString()}` : '—'}
                      </td>
                      <td className="text-sm text-gray-500">
                        {format(new Date(f.dueDate), 'MMM d, yyyy')}
                        {f.isOverdue && f.status !== 'paid' && <div className="text-xs text-red-500">{f.overduedays}d overdue</div>}
                      </td>
                      <td>
                        <span className={`${STATUS_STYLE[f.status] || 'badge-gray'} flex items-center gap-1 w-fit`}>
                          {STATUS_ICON[f.status]}{f.status}
                        </span>
                      </td>
                      {hasPermission('fees', 'edit') && (
                        <td className="text-right">
                          {f.status !== 'paid' && (
                            <button onClick={() => { setShowPayModal(f); setPayAmount(String(f.netAmount - f.paidAmount)); }}
                              className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition font-medium">
                              Pay
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {total > limit && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">Showing {(page-1)*limit+1}–{Math.min(page*limit,total)} of {total}</p>
            <div className="flex gap-2">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)} className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
              <button disabled={page*limit>=total} onClick={() => setPage(p=>p+1)} className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPayModal(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-1">Record Payment</h3>
            <p className="text-sm text-gray-500 mb-4">Receipt: {showPayModal.receiptNo}</p>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Total Amount</span><span className="font-semibold">PKR {showPayModal.netAmount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Paid</span><span className="text-green-600">PKR {showPayModal.paidAmount.toLocaleString()}</span></div>
              <div className="flex justify-between border-t pt-1 mt-1"><span className="font-semibold">Balance</span><span className="text-red-600 font-bold">PKR {(showPayModal.netAmount - showPayModal.paidAmount).toLocaleString()}</span></div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (PKR)</label>
                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} min={1} max={showPayModal.netAmount - showPayModal.paidAmount}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option><option value="online">Online</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowPayModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handlePayment} className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition">Confirm Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
