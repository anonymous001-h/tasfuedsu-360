import { useState } from 'react';
import { Bell, Lock, Shield, Eye, EyeOff, Moon, Sun, Newspaper, Calendar, MessageSquare, Briefcase, ChevronRight, Pencil } from 'lucide-react';
import { PhoneShell } from '@/components/PhoneShell';
import { AppHeader } from '@/components/AppHeader';
import { DevelopedByFooter } from '@/components/Branding';
import { useNav } from '@/contexts/NavContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { supabase } from '@/lib/supabase';
import { APP_VERSION, TAGLINE } from '@/lib/constants';

export function SettingsScreen() {
  const { showToast } = useToast();
  const { session } = useAuth();
  const { navigate } = useNav();
  const { theme, toggleTheme } = useTheme();
  const { prefs, setPrefs } = useNotifications();
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const handleChangePwd = async () => {
    if (!pwdForm.old) { showToast('Current password is required', 'error'); return; }
    if (!pwdForm.new || pwdForm.new.length < 6) { showToast('New password must be at least 6 characters', 'error'); return; }
    if (pwdForm.new !== pwdForm.confirm) { showToast('Passwords do not match', 'error'); return; }
    setSavingPwd(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: session?.user?.email || '', password: pwdForm.old });
    if (signInError) { setSavingPwd(false); showToast('Current password is incorrect', 'error'); return; }
    const { error } = await supabase.auth.updateUser({ password: pwdForm.new });
    setSavingPwd(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Password updated', 'success');
    setShowChangePwd(false);
    setPwdForm({ old: '', new: '', confirm: '' });
  };

  const togglePref = (key: 'news' | 'events' | 'messages' | 'opportunities') => {
    setPrefs({ ...prefs, [key]: !prefs[key] });
    showToast(`${key === 'news' ? 'News' : key === 'events' ? 'Events' : key === 'messages' ? 'Messages' : 'Opportunities'} notifications ${prefs[key] ? 'disabled' : 'enabled'}`, 'info');
  };

  const dark = theme === 'dark';

  return (
    <PhoneShell showBottomNav={false}>
      <AppHeader title="Settings" showBack />
      <div className="px-5 py-5 space-y-4 pb-20">
        {/* Edit Profile link */}
        <button onClick={() => navigate('editProfile')} className="w-full bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border p-4 flex items-center gap-3 active:scale-[0.98] transition-transform hover:shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 flex items-center justify-center"><Pencil className="w-4 h-4" /></div>
          <div className="flex-1 text-left">
            <h3 className="text-sm font-semibold text-navy-800 dark:text-dark-text">Edit Profile</h3>
            <p className="text-xs text-navy-400 dark:text-dark-muted">Update your name, bio, and photo</p>
          </div>
          <ChevronRight className="w-4 h-4 text-navy-300" />
        </button>

        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border p-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${dark ? 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' : 'bg-amber-50 text-amber-600'}`}>
              {dark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-navy-800 dark:text-dark-text">Dark Mode</h3>
              <p className="text-xs text-navy-400 dark:text-dark-muted">Switch between light and dark themes</p>
            </div>
            <button onClick={toggleTheme} className={`w-12 h-6 rounded-full transition-colors ${dark ? 'bg-brand-500' : 'bg-navy-300'} relative`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${dark ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Bell className="w-4 h-4" /></div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-navy-800 dark:text-dark-text">Push Notifications</h3>
              <p className="text-xs text-navy-400 dark:text-dark-muted">Receive urgent news, event reminders, and messages</p>
            </div>
            <button onClick={() => { const v = !prefs.enabled; setPrefs({ ...prefs, enabled: v }); showToast(v ? 'Notifications enabled' : 'Notifications disabled', 'info'); }} className={`w-12 h-6 rounded-full transition-colors ${prefs.enabled ? 'bg-brand-500' : 'bg-navy-300'} relative`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${prefs.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          {prefs.enabled && (
            <div className="mt-3 pt-3 border-t border-navy-50 dark:border-dark-border space-y-2.5">
              <PrefRow icon={<Newspaper className="w-3 h-3" />} label="Urgent Campus News" enabled={prefs.news} onToggle={() => togglePref('news')} />
              <PrefRow icon={<Calendar className="w-3 h-3" />} label="Event Reminders" enabled={prefs.events} onToggle={() => togglePref('events')} />
              <PrefRow icon={<MessageSquare className="w-3 h-3" />} label="New Messages" enabled={prefs.messages} onToggle={() => togglePref('messages')} />
              <PrefRow icon={<Briefcase className="w-3 h-3" />} label="Opportunities" enabled={prefs.opportunities} onToggle={() => togglePref('opportunities')} />
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border p-4">
          <button onClick={() => setShowChangePwd(!showChangePwd)} className="w-full flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400 flex items-center justify-center"><Lock className="w-4 h-4" /></div>
            <div className="flex-1 text-left">
              <h3 className="text-sm font-semibold text-navy-800 dark:text-dark-text">Change Password</h3>
              <p className="text-xs text-navy-400 dark:text-dark-muted">Update your account password</p>
            </div>
          </button>
          {showChangePwd && (
            <div className="mt-4 space-y-3">
              <input type={showPwd ? 'text' : 'password'} value={pwdForm.old} onChange={(e) => setPwdForm({ ...pwdForm, old: e.target.value })} placeholder="Current password" className="w-full px-4 py-2.5 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={pwdForm.new} onChange={(e) => setPwdForm({ ...pwdForm, new: e.target.value })} placeholder="New password" className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
                <button onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400">{showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
              <input type={showPwd ? 'text' : 'password'} value={pwdForm.confirm} onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })} placeholder="Confirm new password" className="w-full px-4 py-2.5 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
              <button onClick={handleChangePwd} disabled={savingPwd} className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-2.5 rounded-xl disabled:opacity-50 active:scale-95 transition-transform">{savingPwd ? 'Updating...' : 'Update Password'}</button>
            </div>
          )}
        </div>

        {/* Privacy Policy - now a clickable link */}
        <button onClick={() => navigate('privacyPolicy')} className="w-full bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border p-4 flex items-center gap-3 active:scale-[0.98] transition-transform hover:shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-navy-100 dark:bg-dark-surface2 text-navy-600 dark:text-dark-muted flex items-center justify-center"><Shield className="w-4 h-4" /></div>
          <div className="flex-1 text-left">
            <h3 className="text-sm font-semibold text-navy-800 dark:text-dark-text">Privacy Policy</h3>
            <p className="text-xs text-navy-400 dark:text-dark-muted">Read our data protection policy</p>
          </div>
          <ChevronRight className="w-4 h-4 text-navy-300" />
        </button>

        <div className="bg-brand-50 dark:bg-dark-surface rounded-2xl p-4 text-center border border-brand-100 dark:border-dark-border">
          <p className="text-xs text-navy-700 dark:text-dark-muted leading-relaxed font-medium">{TAGLINE}</p>
          <p className="text-xs text-brand-600 font-bold mt-2">Version {APP_VERSION}</p>
        </div>

        <DevelopedByFooter />
      </div>
    </PhoneShell>
  );
}

function PrefRow({ icon, label, enabled, onToggle }: { icon: React.ReactNode; label: string; enabled: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg bg-navy-50 dark:bg-dark-bg text-navy-500 dark:text-dark-muted flex items-center justify-center flex-shrink-0">{icon}</div>
      <span className="text-xs font-medium text-navy-700 dark:text-dark-muted flex-1">{label}</span>
      <button onClick={onToggle} className={`w-9 h-5 rounded-full transition-colors ${enabled ? 'bg-brand-500' : 'bg-navy-300 dark:bg-dark-border'} relative`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}
