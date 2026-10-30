import { useState, useEffect, useCallback } from 'react';
import { Search, Newspaper, BookOpen, Clock, Briefcase, Users } from 'lucide-react';
import { PhoneShell } from '@/components/PhoneShell';
import { AppHeader } from '@/components/AppHeader';
import { LoadingSpinner, EmptyState } from '@/components/States';
import { useNav } from '@/contexts/NavContext';
import { supabase } from '@/lib/supabase';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'news' | 'library' | 'events' | 'opportunities' | 'sug';
  data: unknown;
}

const TYPE_META: Record<string, { icon: React.ReactNode; color: string; screen: string }> = {
  news: { icon: <Newspaper className="w-4 h-4" />, color: 'bg-brand-500', screen: 'newsDetail' },
  library: { icon: <BookOpen className="w-4 h-4" />, color: 'bg-teal-500', screen: 'libraryDetail' },
  events: { icon: <Clock className="w-4 h-4" />, color: 'bg-amber-500', screen: 'eventDetail' },
  opportunities: { icon: <Briefcase className="w-4 h-4" />, color: 'bg-purple-500', screen: 'opportunityDetail' },
  sug: { icon: <Users className="w-4 h-4" />, color: 'bg-teal-500', screen: 'sug' },
};

const TYPE_LABELS: Record<string, string> = {
  news: 'News', library: 'Library', events: 'Events', opportunities: 'Opportunities', sug: 'SUG Members',
};

export function SearchScreen() {
  const { params, navigate } = useNav();
  const [query, setQuery] = useState((params.q as string) || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    const term = q.trim().toLowerCase();
    const all: SearchResult[] = [];

    const [newsRes, libRes, evtRes, oppRes, sugRes] = await Promise.all([
      supabase.from('news').select('*').ilike('title', `%${term}%`).limit(5),
      supabase.from('library_resources').select('*').ilike('title', `%${term}%`).limit(5),
      supabase.from('events').select('*').ilike('title', `%${term}%`).limit(5),
      supabase.from('opportunities').select('*').ilike('title', `%${term}%`).limit(5),
      supabase.from('sug_members').select('*').ilike('name', `%${term}%`).limit(5),
    ]);

    (newsRes.data || []).forEach((n) => all.push({ id: n.id, title: n.title, subtitle: n.excerpt || 'News article', type: 'news', data: n }));
    (libRes.data || []).forEach((l) => all.push({ id: l.id, title: l.title, subtitle: `${l.category} · ${l.type}`, type: 'library', data: l }));
    (evtRes.data || []).forEach((e) => all.push({ id: e.id, title: e.title, subtitle: e.venue || 'Event', type: 'events', data: e }));
    (oppRes.data || []).forEach((o) => all.push({ id: o.id, title: o.title, subtitle: o.type, type: 'opportunities', data: o }));
    (sugRes.data || []).forEach((s) => all.push({ id: s.id, title: s.name, subtitle: s.position, type: 'sug', data: s }));

    setResults(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (query) doSearch(query);
  }, [doSearch, query]);

  const grouped: Record<string, SearchResult[]> = {};
  results.forEach((r) => {
    if (!grouped[r.type]) grouped[r.type] = [];
    grouped[r.type].push(r);
  });

  const handleResultClick = (result: SearchResult) => {
    const screen = TYPE_META[result.type].screen;
    const paramKey = result.type === 'news' ? 'article' : result.type === 'library' ? 'resource' : result.type === 'events' ? 'event' : result.type === 'opportunities' ? 'opportunity' : 'member';
    navigate(screen as never, { [paramKey]: result.data });
  };

  return (
    <PhoneShell showBottomNav={false}>
      <AppHeader title="Search" showBack />
      <div className="px-4 py-4 pb-20">
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            placeholder="Search news, events, library..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-navy-50 dark:bg-dark-surface border border-navy-100 dark:border-dark-border text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500"
          />
        </div>

        {loading ? <LoadingSpinner text="Searching..." /> : searched && results.length === 0 ? (
          <EmptyState icon={<Search className="w-8 h-8" />} title="No Results" message={`No results found for "${query}"`} />
        ) : !searched ? (
          <EmptyState icon={<Search className="w-8 h-8" />} title="Search" message="Search across news, events, library, opportunities, and SUG members." />
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([type, items]) => (
              <div key={type}>
                <h3 className="text-xs font-bold text-navy-500 dark:text-dark-muted uppercase mb-2">{TYPE_LABELS[type]} ({items.length})</h3>
                <div className="space-y-2">
                  {items.map((item) => {
                    const meta = TYPE_META[item.type];
                    return (
                      <button
                        key={`${item.type}-${item.id}`}
                        onClick={() => handleResultClick(item)}
                        className="w-full bg-white dark:bg-dark-surface rounded-xl border border-navy-100 dark:border-dark-border p-3.5 flex items-center gap-3 active:scale-[0.98] transition-transform hover:shadow-sm"
                      >
                        <div className={`w-9 h-9 rounded-lg ${meta.color} text-white flex items-center justify-center flex-shrink-0`}>{meta.icon}</div>
                        <div className="flex-1 text-left min-w-0">
                          <h4 className="text-sm font-semibold text-navy-800 dark:text-dark-text truncate">{item.title}</h4>
                          <p className="text-xs text-navy-400 dark:text-dark-muted truncate">{item.subtitle}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PhoneShell>
  );
}
