import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { studentsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Search, Eye, Edit2, Trash2, Loader2, GraduationCap, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Student {
  _id: string; studentId: string; firstName: string; lastName: string;
  phone?: string; admissionDate: string; isActive: boolean;
  enrollments: Array<{ course: { name: string }; status: string }>;
  user?: { email: string };
  branch?: { name: string };
}

export default function Students() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await studentsApi.list({ page, limit, search: search || undefined });
      setStudents(data.data);
      setTotal(data.total);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { loadStudents(); }, [loadStudents]);
  useEffect(() => { setPage(1); }, [search]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deactivate student ${name}?`)) return;
    try {
      await studentsApi.delete(id);
      toast.success('Student deactivated');
      loadStudents();
    } catch { toast.error('Failed to deactivate student'); }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 text-sm">{total} total students enrolled</p>
        </div>
        {hasPermission('students', 'create') && (
          <Link to="/students/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
            <Plus className="w-4 h-4" /> Enroll Student
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, ID, phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-16">
            <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No students found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search or enroll a new student</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>ID</th>
                  <th>Contact</th>
                  <th>Courses</th>
                  <th>Admission</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                          {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-gray-400">{s.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge-blue">{s.studentId}</span></td>
                    <td>
                      <div className="flex flex-col gap-0.5">
                        {s.phone && <span className="text-xs text-gray-600 flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span>}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {s.enrollments?.filter(e => e.status === 'active').slice(0, 2).map((e, i) => (
                          <span key={i} className="badge-blue">{e.course?.name}</span>
                        ))}
                        {(s.enrollments?.filter(e => e.status === 'active').length || 0) > 2 && (
                          <span className="badge-gray">+{s.enrollments.filter(e => e.status === 'active').length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="text-gray-500 text-xs">{s.admissionDate ? format(new Date(s.admissionDate), 'MMM d, yyyy') : '—'}</td>
                    <td>
                      <span className={s.isActive ? 'badge-green' : 'badge-red'}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/students/${s._id}`)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <Eye className="w-4 h-4" />
                        </button>
                        {hasPermission('students', 'edit') && (
                          <button onClick={() => navigate(`/students/${s._id}/edit`)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {hasPermission('students', 'delete') && (
                          <button onClick={() => handleDelete(s._id, `${s.firstName} ${s.lastName}`)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
              <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs border rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
