import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react';
import { PhoneShell } from '@/components/PhoneShell';
import { Tagline, DevelopedByFooter } from '@/components/Branding';
import { useAuth } from '@/contexts/AuthContext';
import { useNav } from '@/contexts/NavContext';
import { useToast } from '@/contexts/ToastContext';
import { APP_NAME } from '@/lib/constants';

export function LoginScreen() {
  const { signIn } = useAuth();
  const { navigate } = useNav();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Welcome back!', 'success');
      navigate('home');
    }
  };

  return (
    <PhoneShell showBottomNav={false} showHeader={false}>
      <div className="flex-1 flex flex-col bg-gradient-to-br from-navy-900 via-navy-800 to-brand-900 text-white px-6 py-8 overflow-y-auto min-h-screen">
        <div className="text-center mb-8 mt-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Zap className="w-6 h-6 text-white" fill="white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">{APP_NAME}</h1>
          </div>
          <div className="w-12 h-1 bg-brand-400 mx-auto rounded-full" />
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-2xl animate-scale-in text-navy-900 dark:text-dark-text">
          <h2 className="text-xl font-bold mb-1">Welcome Back</h2>
          <p className="text-sm text-navy-500 dark:text-dark-muted mb-6">Sign in to your account to continue</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrors({ ...errors, email: undefined }); }}
                  placeholder="you@tasfuedsu.edu.ng"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text outline-none text-sm transition-all focus:ring-2 ${
                    errors.email ? 'border-red-400 focus:ring-red-100' : 'border-navy-200 dark:border-dark-border focus:border-brand-500 focus:ring-brand-100'
                  }`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors({ ...errors, password: undefined }); }}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text outline-none text-sm transition-all focus:ring-2 ${
                    errors.password ? 'border-red-400 focus:ring-red-100' : 'border-navy-200 dark:border-dark-border focus:border-brand-500 focus:ring-brand-100'
                  }`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>

            <div className="text-right">
              <button type="button" onClick={() => navigate('forgot')} className="text-xs text-brand-600 dark:text-brand-400 font-medium">
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-500/20 active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2Small /> Signing in...</> : 'Login'}
            </button>
          </form>

          <p className="text-center text-sm text-navy-500 dark:text-dark-muted mt-5">
            Don't have an account?{' '}
            <button onClick={() => navigate('register')} className="text-brand-600 dark:text-brand-400 font-bold">
              Register
            </button>
          </p>
        </div>

        <div className="mt-auto pt-8 flex flex-col items-center gap-3">
          <Tagline className="text-white/50" />
          <DevelopedByFooter light />
        </div>
      </div>
    </PhoneShell>
  );
}

function Loader2Small() {
  return <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
}
