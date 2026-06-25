'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { teachersApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Eye, Edit2, Loader2, UserCheck, Banknote, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Teacher {
  _id: string; teacherId: string; firstName: string; lastName: string;
  phone?: string; salaryType: 'fixed' | 'revenue_share';
  fixedSalary?: number; revenueSharePercentage?: number;
  qualification?: string; isActive: boolean;
  courses?: Array<{ name: string }>;
  user?: { email: string };
}

export default function Teachers() {
  const { hasPermission } = useAuth();
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await teachersApi.list({ page, limit, search: search || undefined });
      setTeachers(data.data); setTotal(data.total);
    } catch { toast.error('Failed to load teachers'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { loadTeachers(); }, [loadTeachers]);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
          <p className="text-gray-500 text-sm">{total} total teachers</p>
        </div>
        {hasPermission('teachers', 'create') && (
          <Link href="/teachers/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
            <Plus className="w-4 h-4" /> Add Teacher
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-16">
            <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No teachers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr>
                <th>Teacher</th><th>ID</th><th>Qualification</th>
                <th>Salary Type</th><th>Courses</th><th>Status</th><th className="text-right">Actions</th>
              </tr></thead>
              <tbody>
                {teachers.map(t => (
                  <tr key={t._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-sm flex-shrink-0">
                          {t.firstName?.[0] ?? ''}{t.lastName?.[0] ?? ''}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{(t.firstName ?? '') + (t.lastName ? ' ' + t.lastName : '')}</p>
                          <p className="text-xs text-gray-400">{t.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge-blue">{t.teacherId}</span></td>
                    <td className="text-gray-600 text-sm">{t.qualification || '—'}</td>
                    <td>
                      {t.salaryType === 'fixed' ? (
                        <div className="flex items-center gap-1.5">
                          <Banknote className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-sm text-gray-700">Fixed — PKR {t.fixedSalary?.toLocaleString()}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-sm text-gray-700">Revenue {t.revenueSharePercentage}%</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {t.courses?.slice(0, 2).map((c, i) => <span key={i} className="badge-blue">{c.name}</span>)}
                        {(t.courses?.length || 0) > 2 && <span className="badge-gray">+{(t.courses?.length || 0) - 2}</span>}
                      </div>
                    </td>
                    <td><span className={t.isActive ? 'badge-green' : 'badge-red'}>{t.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => router.push(`/teachers/${t._id}`)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Eye className="w-4 h-4" /></button>
                        {hasPermission('teachers', 'edit') && (
                          <button onClick={() => router.push(`/teachers/${t._id}/edit`)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"><Edit2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
    </div>
  );
}
