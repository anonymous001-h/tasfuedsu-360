import { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Zap, Building2 } from 'lucide-react';
import { PhoneShell } from '@/components/PhoneShell';
import { Tagline, DevelopedByFooter } from '@/components/Branding';
import { useAuth } from '@/contexts/AuthContext';
import { useNav } from '@/contexts/NavContext';
import { useToast } from '@/contexts/ToastContext';
import { APP_NAME } from '@/lib/constants';

export function RegisterScreen() {
  const { signUp } = useAuth();
  const { navigate } = useNav();
  const { showToast } = useToast();
  const [form, setForm] = useState({ fullName: '', department: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error } = await signUp(form.email, form.password, form.fullName, form.department);
    setLoading(false);
    if (error) {
      showToast(error, 'error');
    } else {
      showToast('Account created successfully!', 'success');
      navigate('home');
    }
  };

  return (
    <PhoneShell showBottomNav={false} showHeader={false}>
      <div className="flex-1 flex flex-col bg-gradient-to-br from-navy-900 via-navy-800 to-brand-900 text-white px-6 py-8 overflow-y-auto min-h-screen">
        <div className="text-center mb-6 mt-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Zap className="w-6 h-6 text-white" fill="white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">{APP_NAME}</h1>
          </div>
          <div className="w-12 h-1 bg-brand-400 mx-auto rounded-full" />
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-2xl animate-scale-in text-navy-900 dark:text-dark-text">
          <h2 className="text-xl font-bold mb-1">Create Account</h2>
          <p className="text-sm text-navy-500 dark:text-dark-muted mb-5">Join the TASFUEDSU 360 community</p>

          <form onSubmit={handleRegister} className="space-y-3.5">
            <FormField icon={<User className="w-4 h-4" />} label="Full Name" value={form.fullName} onChange={(v) => update('fullName', v)} placeholder="John Doe" error={errors.fullName} />
            <FormField icon={<Building2 className="w-4 h-4" />} label="Department" value={form.department} onChange={(v) => update('department', v)} placeholder="e.g. Computer Science" error={errors.department} />
            <FormField icon={<Mail className="w-4 h-4" />} label="Email Address" value={form.email} onChange={(v) => update('email', v)} placeholder="you@tasfuedsu.edu.ng" type="email" error={errors.email} />

            <div>
              <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="At least 6 characters"
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

            <FormField icon={<Lock className="w-4 h-4" />} label="Confirm Password" value={form.confirm} onChange={(v) => update('confirm', v)} placeholder="Re-enter password" type="password" error={errors.confirm} />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-500/20 active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</> : 'Register'}
            </button>
          </form>

          <p className="text-center text-sm text-navy-500 dark:text-dark-muted mt-4">
            Already have an account?{' '}
            <button onClick={() => navigate('login')} className="text-brand-600 dark:text-brand-400 font-bold">
              Login
            </button>
          </p>
        </div>

        <div className="mt-auto pt-6 flex flex-col items-center gap-3">
          <Tagline className="text-white/50" />
          <DevelopedByFooter light />
        </div>
      </div>
    </PhoneShell>
  );
}

function FormField({ icon, label, value, onChange, placeholder, type = 'text', error }: {
  icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; error?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text outline-none text-sm transition-all focus:ring-2 ${
            error ? 'border-red-400 focus:ring-red-100' : 'border-navy-200 dark:border-dark-border focus:border-brand-500 focus:ring-brand-100'
          }`}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
