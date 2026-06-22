import { useState, useEffect } from 'react';
import { reportsApi } from '../../services/api';
import { DollarSign, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'sonner';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Reports() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [pl, setPl] = useState<any>(null);
  const [feeData, setFeeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      reportsApi.profitLoss({ month }),
      reportsApi.feeCollection({ from: `${month}-01`, to: `${month}-31` }),
    ]).then(([plRes, feeRes]) => {
      setPl(plRes.data.data);
      setFeeData(feeRes.data.data);
    }).catch(() => toast.error('Failed to load reports'))
    .finally(() => setLoading(false));
  }, [month]);

  const pieData = feeData.map(d => ({
    name: d._id?.replace('_', ' ') || 'Other',
    value: d.collected || 0,
  })).filter(d => d.value > 0);

  const barData = feeData.map(d => ({
    type: (d._id || 'other').replace('_', ' '),
    due: d.due || 0,
    collected: d.collected || 0,
    pending: d.pending || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm">Financial overview and performance metrics</p>
        </div>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <>
          {/* P&L Summary */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="stat-card border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">PKR {(pl?.revenue || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Fees collected in {month}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="stat-card border-l-4 border-l-red-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Salary Expenses</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">PKR {(pl?.salaryExpense || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Teacher salaries paid</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
                  <ArrowDownRight className="w-5 h-5 text-red-500" />
                </div>
              </div>
            </div>
            <div className={`stat-card border-l-4 ${(pl?.profit || 0) >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Net Profit</p>
                  <p className={`text-2xl font-bold mt-1 ${(pl?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    PKR {(pl?.profit || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Margin: {pl?.profitMargin || 0}%</p>
                </div>
                <div className={`w-11 h-11 rounded-xl ${(pl?.profit || 0) >= 0 ? 'bg-green-50' : 'bg-red-50'} flex items-center justify-center`}>
                  {(pl?.profit || 0) >= 0
                    ? <ArrowUpRight className="w-5 h-5 text-green-600" />
                    : <ArrowDownRight className="w-5 h-5 text-red-500" />}
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Fee Collection by Type - Bar */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-5">Fee Collection by Type</h3>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={barData} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => `PKR ${v.toLocaleString()}`} />
                    <Bar dataKey="collected" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Collected" />
                    <Bar dataKey="pending" fill="#fbbf24" radius={[4, 4, 0, 0]} name="Pending" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">No fee data for {month}</div>
              )}
            </div>

            {/* Revenue Split Pie */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-5">Revenue Split by Fee Type</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                      paddingAngle={3} dataKey="value">
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `PKR ${v.toLocaleString()}`} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">No revenue data for {month}</div>
              )}
            </div>
          </div>

          {/* Fee Collection Table */}
          {feeData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Fee Collection Detail</h3>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Fee Type</th>
                      <th className="text-right">Records</th>
                      <th className="text-right">Total Due</th>
                      <th className="text-right">Collected</th>
                      <th className="text-right">Pending</th>
                      <th className="text-right">Collection %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeData.map((row: any) => {
                      const pct = row.due > 0 ? Math.round((row.collected / row.due) * 100) : 0;
                      return (
                        <tr key={row._id}>
                          <td className="capitalize font-medium text-gray-900">{(row._id || 'other').replace('_', ' ')}</td>
                          <td className="text-right text-gray-600">{row.count}</td>
                          <td className="text-right text-gray-900">PKR {(row.due || 0).toLocaleString()}</td>
                          <td className="text-right text-green-600 font-semibold">PKR {(row.collected || 0).toLocaleString()}</td>
                          <td className="text-right text-amber-600">PKR {(row.pending || 0).toLocaleString()}</td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className={`text-sm font-semibold ${pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
