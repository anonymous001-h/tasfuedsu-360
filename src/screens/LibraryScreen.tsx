import { useEffect, useState, useCallback } from 'react';
import { BookOpen, FileText, ExternalLink, Video, File, Plus, Pencil, Trash2, X, Search, Download, Link as LinkIcon } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { LoadingSpinner, EmptyState, ErrorState, SkeletonList } from '@/components/States';
import { FileUpload } from '@/components/FileUpload';
import { useNav } from '@/contexts/NavContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { LibraryResource } from '@/types';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-5 h-5" />,
  document: <File className="w-5 h-5" />,
  link: <LinkIcon className="w-5 h-5" />,
  video: <Video className="w-5 h-5" />,
};

const TYPE_COLORS: Record<string, string> = {
  pdf: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  document: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  link: 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400',
  video: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
};

export function LibraryScreen() {
  const { navigate } = useNav();
  const { showToast } = useToast();
  const { profile } = useAuth();
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<'newest' | 'downloads' | 'alpha'>('newest');
  const [editing, setEditing] = useState<LibraryResource | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [downloadCounts, setDownloadCounts] = useState<Record<string, number>>({});
  const isAdmin = profile?.role === 'admin';

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('library_resources').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setResources(data as LibraryResource[]);
    setLoading(false);

    if (data && data.length > 0) {
      const { data: dlData } = await supabase.from('download_log').select('resource_id');
      const counts: Record<string, number> = {};
      (dlData || []).forEach((d) => {
        counts[d.resource_id] = (counts[d.resource_id] || 0) + 1;
      });
      setDownloadCounts(counts);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const categories = ['All', ...Array.from(new Set(resources.map((r) => r.category)))];
  let filtered = resources.filter((r) =>
    (category === 'All' || r.category === category) &&
    (search === '' || r.title.toLowerCase().includes(search.toLowerCase()))
  );
  if (sort === 'alpha') filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
  if (sort === 'downloads') filtered = [...filtered].sort((a, b) => (downloadCounts[b.id] || 0) - (downloadCounts[a.id] || 0));

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('library_resources').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Resource deleted', 'success');
    load();
  };

  return (
    <>
      <AppHeader
        title="Library"
        showBack={false}
        rightAction={isAdmin ? (
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center active:scale-90 transition-transform">
            <Plus className="w-5 h-5" />
          </button>
        ) : undefined}
      />
      <div className="pb-20">
        <div className="px-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search resources..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-navy-50 dark:bg-dark-surface border border-navy-100 dark:border-dark-border text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
          </div>
        </div>

        <div className="px-4 mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${category === cat ? 'bg-brand-600 text-white' : 'bg-navy-100 dark:bg-dark-surface text-navy-500 dark:text-dark-muted'}`}>{cat}</button>
          ))}
        </div>

        <div className="px-4 mt-2 flex gap-2">
          {(['newest', 'downloads', 'alpha'] as const).map((s) => (
            <button key={s} onClick={() => setSort(s)} className={`px-3 py-1 rounded-lg text-[11px] font-medium ${sort === s ? 'bg-navy-200 dark:bg-dark-surface2 text-navy-700 dark:text-dark-text' : 'text-navy-400 dark:text-dark-muted'}`}>
              {s === 'newest' ? 'Newest' : s === 'downloads' ? 'Most Downloaded' : 'A-Z'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="px-4 mt-4"><SkeletonList count={3} /></div>
        ) : error ? (
          <ErrorState message={error} />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<BookOpen className="w-8 h-8" />} title="No Resources" message="Library resources will appear here." />
        ) : (
          <div className="px-4 mt-4 grid grid-cols-2 gap-3">
            {filtered.map((res) => (
              <div key={res.id} className="bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border p-3 active:scale-95 transition-transform hover:shadow-md">
                <button onClick={() => navigate('libraryDetail', { resource: res })} className="w-full text-left">
                  <div className={`w-10 h-10 rounded-xl ${TYPE_COLORS[res.type] || TYPE_COLORS.document} flex items-center justify-center mb-2`}>
                    {TYPE_ICONS[res.type] || <File className="w-5 h-5" />}
                  </div>
                  <h3 className="text-xs font-bold text-navy-800 dark:text-dark-text line-clamp-2 leading-snug">{res.title}</h3>
                  <p className="text-[10px] text-navy-400 dark:text-dark-muted mt-0.5">{res.category}</p>
                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-navy-400 dark:text-dark-muted">
                    <Download className="w-3 h-3" /> {downloadCounts[res.id] || 0}
                  </div>
                </button>
                {isAdmin && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-navy-50 dark:border-dark-border/50">
                    <button onClick={() => { setEditing(res); setShowForm(true); }} className="text-brand-600 text-[10px] flex items-center gap-1"><Pencil className="w-3 h-3" /> Edit</button>
                    <button onClick={() => handleDelete(res.id)} className="text-red-500 text-[10px] flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && isAdmin && <LibraryForm resource={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </>
  );
}

function LibraryForm({ resource, onClose, onSaved }: { resource: LibraryResource | null; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    title: resource?.title || '',
    category: resource?.category || 'General',
    type: (resource?.type || 'pdf') as 'pdf' | 'document' | 'link' | 'video',
    url: resource?.url || '',
    description: resource?.description || '',
    file_path: resource?.file_path || '',
    file_size: resource?.file_size || 0,
  });
  const [mode, setMode] = useState<'upload' | 'link'>(resource?.type === 'link' || (!resource?.file_path && !!resource?.url) ? 'link' : 'upload');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title) { showToast('Title is required', 'error'); return; }
    if (mode === 'link' && !form.url) { showToast('URL is required for link resources', 'error'); return; }
    setSaving(true);
    const { error } = resource
      ? await supabase.from('library_resources').update(form).eq('id', resource.id)
      : await supabase.from('library_resources').insert(form);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast(resource ? 'Resource updated' : 'Resource added', 'success');
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-dark-surface w-full max-w-[440px] rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-navy-800 dark:text-dark-text">{resource ? 'Edit Resource' : 'Add Resource'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-navy-100 dark:bg-dark-surface2 flex items-center justify-center text-navy-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Resource title" className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'pdf' | 'document' | 'link' | 'video' })} className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500">
                <option value="pdf">PDF</option>
                <option value="document">Document</option>
                <option value="link">Link</option>
                <option value="video">Video</option>
              </select>
            </div>
          </div>

          {form.type !== 'link' && (
            <div className="flex gap-2 mb-2">
              <button onClick={() => setMode('upload')} className={`flex-1 py-2 rounded-xl text-xs font-bold ${mode === 'upload' ? 'bg-brand-600 text-white' : 'bg-navy-100 dark:bg-dark-surface text-navy-500'}`}>Upload File</button>
              <button onClick={() => setMode('link')} className={`flex-1 py-2 rounded-xl text-xs font-bold ${mode === 'link' ? 'bg-brand-600 text-white' : 'bg-navy-100 dark:bg-dark-surface text-navy-500'}`}>Paste URL</button>
            </div>
          )}

          {mode === 'upload' && form.type !== 'link' ? (
            <FileUpload label="Upload File" accept="*/*" folder="library" currentUrl={form.url} onUploaded={(url, path) => setForm({ ...form, url, file_path: path })} />
          ) : (
            <div>
              <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Resource URL</label>
              <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3} className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500 resize-none" />
          </div>
          <button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-transform">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
