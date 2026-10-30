import { useEffect, useState, useCallback } from 'react';
import { Newspaper, Plus, Pencil, Trash2, X, Heart, MessageCircle, Search, TrendingUp, RefreshCw, Loader2 } from 'lucide-react';
import { ScreenWrapper } from '@/components/ScreenLayout';
import { AppHeader } from '@/components/AppHeader';
import { LoadingSpinner, EmptyState, ErrorState, SkeletonList } from '@/components/States';
import { FileUpload } from '@/components/FileUpload';
import { useNav } from '@/contexts/NavContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEngagementCounts } from '@/hooks/useEngagementCounts';
import { supabase } from '@/lib/supabase';
import type { NewsArticle } from '@/types';

type FilterTab = 'all' | 'announcement' | 'news' | 'event';

export function NewsScreen() {
  const { navigate } = useNav();
  const { showToast } = useToast();
  const { profile } = useAuth();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<NewsArticle | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('published_at', { ascending: false });
    if (error) setError(error.message);
    else setArticles(data as NewsArticle[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
    showToast('News refreshed', 'success');
  };

  const targetIds = articles.map((a) => a.id);
  const { counts } = useEngagementCounts('news', targetIds);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Article deleted', 'success');
    load();
  };

  const isAdmin = profile?.role === 'admin';

  const filtered = articles.filter((a) => {
    if (filter !== 'all' && a.category !== filter) return false;
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const featured = filtered[0];
  const rest = filtered.slice(1);

  const FILTERS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'announcement', label: 'Announcements' },
    { key: 'news', label: 'News' },
    { key: 'event', label: 'Events' },
  ];

  return (
    <>
      <AppHeader
        title="News & Announcements"
        showBack={false}
        rightAction={
          <div className="flex items-center gap-1">
            <button onClick={handleRefresh} disabled={refreshing} className="w-9 h-9 rounded-xl flex items-center justify-center text-navy-600 dark:text-dark-muted hover:bg-navy-100 dark:hover:bg-dark-surface active:scale-90 transition-all">
              {refreshing ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <RefreshCw className="w-4.5 h-4.5" />}
            </button>
            {isAdmin ? (
              <button onClick={() => { setEditing(null); setShowForm(true); }} className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center active:scale-90 transition-transform">
                <Plus className="w-5 h-5" />
              </button>
            ) : undefined}
          </div>
        }
      />
      <div className="pb-20">
        {/* Search */}
        <div className="px-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-navy-50 dark:bg-dark-surface border border-navy-100 dark:border-dark-border text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="px-4 mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filter === f.key
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-navy-100 dark:bg-dark-surface text-navy-500 dark:text-dark-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="px-4 mt-4"><SkeletonList count={3} /></div>
        ) : error ? (
          <ErrorState message={error} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Newspaper className="w-8 h-8" />} title="No News Yet" message="Check back later for the latest updates." />
        ) : (
          <div className="px-4 mt-4 space-y-3">
            {/* Featured article */}
            {featured && (
              <button
                onClick={() => navigate('newsDetail', { article: featured })}
                className="w-full bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border overflow-hidden active:scale-[0.98] transition-transform hover:shadow-lg text-left animate-scale-in"
              >
                {featured.image_url && (
                  <div className="relative">
                    <img src={featured.image_url} alt={featured.title} className="w-full h-48 object-cover" />
                    <div className="absolute top-3 left-3 bg-brand-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Featured
                    </div>
                  </div>
                )}
                <div className="p-4">
                  {featured.category && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-brand-600">{featured.category}</span>
                  )}
                  <h3 className="text-base font-bold text-navy-800 dark:text-dark-text leading-snug mt-1">{featured.title}</h3>
                  <p className="text-xs text-navy-500 dark:text-dark-muted line-clamp-2 mt-1">{featured.excerpt}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="flex items-center gap-1.5 text-[11px] text-navy-400 dark:text-dark-muted">
                      <Heart className="w-3 h-3 text-red-400" /> {counts[featured.id]?.likes || 0}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-navy-400 dark:text-dark-muted">
                      <MessageCircle className="w-3 h-3 text-brand-500" /> {counts[featured.id]?.comments || 0}
                    </span>
                    <span className="text-[11px] text-navy-400 dark:text-dark-muted ml-auto">
                      {new Date(featured.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </button>
            )}

            {/* Rest of articles */}
            {rest.map((article) => (
              <div key={article.id} className="bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border overflow-hidden active:scale-[0.98] transition-transform hover:shadow-md">
                <button onClick={() => navigate('newsDetail', { article })} className="w-full text-left">
                  {article.image_url && (
                    <img src={article.image_url} alt={article.title} className="w-full h-32 object-cover" />
                  )}
                  <div className="p-3.5">
                    <div className="flex items-center gap-2 mb-1">
                      {article.category && (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-brand-600">{article.category}</span>
                      )}
                      <span className="text-[10px] text-navy-400 dark:text-dark-muted">
                        {new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-navy-800 dark:text-dark-text leading-snug line-clamp-2">{article.title}</h3>
                    <p className="text-xs text-navy-500 dark:text-dark-muted line-clamp-2 mt-1">{article.excerpt}</p>
                    <div className="flex items-center gap-4 mt-2.5">
                      <span className="flex items-center gap-1.5 text-[11px] text-navy-400 dark:text-dark-muted">
                        <Heart className="w-3 h-3 text-red-400" /> {counts[article.id]?.likes || 0}
                      </span>
                      <span className="flex items-center gap-1.5 text-[11px] text-navy-400 dark:text-dark-muted">
                        <MessageCircle className="w-3 h-3 text-brand-500" /> {counts[article.id]?.comments || 0}
                      </span>
                    </div>
                  </div>
                </button>
                {isAdmin && (
                  <div className="flex gap-3 px-3.5 pb-3 pt-1 border-t border-navy-50 dark:border-dark-border/50">
                    <button onClick={() => { setEditing(article); setShowForm(true); }} className="flex items-center gap-1 text-[11px] text-brand-600 font-medium">
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => handleDelete(article.id)} className="flex items-center gap-1 text-[11px] text-red-500 font-medium">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && isAdmin && (
        <NewsForm article={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />
      )}
    </>
  );
}

function NewsForm({ article, onClose, onSaved }: { article: NewsArticle | null; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    title: article?.title || '',
    excerpt: article?.excerpt || '',
    body: article?.body || '',
    image_url: article?.image_url || '',
    category: article?.category || 'announcement',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title) { showToast('Title is required', 'error'); return; }
    setSaving(true);
    const payload = { ...form, excerpt: form.excerpt || form.body.slice(0, 100) };
    const { error } = article
      ? await supabase.from('news').update(payload).eq('id', article.id)
      : await supabase.from('news').insert(payload);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast(article ? 'Article updated' : 'Article published', 'success');
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-dark-surface w-full max-w-[440px] rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-navy-800 dark:text-dark-text">{article ? 'Edit Article' : 'New Article'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-navy-100 dark:bg-dark-surface2 flex items-center justify-center text-navy-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Article title" className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500">
              <option value="announcement">Announcement</option>
              <option value="news">News</option>
              <option value="event">Event</option>
            </select>
          </div>
          <FileUpload label="Cover Image" currentUrl={form.image_url} onUploaded={(url) => setForm({ ...form, image_url: url })} folder="news" />
          <div>
            <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Short Excerpt</label>
            <input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Brief summary" className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Full Article Body</label>
            <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write the full article..." rows={6} className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500 resize-none" />
          </div>
          <button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-transform">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
