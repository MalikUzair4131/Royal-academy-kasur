'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar,
  DollarSign, CreditCard, BarChart3, Settings, Bell, LogOut,
  Menu, ChevronDown, ChevronRight, ClipboardList,
  UserCheck, Banknote, TrendingUp, Shield, GraduationCap as Academy
} from 'lucide-react';
import { toast } from 'sonner';
import { notificationsApi } from '@/services/api';

interface NavItem {
  label: string;
  to?: string;
  icon: React.ReactNode;
  roles?: string[];
  module?: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, roles: ['super_admin','branch_admin','teacher','student','parent'] },
  {
    label: 'Students', icon: <GraduationCap className="w-4 h-4" />, module: 'students',
    roles: ['super_admin','branch_admin','teacher'],
    children: [
      { label: 'All Students', to: '/students', icon: <Users className="w-3.5 h-3.5" /> },
      { label: 'Enroll Student', to: '/students/new', icon: <UserCheck className="w-3.5 h-3.5" /> },
    ]
  },
  {
    label: 'Teachers', icon: <UserCheck className="w-4 h-4" />, module: 'teachers',
    roles: ['super_admin','branch_admin'],
    children: [
      { label: 'All Teachers', to: '/teachers', icon: <Users className="w-3.5 h-3.5" /> },
      { label: 'Add Teacher', to: '/teachers/new', icon: <UserCheck className="w-3.5 h-3.5" /> },
    ]
  },
  {
    label: 'Courses & Batches', icon: <BookOpen className="w-4 h-4" />, module: 'courses',
    roles: ['super_admin','branch_admin','teacher'],
    children: [
      { label: 'Courses', to: '/courses', icon: <BookOpen className="w-3.5 h-3.5" /> },
      { label: 'Batches', to: '/batches', icon: <Calendar className="w-3.5 h-3.5" /> },
    ]
  },
  {
    label: 'Fees & Payments', icon: <CreditCard className="w-4 h-4" />, module: 'fees',
    roles: ['super_admin','branch_admin','student','parent'],
    children: [
      { label: 'Fee Records', to: '/fees', icon: <CreditCard className="w-3.5 h-3.5" /> },
      { label: 'Collect Payment', to: '/fees/collect', icon: <DollarSign className="w-3.5 h-3.5" /> },
      { label: 'Overdue Fees', to: '/fees/overdue', icon: <ClipboardList className="w-3.5 h-3.5" /> },
    ]
  },
  {
    label: 'Salary', icon: <Banknote className="w-4 h-4" />, module: 'salary',
    roles: ['super_admin','branch_admin','teacher'],
    children: [
      { label: 'Salary Records', to: '/salary', icon: <Banknote className="w-3.5 h-3.5" /> },
      { label: 'Process Salary', to: '/salary/process', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    ]
  },
  {
    label: 'Attendance', icon: <Calendar className="w-4 h-4" />, module: 'attendance',
    roles: ['super_admin','branch_admin','teacher','student','parent'],
    children: [
      { label: 'Mark Attendance', to: '/attendance/mark', icon: <ClipboardList className="w-3.5 h-3.5" /> },
      { label: 'Attendance Report', to: '/attendance/report', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    ]
  },
  {
    label: 'Reports', icon: <BarChart3 className="w-4 h-4" />, module: 'reports',
    roles: ['super_admin','branch_admin'],
    children: [
      { label: 'Profit & Loss', to: '/reports/profit-loss', icon: <TrendingUp className="w-3.5 h-3.5" /> },
      { label: 'Fee Collection', to: '/reports/fee-collection', icon: <DollarSign className="w-3.5 h-3.5" /> },
      { label: 'Attendance Report', to: '/reports/attendance', icon: <Calendar className="w-3.5 h-3.5" /> },
    ]
  },
  {
    label: 'User Management', icon: <Shield className="w-4 h-4" />, module: 'users',
    roles: ['super_admin','branch_admin'],
    children: [
      { label: 'All Users', to: '/users', icon: <Users className="w-3.5 h-3.5" /> },
      { label: 'Audit Logs', to: '/audit-logs', icon: <ClipboardList className="w-3.5 h-3.5" /> },
    ]
  },
];

function NavGroup({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const isChildActive = item.children?.some(c => c.to && pathname.startsWith(c.to));
  const [open, setOpen] = useState(isChildActive || false);

  useEffect(() => { if (isChildActive) setOpen(true); }, [isChildActive]);

  if (!item.children) {
    const isActive = pathname === item.to;
    return (
      <Link href={item.to!}
        className={`sidebar-nav-item ${isActive ? 'active' : 'text-blue-100/70 hover:text-white'}`}>
        {item.icon}
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  }

  return (
    <div>
      <button onClick={() => setOpen(!open)}
        className={`sidebar-nav-item w-full text-left ${isChildActive ? 'text-white' : 'text-blue-100/70 hover:text-white'}`}>
        {item.icon}
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </>
        )}
      </button>
      {open && !collapsed && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
          {item.children.map(child => {
            const isActive = pathname === child.to;
            return (
              <Link key={child.to} href={child.to!}
                className={`sidebar-nav-item text-xs py-2 ${isActive ? 'text-white font-semibold' : 'text-blue-100/60 hover:text-white'}`}>
                {child.icon}
                <span>{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, canAccess } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    notificationsApi.list().then(r => setUnreadCount(r.data.unreadCount || 0)).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const filteredNav = navItems.filter(item => {
    if (!item.roles?.includes(user?.role || '')) return false;
    if (item.module && !canAccess(item.module)) return false;
    return true;
  });

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/40">
          <Academy className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-white font-bold text-sm leading-tight">Royal Academy</h1>
            <p className="text-blue-300 text-xs">ERP System</p>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="mx-3 mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.name}</p>
              <p className="text-blue-300 text-xs capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {filteredNav.map((item, i) => (
          <NavGroup key={i} item={item} collapsed={collapsed} />
        ))}
      </nav>

      <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-0.5">
        <Link href="/settings"
          className="sidebar-nav-item text-blue-100/70 hover:text-white">
          <Settings className="w-4 h-4" />
          {!collapsed && <span>Settings</span>}
        </Link>
        <button onClick={handleLogout}
          className="sidebar-nav-item w-full text-left text-red-300 hover:text-red-200 hover:bg-red-500/10">
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <aside className={`hidden lg:flex flex-col bg-[hsl(var(--sidebar-background))] transition-all duration-300 flex-shrink-0 ${collapsed ? 'w-16' : 'w-64'}`}>
        {sidebarContent}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 w-64 h-full bg-[hsl(var(--sidebar-background))]">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="hidden sm:block">
              <h2 className="font-semibold text-gray-800 text-sm">
                {user?.branch?.name || 'Royal Academy ERP'}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-gray-100 transition">
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">{user?.name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 max-w-screen-2xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
