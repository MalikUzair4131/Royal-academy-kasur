import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './app/contexts/AuthContext';
import Layout from './app/components/layout/Layout';
import Login from './app/components/auth/Login';
import Dashboard from './app/components/pages/Dashboard';
import Students from './app/components/pages/Students';
import StudentForm from './app/components/pages/StudentForm';
import Teachers from './app/components/pages/Teachers';
import TeacherForm from './app/components/pages/TeacherForm';
import Courses from './app/components/pages/Courses';
import Batches from './app/components/pages/Batches';
import Fees from './app/components/pages/Fees';
import { FeeCollect, OverdueFees } from './app/components/pages/FeeCollect';
import Salary from './app/components/pages/Salary';
import Attendance from './app/components/pages/Attendance';
import Reports from './app/components/pages/Reports';
import Settings from './app/components/pages/Settings';
import { Users, AuditLogs } from './app/components/pages/UsersManagement';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading Royal Academy ERP...</p>
      </div>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        {/* Students */}
        <Route path="students" element={<Students />} />
        <Route path="students/new" element={<StudentForm />} />
        <Route path="students/:id/edit" element={<StudentForm />} />
        {/* Teachers */}
        <Route path="teachers" element={<Teachers />} />
        <Route path="teachers/new" element={<TeacherForm />} />
        <Route path="teachers/:id/edit" element={<TeacherForm />} />
        {/* Courses & Batches */}
        <Route path="courses" element={<Courses />} />
        <Route path="batches" element={<Batches />} />
        {/* Fees */}
        <Route path="fees" element={<Fees />} />
        <Route path="fees/collect" element={<FeeCollect />} />
        <Route path="fees/overdue" element={<OverdueFees />} />
        {/* Salary */}
        <Route path="salary" element={<Salary />} />
        <Route path="salary/process" element={<Salary />} />
        {/* Attendance */}
        <Route path="attendance/mark" element={<Attendance />} />
        <Route path="attendance/report" element={<Attendance />} />
        {/* Reports */}
        <Route path="reports/profit-loss" element={<Reports />} />
        <Route path="reports/fee-collection" element={<Reports />} />
        <Route path="reports/attendance" element={<Reports />} />
        {/* Users & Audit */}
        <Route path="users" element={<Users />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        {/* Settings */}
        <Route path="settings" element={<Settings />} />
        {/* Notifications stub */}
        <Route path="notifications" element={<Dashboard />} />
        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors closeButton duration={4000} />
      </AuthProvider>
    </BrowserRouter>
  );
}
