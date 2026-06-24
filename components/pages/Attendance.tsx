'use client';
import { useState, useEffect, useCallback } from 'react';
import { attendanceApi, studentsApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-green-500', absent: 'bg-red-500', late: 'bg-yellow-500', leave: 'bg-blue-400', holiday: 'bg-gray-300'
};

export default function Attendance() {
  const { hasPermission } = useAuth();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [type, setType] = useState<'student' | 'teacher'>('student');
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await studentsApi.list({ limit: 100, isActive: true });
      setStudents(data.data);
      // Pre-populate with present
      const init: Record<string, string> = {};
      data.data.forEach((s: any) => { init[s._id] = 'present'; });
      setAttendance(init);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const { data } = await attendanceApi.analytics({ type, month: date.slice(0, 7) });
      setAnalytics(data.data);
    } catch {}
  }, [type, date]);

  useEffect(() => { loadStudents(); }, [loadStudents]);
  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  const setStatus = (id: string, status: string) => {
    setAttendance(prev => ({ ...prev, [id]: status }));
  };

  const markAll = (status: string) => {
    const all: Record<string, string> = {};
    students.forEach(s => { all[s._id] = status; });
    setAttendance(all);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = students.map(s => ({ student: s._id, status: attendance[s._id] || 'absent' }));
      await attendanceApi.bulkMark({ records, date, type });
      toast.success('Attendance saved successfully');
      loadAnalytics();
    } catch { toast.error('Failed to save attendance'); }
    finally { setSaving(false); }
  };

  const counts = Object.values(attendance).reduce((acc: any, v) => {
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-500 text-sm">Mark and track daily attendance</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={type} onChange={e => setType(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Present', count: counts.present || 0, color: 'text-green-600 bg-green-50 border-green-100' },
          { label: 'Absent', count: counts.absent || 0, color: 'text-red-600 bg-red-50 border-red-100' },
          { label: 'Late', count: counts.late || 0, color: 'text-yellow-600 bg-yellow-50 border-yellow-100' },
          { label: 'Leave', count: counts.leave || 0, color: 'text-blue-600 bg-blue-50 border-blue-100' },
        ].map(row => (
          <div key={row.label} className={`rounded-xl border p-4 text-center ${row.color}`}>
            <p className="text-2xl font-bold">{row.count}</p>
            <p className="text-xs font-medium mt-0.5">{row.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Mark all:</span>
        {['present', 'absent', 'late', 'leave'].map(s => (
          <button key={s} onClick={() => markAll(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition hover:opacity-80`}
            style={{ borderColor: STATUS_COLORS[s] ? STATUS_COLORS[s].replace('bg-', '#') : '#ccc' }}>
            {s}
          </button>
        ))}
      </div>

      {/* Attendance list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {students.map(s => (
                <div key={s._id} className="flex items-center px-4 py-3 gap-4">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                    {s.firstName[0]}{s.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-gray-400">{s.studentId}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {['present', 'absent', 'late', 'leave'].map(status => (
                      <button key={status}
                        onClick={() => setStatus(s._id, status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition border-2 ${
                          attendance[s._id] === status
                            ? status === 'present' ? 'bg-green-500 text-white border-green-500'
                              : status === 'absent' ? 'bg-red-500 text-white border-red-500'
                              : status === 'late' ? 'bg-yellow-500 text-white border-yellow-500'
                              : 'bg-blue-400 text-white border-blue-400'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}>
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {hasPermission('attendance', 'create') && (
              <div className="border-t border-gray-100 p-4 flex justify-end">
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition shadow-sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Attendance
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
