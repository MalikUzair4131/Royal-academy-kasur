import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../services/api';
import { toast } from 'sonner';
import { User, Key, Shield, Loader2, Save } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'profile' | 'password' | 'permissions'>('profile');
  const [saving, setSaving] = useState(false);
  const [pwd, setPwd] = useState({ current: '', newPwd: '', confirm: '' });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.newPwd !== pwd.confirm) { toast.error('Passwords do not match'); return; }
    if (pwd.newPwd.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSaving(true);
    try {
      await authApi.changePassword(pwd.current, pwd.newPwd);
      toast.success('Password changed successfully. Please login again.');
      setPwd({ current: '', newPwd: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const ROLE_LABEL: Record<string, string> = {
    super_admin: 'Super Administrator', branch_admin: 'Branch Administrator',
    teacher: 'Teacher', student: 'Student', parent: 'Parent'
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'password', label: 'Password', icon: <Key className="w-4 h-4" /> },
    { id: 'permissions', label: 'My Permissions', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your account preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <h3 className="font-semibold text-gray-900">Account Information</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-lg">{user?.name}</h4>
              <p className="text-gray-500 text-sm">{user?.email}</p>
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                {ROLE_LABEL[user?.role || ''] || user?.role}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-1">Role</p>
              <p className="text-sm font-medium text-gray-900">{ROLE_LABEL[user?.role || ''] || user?.role}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Branch</p>
              <p className="text-sm font-medium text-gray-900">{user?.branch?.name || 'All Branches'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Email</p>
              <p className="text-sm font-medium text-gray-900">{user?.email}</p>
            </div>
            {user?.isOwner && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Account Type</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">Owner Account</span>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'password' && (
        <form onSubmit={handleChangePassword} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">Change Password</h3>
          {[
            { label: 'Current Password', key: 'current', val: pwd.current },
            { label: 'New Password', key: 'newPwd', val: pwd.newPwd },
            { label: 'Confirm New Password', key: 'confirm', val: pwd.confirm },
          ].map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <input type="password" value={field.val}
                onChange={e => setPwd(p => ({ ...p, [field.key]: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required minLength={field.key !== 'current' ? 6 : 1} />
            </div>
          ))}
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">
            After changing your password, you will be logged out and need to sign in again.
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition shadow-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Update Password
            </button>
          </div>
        </form>
      )}

      {tab === 'permissions' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900">My Access Permissions</h3>
          <p className="text-sm text-gray-500">These are the modules and actions you have access to.</p>
          {user?.permissions?.length === 0 || (user?.permissions?.[0]?.module === '*') ? (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-purple-700 text-sm">
              <Shield className="w-5 h-5 mb-2" />
              <p className="font-semibold">Full System Access</p>
              <p className="text-xs mt-1">You have unrestricted access to all modules and actions.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {user?.permissions?.map((perm, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                  <span className="text-sm font-medium text-gray-900 capitalize">{perm.module}</span>
                  <div className="flex gap-1">
                    {perm.actions.map(action => (
                      <span key={action} className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{action}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
