import { useEffect, useState, useCallback } from 'react';
import {
  Newspaper, BookOpen, Clock, Briefcase, Calendar as CalendarIcon,
  Users, Ghost, Megaphone, Shield, Database, Plus, Image, Quote as QuoteIcon,
} from 'lucide-react';
import { PhoneShell } from '@/components/PhoneShell';
import { AppHeader } from '@/components/AppHeader';
import { LoadingSpinner } from '@/components/States';
import { FileUpload } from '@/components/FileUpload';
import { useNav } from '@/contexts/NavContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';

interface Stats {
  users: number;
  news: number;
  events: number;
  library: number;
  anonymous: number;
}

export function AdminScreen() {
  const { navigate } = useNav();
  const { showToast } = useToast();
  const [stats, setStats] = useState<Stats>({ users: 0, news: 0, events: 0, library: 0, anonymous: 0 });
  const [loading, setLoading] = useState(true);
  const [showSplashManager, setShowSplashManager] = useState(false);
  const [splashUrl, setSplashUrl] = useState('');

  const loadStats = useCallback(async () => {
    const [usersRes, newsRes, eventsRes, libRes, anonRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('news').select('id', { count: 'exact', head: true }),
      supabase.from('events').select('id', { count: 'exact', head: true }),
      supabase.from('library_resources').select('id', { count: 'exact', head: true }),
      supabase.from('anonymous_submissions').select('id', { count: 'exact', head: true }),
    ]);
    setStats({
      users: usersRes.count || 0,
      news: newsRes.count || 0,
      events: eventsRes.count || 0,
      library: libRes.count || 0,
      anonymous: anonRes.count || 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    supabase.from('app_settings').select('*').eq('key', 'splash_image').maybeSingle().then(({ data }) => {
      if (data) setSplashUrl(data.value);
    });
  }, []);

  const handleSaveSplash = async () => {
    const { error } = await supabase.from('app_settings').upsert({ key: 'splash_image', value: splashUrl }, { onConflict: 'key' });
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Splash screen updated', 'success');
    setShowSplashManager(false);
  };

  const managementItems = [
    { icon: <Newspaper className="w-5 h-5" />, label: 'Manage News', screen: 'news', count: stats.news, color: 'bg-brand-500' },
    { icon: <BookOpen className="w-5 h-5" />, label: 'Manage Library', screen: 'library', count: stats.library, color: 'bg-teal-500' },
    { icon: <Clock className="w-5 h-5" />, label: 'Manage Events', screen: 'events', count: stats.events, color: 'bg-amber-500' },
    { icon: <CalendarIcon className="w-5 h-5" />, label: 'Manage Calendar', screen: 'calendar', count: null, color: 'bg-rose-500' },
    { icon: <Briefcase className="w-5 h-5" />, label: 'Opportunities', screen: 'opportunities', count: null, color: 'bg-purple-500' },
    { icon: <Users className="w-5 h-5" />, label: 'SUG Members', screen: 'sug', count: null, color: 'bg-teal-500' },
    { icon: <Ghost className="w-5 h-5" />, label: 'Anonymous Desk', screen: 'adminAnonymous', count: stats.anonymous, color: 'bg-brand-600' },
    { icon: <Megaphone className="w-5 h-5" />, label: 'Connect+ Channels', screen: 'connect', count: null, color: 'bg-orange-500' },
    { icon: <QuoteIcon className="w-5 h-5" />, label: 'Daily Quotes', screen: 'adminQuotes', count: null, color: 'bg-indigo-500' },
  ];

  const quickActions = [
    { icon: <Plus className="w-4 h-4" />, label: 'Add News', screen: 'news' as const },
    { icon: <Plus className="w-4 h-4" />, label: 'Add Resource', screen: 'library' as const },
    { icon: <Plus className="w-4 h-4" />, label: 'Add Event', screen: 'events' as const },
    { icon: <Image className="w-4 h-4" />, label: 'Splash Screen', action: () => setShowSplashManager(true) },
  ];

  return (
    <PhoneShell showBottomNav={false}>
      <AppHeader title="Admin Console" showBack />
      <div className="pb-20">
        {loading ? <LoadingSpinner text="Loading dashboard..." /> : (
          <>
            <div className="px-5 py-5">
              <h2 className="text-sm font-bold text-navy-700 dark:text-dark-text mb-3">Dashboard Overview</h2>
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={<Users className="w-5 h-5" />} label="Total Users" value={stats.users} color="bg-brand-500" />
                <StatCard icon={<Newspaper className="w-5 h-5" />} label="News Articles" value={stats.news} color="bg-blue-500" />
                <StatCard icon={<Clock className="w-5 h-5" />} label="Events" value={stats.events} color="bg-amber-500" />
                <StatCard icon={<BookOpen className="w-5 h-5" />} label="Library Items" value={stats.library} color="bg-teal-500" />
              </div>

              {stats.anonymous > 0 && (
                <button onClick={() => navigate('adminAnonymous')} className="mt-3 w-full bg-brand-50 dark:bg-brand-900/20 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform text-left">
                  <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center"><Ghost className="w-5 h-5" /></div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-navy-800 dark:text-dark-text">{stats.anonymous} Anonymous Submissions</h3>
                    <p className="text-xs text-navy-500 dark:text-dark-muted">Review student feedback</p>
                  </div>
                  <span className="text-xs font-bold text-brand-600">View</span>
                </button>
              )}
            </div>

            <div className="px-5 pb-5">
              <h2 className="text-sm font-bold text-navy-700 dark:text-dark-text mb-3">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => action.action ? action.action() : navigate(action.screen)}
                    className="flex items-center gap-2 bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border p-3 active:scale-95 transition-transform hover:shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                      {action.icon}
                    </div>
                    <span className="text-xs font-semibold text-navy-700 dark:text-dark-text">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 pb-5">
              <h2 className="text-sm font-bold text-navy-700 dark:text-dark-text mb-3">Management</h2>
              <div className="space-y-2">
                {managementItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.screen as never)}
                    className="w-full bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform hover:shadow-sm"
                  >
                    <div className={`w-10 h-10 rounded-xl ${item.color} text-white flex items-center justify-center flex-shrink-0`}>{item.icon}</div>
                    <span className="text-sm font-semibold text-navy-800 dark:text-dark-text flex-1 text-left">{item.label}</span>
                    {item.count !== null && <span className="text-xs font-bold text-navy-400 dark:text-dark-muted">{item.count}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 py-3 flex items-center justify-center gap-2">
              <Database className="w-3.5 h-3.5 text-brand-500" />
              <p className="text-xs text-navy-500 dark:text-dark-muted font-medium">System operational · All services running</p>
            </div>
          </>
        )}
      </div>

      {showSplashManager && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={() => setShowSplashManager(false)}>
          <div className="bg-white dark:bg-dark-surface w-full max-w-[440px] rounded-t-3xl sm:rounded-3xl p-5 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-navy-800 dark:text-dark-text mb-4">Splash Screen Image</h3>
            {splashUrl && <img src={splashUrl} alt="Current splash" className="w-full h-40 object-cover rounded-2xl mb-3" />}
            <FileUpload label="Upload Splash Image" currentUrl={splashUrl} onUploaded={(url) => setSplashUrl(url)} folder="splash" />
            <div className="flex gap-2 mt-4">
              <button onClick={handleSaveSplash} className="flex-1 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3 rounded-xl active:scale-95 transition-transform">Save</button>
              <button onClick={() => setShowSplashManager(false)} className="px-4 bg-navy-100 dark:bg-dark-surface2 text-navy-600 dark:text-dark-muted font-bold py-3 rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </PhoneShell>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border p-4">
      <div className={`w-10 h-10 rounded-xl ${color} text-white flex items-center justify-center mb-2`}>{icon}</div>
      <p className="text-2xl font-black text-navy-800 dark:text-dark-text">{value}</p>
      <p className="text-xs text-navy-400 dark:text-dark-muted">{label}</p>
    </div>
  );
}
