import { useState, useEffect, useCallback } from 'react';
import { usersApi, auditLogsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Loader2, ToggleLeft, ToggleRight, Key, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function Users() {
  const { user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [showReset, setShowReset] = useState<any>(null);
  const [newPwd, setNewPwd] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'teacher', phone: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await usersApi.list({ search: search || undefined });
      setUsers(data.data); setTotal(data.total);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (id: string, name: string) => {
    try { await usersApi.toggleActive(id); toast.success(`User ${name} status updated`); load(); }
    catch { toast.error('Failed to update status'); }
  };

  const handleReset = async () => {
    if (!newPwd || newPwd.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try { await usersApi.resetPassword(showReset._id, newPwd); toast.success('Password reset successfully'); setShowReset(null); setNewPwd(''); }
    catch { toast.error('Failed to reset password'); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete user ${name}? This cannot be undone.`)) return;
    try { await usersApi.delete(id); toast.success('User deleted'); load(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) { toast.error('Name, email and password are required'); return; }
    try { await usersApi.create(createForm); toast.success('User created'); setShowCreate(false); setCreateForm({ name: '', email: '', password: '', role: 'teacher', phone: '' }); load(); }
    catch (err: any) { toast.error(err.response?.data?.message || 'Failed to create'); }
  };

  const ROLE_COLORS: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-800', branch_admin: 'bg-blue-100 text-blue-800',
    teacher: 'bg-green-100 text-green-800', student: 'bg-yellow-100 text-yellow-800', parent: 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div><h1 className="text-2xl font-bold text-gray-900">User Management</h1><p className="text-gray-500 text-sm">{total} users</p></div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
          <Plus className="w-4 h-4" /> Create User
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
          : <div className="overflow-x-auto"><table className="data-table">
            <thead><tr><th>User</th><th>Role</th><th>Branch</th><th>Last Login</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u._id} className={u.isOwner ? 'bg-purple-50/30' : ''}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs flex-shrink-0">{u.name[0]}</div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm flex items-center gap-1.5">{u.name}{u.isOwner && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">OWNER</span>}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] || 'badge-gray'}`}>{u.role.replace('_', ' ')}</span></td>
                  <td className="text-sm text-gray-600">{u.branch?.name || '—'}</td>
                  <td className="text-xs text-gray-500">{u.lastLogin ? format(new Date(u.lastLogin), 'MMM d, HH:mm') : 'Never'}</td>
                  <td><span className={u.isActive ? 'badge-green' : 'badge-red'}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      {!u.isOwner && (
                        <>
                          <button onClick={() => handleToggle(u._id, u.name)} title="Toggle active"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                            {u.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button onClick={() => setShowReset(u)} title="Reset password"
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition">
                            <Key className="w-4 h-4" />
                          </button>
                          {currentUser?.role === 'super_admin' && (
                            <button onClick={() => handleDelete(u._id, u.name)} title="Delete user"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>}
      </div>

      {/* Reset Password Modal */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowReset(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-1">Reset Password</h3>
            <p className="text-sm text-gray-500 mb-4">Set new password for <strong>{showReset.name}</strong></p>
            <input type="text" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="New password (min 6 chars)"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowReset(null)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleReset} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-4">Create User</h3>
            <div className="space-y-3">
              {[['Full Name','name','text'],['Email','email','email'],['Password','password','password'],['Phone','phone','tel']].map(([label,key,type]) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} value={(createForm as any)[key]} onChange={e => setCreateForm(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select value={createForm.role} onChange={e => setCreateForm(p => ({ ...p, role: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="branch_admin">Branch Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">Create User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await auditLogsApi.list({ page, limit });
      setLogs(data.data); setTotal(data.total);
    } catch { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const ACTION_STYLE: Record<string, string> = {
    login: 'badge-green', logout: 'badge-gray', create: 'badge-blue',
    update: 'badge-yellow', delete: 'badge-red', payment: 'badge-green',
    password_reset: 'badge-yellow', permission_change: 'badge-blue',
    activate: 'badge-green', deactivate: 'badge-red',
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div><h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1><p className="text-gray-500 text-sm">System activity trail — {total} events</p></div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
          : <div className="overflow-x-auto"><table className="data-table">
            <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Module</th><th>Description</th><th>IP</th></tr></thead>
            <tbody>
              {logs.map((l: any) => (
                <tr key={l._id}>
                  <td className="text-xs text-gray-500 whitespace-nowrap">{format(new Date(l.createdAt), 'MMM d HH:mm:ss')}</td>
                  <td>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{l.userName || l.user?.name || '—'}</p>
                      <p className="text-xs text-gray-400 capitalize">{l.userRole?.replace('_', ' ')}</p>
                    </div>
                  </td>
                  <td><span className={`${ACTION_STYLE[l.action] || 'badge-gray'} capitalize`}>{l.action.replace('_', ' ')}</span></td>
                  <td className="text-sm text-gray-600 capitalize">{l.module}</td>
                  <td className="text-xs text-gray-600 max-w-xs truncate">{l.description}</td>
                  <td className="text-xs font-mono text-gray-400">{l.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table></div>}
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
