'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { BookOpen, Eye, EyeOff, Loader2, GraduationCap } from 'lucide-react';
import { AxiosError } from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      const msg = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Super Admin', email: 'superadmin@royalacademy.com', password: 'Admin@2024!' },
    { label: 'Branch Admin', email: 'admin@royalacademy.com', password: 'Admin@2024!' },
    { label: 'Teacher', email: 'teacher@royalacademy.com', password: 'Teacher@2024!' },
    { label: 'Student', email: 'student@royalacademy.com', password: 'Student@2024!' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 25px 25px, white 2px, transparent 0)', backgroundSize: '50px 50px' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/40 mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Royal Academy</h1>
          <p className="text-blue-300 text-sm mt-1">ERP Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-1">Sign In</h2>
          <p className="text-blue-200 text-sm mb-6">Access your academy dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@royalacademy.com"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-100 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-12"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-blue-300 text-xs text-center mb-3">Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map(acc => (
                <button key={acc.label}
                  onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
                  className="text-xs py-2 px-3 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 text-blue-200 hover:text-white transition text-left"
                >
                  <div className="font-medium">{acc.label}</div>
                  <div className="text-white/40 truncate">{acc.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-blue-400/60 text-xs mt-6">
          © {new Date().getFullYear()} Royal Academy ERP • All rights reserved
        </p>
      </div>
    </div>
  );
}
