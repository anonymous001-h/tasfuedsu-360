import { useState } from 'react';
import { Mail, ChevronLeft, Zap, CheckCircle2, Loader2 } from 'lucide-react';
import { PhoneShell } from '@/components/PhoneShell';
import { Tagline, DevelopedByFooter } from '@/components/Branding';
import { useNav } from '@/contexts/NavContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import { APP_NAME } from '@/lib/constants';

export function ForgotPasswordScreen() {
  const { navigate, goBack } = useNav();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter your email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const { data: exists, error: rpcError } = await supabase
        .rpc('check_email_exists', { email_to_check: email });

      if (rpcError) throw rpcError;

      if (!exists) {
        setLoading(false);
        setError('No account found with this email address.');
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
      if (resetError) throw resetError;

      setSent(true);
      showToast('Password reset link sent to your email', 'success');
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <PhoneShell showBottomNav={false} showHeader={false}>
      <div className="flex-1 flex flex-col bg-gradient-to-br from-navy-900 via-navy-800 to-brand-900 text-white px-6 py-8 min-h-screen">
        <button onClick={goBack} className="flex items-center gap-1.5 text-white/60 text-sm mb-6 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Zap className="w-6 h-6 text-white" fill="white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">{APP_NAME}</h1>
          </div>
          <div className="w-12 h-1 bg-brand-400 mx-auto rounded-full" />
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-3xl p-6 shadow-2xl animate-scale-in text-navy-900 dark:text-dark-text">
          <h2 className="text-xl font-bold mb-1">Forgot Password</h2>
          <p className="text-sm text-navy-500 dark:text-dark-muted mb-6">Enter your email and we'll send you a reset link</p>

          {sent ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5 text-center animate-scale-in">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="text-sm text-navy-700 dark:text-dark-text font-medium">A password reset link has been sent to:</p>
              <p className="text-sm text-brand-600 dark:text-brand-400 font-bold mt-1">{email}</p>
              <button onClick={() => navigate('login')} className="mt-4 text-sm text-brand-600 dark:text-brand-400 font-bold">
                Return to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@tasfuedsu.edu.ng"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text outline-none text-sm transition-all focus:ring-2 ${
                      error ? 'border-red-400 focus:ring-red-100' : 'border-navy-200 dark:border-dark-border focus:border-brand-500 focus:ring-brand-100'
                    }`}
                  />
                </div>
                {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-500/20 active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking...</> : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>

        <div className="mt-auto pt-8 flex flex-col items-center gap-3">
          <Tagline className="text-white/50" />
          <DevelopedByFooter light />
        </div>
      </div>
    </PhoneShell>
  );
}
