import { useEffect, useState } from 'react';
import { Calendar, Clock, Share2, Link2, ChevronLeft, Newspaper } from 'lucide-react';
import { PhoneShell } from '@/components/PhoneShell';
import { AppHeader } from '@/components/AppHeader';
import { EngagementBar } from '@/components/EngagementBar';
import { useNav } from '@/contexts/NavContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import type { NewsArticle, Profile } from '@/types';

export function NewsDetailScreen() {
  const { params, goBack, navigate } = useNav();
  const { showToast } = useToast();
  const article = params.article as NewsArticle | undefined;
  const [author, setAuthor] = useState<Profile | null>(null);
  const [related, setRelated] = useState<NewsArticle[]>([]);

  useEffect(() => {
    if (!article) return;
    if (article.author_id) {
      supabase.from('profiles').select('*').eq('id', article.author_id).maybeSingle().then(({ data }) => {
        setAuthor(data as Profile | null);
      });
    }
    supabase.from('news').select('*').neq('id', article.id).order('published_at', { ascending: false }).limit(3).then(({ data }) => {
      setRelated((data as NewsArticle[]) || []);
    });
  }, [article]);

  if (!article) {
    return (
      <PhoneShell showBottomNav={false}>
        <AppHeader title="Article" showBack />
        <div className="flex-1 flex items-center justify-center text-navy-500 dark:text-dark-muted">
          <div className="text-center">
            <Newspaper className="w-12 h-12 mx-auto mb-3 text-navy-300" />
            <p>Article not found</p>
            <button onClick={goBack} className="mt-3 text-brand-600 font-bold text-sm">Go back</button>
          </div>
        </div>
      </PhoneShell>
    );
  }

  const readTime = Math.max(1, Math.ceil(article.body.split(/\s+/).length / 200));

  const handleShare = async () => {
    const shareData = {
      title: article.title,
      text: article.excerpt || article.title,
      url: window.location.href,
    };

    // Try the Web Share API first; many mobile browsers expose it.
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return; // shared successfully
      } catch (err) {
        // AbortError means the user dismissed the share sheet — not a real error.
        if (err instanceof DOMException && err.name === 'AbortError') return;
        // Otherwise fall through to clipboard fallback.
      }
    }

    // Fallback: copy the link to the clipboard.
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareData.url);
      } else {
        // Last-resort fallback for non-secure contexts.
        const textarea = document.createElement('textarea');
        textarea.value = shareData.url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showToast('Link copied to clipboard', 'success');
    } catch {
      showToast('Could not copy link', 'error');
    }
  };

  return (
    <PhoneShell showBottomNav={false}>
      <AppHeader title="Article" showBack rightAction={
        <button onClick={handleShare} className="w-9 h-9 rounded-xl flex items-center justify-center text-navy-600 dark:text-dark-muted hover:bg-navy-100 dark:hover:bg-dark-surface active:scale-90 transition-all">
          <Share2 className="w-4.5 h-4.5" />
        </button>
      } />
      <div className="pb-20 animate-fade-in">
        {/* Hero image */}
        {article.image_url && (
          <div className="relative h-56 overflow-hidden">
            <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        <div className="px-5 py-5">
          {/* Category badge */}
          {article.category && (
            <span className="inline-block bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide mb-3">
              {article.category}
            </span>
          )}

          {/* Title */}
          <h1 className="text-xl font-bold text-navy-900 dark:text-dark-text leading-snug mb-2">{article.title}</h1>
          {article.excerpt && <p className="text-sm text-navy-500 dark:text-dark-muted leading-relaxed mb-4">{article.excerpt}</p>}

          {/* Author + meta */}
          <div className="flex items-center gap-3 pb-4 mb-2 border-b border-navy-100 dark:border-dark-border">
            <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0">
              {author?.avatar_url ? <img src={author.avatar_url} alt={author.display_name} className="w-full h-full object-cover" /> : (author?.display_name?.[0] || 'S')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-navy-800 dark:text-dark-text">{author?.display_name || 'TASFUEDSU 360'}</p>
              <p className="text-[11px] text-navy-400 dark:text-dark-muted">{author?.role === 'admin' ? 'Administrator' : 'Author'}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-navy-500 dark:text-dark-muted flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(article.published_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-[11px] text-navy-400 dark:text-dark-muted flex items-center gap-1 justify-end mt-0.5">
                <Clock className="w-3 h-3" /> {readTime} min read
              </p>
            </div>
          </div>

          {/* Article body */}
          <div className="text-sm text-navy-700 dark:text-dark-text leading-relaxed whitespace-pre-wrap mb-2">
            {article.body}
          </div>

          {/* Share button */}
          <button onClick={handleShare} className="flex items-center gap-2 text-xs text-brand-600 font-medium mt-4 mb-2">
            <Link2 className="w-3.5 h-3.5" /> Copy link
          </button>

          {/* Engagement (likes, comments auto-shown) */}
          <EngagementBar targetType="news" targetId={article.id} autoShowComments />

          {/* Related articles */}
          {related.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-bold text-navy-700 dark:text-dark-text mb-3">Related Articles</h2>
              <div className="space-y-2">
                {related.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => navigate('newsDetail', { article: r })}
                    className="w-full flex items-center gap-3 bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border p-3 active:scale-[0.98] transition-transform hover:shadow-sm text-left"
                  >
                    {r.image_url ? (
                      <img src={r.image_url} alt={r.title} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-500 flex items-center justify-center flex-shrink-0">
                        <Newspaper className="w-5 h-5" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-navy-800 dark:text-dark-text line-clamp-2">{r.title}</h3>
                      <p className="text-[11px] text-navy-400 dark:text-dark-muted mt-0.5">{new Date(r.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-navy-300 rotate-180" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PhoneShell>
  );
}
