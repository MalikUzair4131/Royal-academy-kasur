'use client';
import { useEffect, useState } from 'react';
import { dashboardApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  GraduationCap, BookOpen, DollarSign, CreditCard,
  TrendingUp, AlertTriangle, Calendar, Banknote, ArrowUpRight,
  ArrowDownRight, Loader2, UserCheck, BarChart3
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format } from 'date-fns';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  activeCourses: number;
  activeBatches: number;
  todayCollection: number;
  monthlyCollection: number;
  pendingFees: number;
  overdueCount: number;
  unpaidSalaries: { amount: number; count: number };
  todayAttendance: { present: number; absent: number; late: number; leave: number };
  monthlyChart: Array<{ _id: string; collected: number }>;
}

function StatCard({ title, value, icon, color, sub, trend }: {
  title: string; value: string | number; icon: React.ReactNode;
  color: string; sub?: string; trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
          {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : trend === 'down' ? <ArrowDownRight className="w-3.5 h-3.5" /> : null}
          <span>{trend === 'up' ? 'Increasing' : trend === 'down' ? 'Needs attention' : 'Stable'}</span>
        </div>
      )}
    </div>
  );
}

const fmt = (n: number) => `PKR ${(n || 0).toLocaleString()}`;

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.stats()
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Loading dashboard...</p>
      </div>
    </div>
  );

  const chartData = (stats?.monthlyChart || []).map(m => ({
    month: format(new Date(m._id + '-01'), 'MMM'),
    collected: m.collected,
  }));

  const attendanceTotal = Object.values(stats?.todayAttendance || {}).reduce((a, b) => a + b, 0);
  const attendancePct = attendanceTotal > 0
    ? Math.round(((stats?.todayAttendance.present || 0) / attendanceTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name ? user.name.split(' ')[0] : ''} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')} · {user?.branch?.name || 'Royal Academy'}</p>
        </div>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats?.totalStudents || 0} icon={<GraduationCap className="w-5 h-5 text-blue-600" />} color="bg-blue-50" trend="up" />
        <StatCard title="Total Teachers" value={stats?.totalTeachers || 0} icon={<UserCheck className="w-5 h-5 text-purple-600" />} color="bg-purple-50" trend="neutral" />
        <StatCard title="Active Courses" value={stats?.activeCourses || 0} icon={<BookOpen className="w-5 h-5 text-indigo-600" />} color="bg-indigo-50" />
        <StatCard title="Active Batches" value={stats?.activeBatches || 0} icon={<Calendar className="w-5 h-5 text-teal-600" />} color="bg-teal-50" />
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Collection" value={fmt(stats?.todayCollection || 0)} icon={<DollarSign className="w-5 h-5 text-green-600" />} color="bg-green-50" sub="Cash + Bank" trend="up" />
        <StatCard title="Monthly Collection" value={fmt(stats?.monthlyCollection || 0)} icon={<TrendingUp className="w-5 h-5 text-emerald-600" />} color="bg-emerald-50" sub={format(new Date(), 'MMMM yyyy')} />
        <StatCard title="Pending Fees" value={fmt(stats?.pendingFees || 0)} icon={<CreditCard className="w-5 h-5 text-amber-600" />} color="bg-amber-50" sub={`${stats?.overdueCount || 0} overdue`} trend="down" />
        <StatCard title="Unpaid Salaries" value={fmt(stats?.unpaidSalaries?.amount || 0)} icon={<Banknote className="w-5 h-5 text-red-500" />} color="bg-red-50" sub={`${stats?.unpaidSalaries?.count || 0} pending`} trend={stats?.unpaidSalaries?.count ? 'down' : 'neutral'} />
      </div>

      {/* Charts + Attendance */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-gray-900">Monthly Revenue</h3>
              <p className="text-xs text-gray-500">Last 6 months fee collection</p>
            </div>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: any) => [`PKR ${typeof v === 'number' ? v.toLocaleString() : v}`, 'Collected']} />
                <Area type="monotone" dataKey="collected" stroke="#3b82f6" strokeWidth={2} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
              No collection data yet. Start collecting fees to see chart.
            </div>
          )}
        </div>

        {/* Today's Attendance */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-gray-900">Today's Attendance</h3>
              <p className="text-xs text-gray-500">Student attendance rate</p>
            </div>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="12"
                  strokeDasharray={`${attendancePct * 2.51} 251`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{attendancePct}%</span>
                <span className="text-xs text-gray-500">Present</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Present', count: stats?.todayAttendance.present || 0, color: 'bg-green-500' },
              { label: 'Absent', count: stats?.todayAttendance.absent || 0, color: 'bg-red-500' },
              { label: 'Late', count: stats?.todayAttendance.late || 0, color: 'bg-yellow-500' },
              { label: 'On Leave', count: stats?.todayAttendance.leave || 0, color: 'bg-gray-400' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${row.color}`} />
                  <span className="text-gray-600">{row.label}</span>
                </div>
                <span className="font-semibold text-gray-900">{row.count}</span>
              </div>
            ))}
          </div>
          {attendanceTotal === 0 && (
            <p className="text-center text-xs text-gray-400 mt-4">No attendance marked today</p>
          )}
        </div>
      </div>

      {/* Overdue alert */}
      {(stats?.overdueCount || 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Overdue Fee Alert</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {stats?.overdueCount} fee records are overdue. Review and send reminders to students.
            </p>
          </div>
          <a href="/fees/overdue" className="ml-auto text-xs text-amber-700 font-semibold hover:underline whitespace-nowrap">View →</a>
        </div>
      )}
    </div>
  );
}
