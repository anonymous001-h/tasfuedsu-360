import { useState, useEffect, useCallback } from 'react';
import {
  Search, Newspaper, BookOpen, Calendar, Briefcase,
  Users, MessageSquare, TrendingUp, ChevronRight, Zap, Clock,
  Quote as QuoteIcon, RefreshCw, Loader2,
} from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { useNav } from '@/contexts/NavContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import type { NewsArticle, EventItem, Quote } from '@/types';

export function HomeScreen() {
  const { navigate } = useNav();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [latestNews, setLatestNews] = useState<NewsArticle | null>(null);
  const [upcomingEvent, setUpcomingEvent] = useState<EventItem | null>(null);
  const [dailyQuote, setDailyQuote] = useState<Quote | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [newsRes, eventRes, quotesRes] = await Promise.all([
      supabase.from('news').select('*').order('published_at', { ascending: false }).limit(1),
      supabase.from('events').select('*').gte('event_date', new Date().toISOString()).order('event_date', { ascending: true }).limit(1),
      supabase.from('quotes').select('*').eq('is_active', true).order('created_at', { ascending: true }),
    ]);

    setLatestNews((newsRes.data?.[0] as NewsArticle) || null);
    setUpcomingEvent((eventRes.data?.[0] as EventItem) || null);

    const allQuotes = (quotesRes.data || []) as Quote[];
    if (allQuotes.length > 0) {
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
      const quoteIndex = dayOfYear % allQuotes.length;
      setDailyQuote(allQuotes[quoteIndex]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
    showToast('Home refreshed', 'success');
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <>
      <AppHeader title="Dashboard" showBack={false} rightAction={
        <div className="flex items-center gap-1">
          <button onClick={handleRefresh} disabled={refreshing} className="w-9 h-9 rounded-xl flex items-center justify-center text-navy-600 dark:text-dark-muted hover:bg-navy-100 dark:hover:bg-dark-surface active:scale-90 transition-all">
            {refreshing ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <RefreshCw className="w-4.5 h-4.5" />}
          </button>
          <button onClick={() => navigate('search')} className="w-9 h-9 rounded-xl flex items-center justify-center text-navy-600 dark:text-dark-muted hover:bg-navy-100 dark:hover:bg-dark-surface active:scale-90 transition-all">
            <Search className="w-4.5 h-4.5" />
          </button>
        </div>
      } />
      {loading ? (
        <div className="px-4 py-4 pb-20 space-y-5">
          <div className="h-32 rounded-3xl skeleton" />
          <div className="h-24 rounded-2xl skeleton" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 rounded-2xl skeleton" />
            <div className="h-20 rounded-2xl skeleton" />
          </div>
        </div>
      ) : (
      <div className="px-4 py-4 pb-20 space-y-5">
        {/* Greeting with daily quote */}
        <div className="bg-gradient-to-br from-navy-900 via-navy-800 to-brand-900 rounded-3xl p-5 text-white shadow-xl animate-scale-in">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-brand-300 font-medium">{today}</p>
              <h1 className="text-xl font-bold mt-0.5">{greeting}, {profile?.display_name?.split(' ').slice(0, 2).join(' ') || 'Student'}!</h1>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center">
              <Zap className="w-6 h-6 text-brand-400" fill="currentColor" />
            </div>
          </div>
          {dailyQuote ? (
            <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
              <div className="flex items-start gap-2">
                <QuoteIcon className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-white/90 italic leading-relaxed">"{dailyQuote.text}"</p>
                  <p className="text-xs text-brand-300 mt-1 font-medium">— {dailyQuote.author}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-white/60 italic">"Education is the most powerful weapon which you can use to change the world." — Nelson Mandela</p>
          )}
        </div>

        {/* Latest announcement */}
        {latestNews && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-navy-700 dark:text-dark-text flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-500" /> Latest Announcement
              </h2>
              <button onClick={() => navigate('news')} className="text-xs text-brand-600 font-medium active:scale-95 transition-transform">View All</button>
            </div>
            <button
              onClick={() => navigate('newsDetail', { article: latestNews })}
              className="w-full bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border overflow-hidden active:scale-[0.98] transition-transform hover:shadow-md text-left"
            >
              {latestNews.image_url && (
                <img src={latestNews.image_url} alt={latestNews.title} className="w-full h-32 object-cover" />
              )}
              <div className="p-4">
                <span className="text-[10px] font-bold uppercase tracking-wide text-brand-600">
                  {new Date(latestNews.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <h3 className="text-sm font-bold text-navy-800 dark:text-dark-text leading-snug mt-1 line-clamp-2">{latestNews.title}</h3>
                <p className="text-xs text-navy-500 dark:text-dark-muted line-clamp-1 mt-1">{latestNews.excerpt}</p>
              </div>
            </button>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <h2 className="text-sm font-bold text-navy-700 dark:text-dark-text mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction icon={<BookOpen className="w-5 h-5" />} label="Browse Library" onClick={() => navigate('library')} />
            <QuickAction icon={<MessageSquare className="w-5 h-5" />} label="Open Connect+" onClick={() => navigate('connect')} />
            <QuickAction icon={<Newspaper className="w-5 h-5" />} label="View All News" onClick={() => navigate('news')} />
            <QuickAction icon={<Users className="w-5 h-5" />} label="My Profile" onClick={() => navigate('profile')} />
          </div>
        </div>

        {/* Upcoming event */}
        {upcomingEvent && (
          <div>
            <h2 className="text-sm font-bold text-navy-700 dark:text-dark-text mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-500" /> Upcoming Event
            </h2>
            <button
              onClick={() => navigate('eventDetail', { event: upcomingEvent })}
              className="w-full bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border p-4 active:scale-[0.98] transition-transform hover:shadow-md text-left flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-navy-800 dark:text-dark-text truncate">{upcomingEvent.title}</h3>
                <p className="text-xs text-navy-500 dark:text-dark-muted">
                  {upcomingEvent.event_date && new Date(upcomingEvent.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {upcomingEvent.venue && ` · ${upcomingEvent.venue}`}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-navy-300" />
            </button>
          </div>
        )}

        {/* Secondary quick links */}
        <div className="grid grid-cols-3 gap-3">
          <SecondaryLink icon={<Briefcase className="w-4 h-4" />} label="Opportunities" onClick={() => navigate('opportunities')} />
          <SecondaryLink icon={<Calendar className="w-4 h-4" />} label="Calendar" onClick={() => navigate('calendar')} />
          <SecondaryLink icon={<Users className="w-4 h-4" />} label="SUG" onClick={() => navigate('sug')} />
        </div>
      </div>
      )}
    </>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border p-3.5 active:scale-95 transition-transform hover:shadow-md">
      <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <span className="text-xs font-semibold text-navy-700 dark:text-dark-text">{label}</span>
      <ChevronRight className="w-4 h-4 text-navy-300 ml-auto" />
    </button>
  );
}

function SecondaryLink({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-navy-50 dark:bg-dark-surface border border-navy-100 dark:border-dark-border active:scale-95 transition-transform hover:shadow-sm">
      <div className="w-9 h-9 rounded-xl bg-white dark:bg-dark-surface2 text-navy-600 dark:text-dark-muted flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <span className="text-[11px] font-medium text-navy-600 dark:text-dark-muted text-center">{label}</span>
    </button>
  );
}
