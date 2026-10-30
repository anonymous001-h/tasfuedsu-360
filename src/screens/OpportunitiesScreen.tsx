import { useEffect, useState, useCallback } from 'react';
import { Briefcase, Plus, Pencil, Trash2, X, Calendar, ExternalLink } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { LoadingSpinner, EmptyState, ErrorState, SkeletonList } from '@/components/States';
import { useNav } from '@/contexts/NavContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Opportunity } from '@/types';

const TYPE_COLORS: Record<string, string> = {
  scholarship: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300',
  internship: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  volunteer: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  competition: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  grant: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
};

export function OpportunitiesScreen() {
  const { navigate } = useNav();
  const { showToast } = useToast();
  const { profile } = useAuth();
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Opportunity | null>(null);
  const [showForm, setShowForm] = useState(false);
  const isAdmin = profile?.role === 'admin';

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('opportunities').select('*').order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setItems(data as Opportunity[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('opportunities').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Opportunity deleted', 'success');
    load();
  };

  return (
    <>
      <AppHeader
        title="Opportunities"
        showBack
        rightAction={isAdmin ? (
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center active:scale-90 transition-transform">
            <Plus className="w-5 h-5" />
          </button>
        ) : undefined}
      />
      <div className="pb-20">
        {loading ? (
          <div className="px-4 pt-4"><SkeletonList count={3} /></div>
        ) : error ? (
          <ErrorState message={error} />
        ) : items.length === 0 ? (
          <EmptyState icon={<Briefcase className="w-8 h-8" />} title="No Opportunities" message="Scholarships and opportunities will appear here." />
        ) : (
          <div className="px-4 space-y-3 pt-4">
            {items.map((opp) => (
              <div key={opp.id} className="bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border p-4 active:scale-[0.98] transition-transform hover:shadow-md">
                <button onClick={() => navigate('opportunityDetail', { opportunity: opp })} className="w-full text-left">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-bold text-navy-800 dark:text-dark-text flex-1">{opp.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${TYPE_COLORS[opp.type] || 'bg-navy-100 text-navy-600'}`}>{opp.type}</span>
                  </div>
                  <p className="text-xs text-navy-500 dark:text-dark-muted line-clamp-2 mb-2">{opp.description}</p>
                  {opp.deadline && (
                    <p className="text-xs text-red-500 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Deadline: {new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  )}
                </button>
                {isAdmin && (
                  <div className="flex gap-3 mt-2 pt-2 border-t border-navy-50 dark:border-dark-border/50">
                    <button onClick={() => { setEditing(opp); setShowForm(true); }} className="flex items-center gap-1 text-[11px] text-brand-600 font-medium"><Pencil className="w-3 h-3" /> Edit</button>
                    <button onClick={() => handleDelete(opp.id)} className="flex items-center gap-1 text-[11px] text-red-500 font-medium"><Trash2 className="w-3 h-3" /> Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && isAdmin && <OppForm item={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </>
  );
}

function OppForm({ item, onClose, onSaved }: { item: Opportunity | null; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    title: item?.title || '', type: (item?.type || 'scholarship') as 'scholarship' | 'internship' | 'volunteer' | 'competition' | 'grant', deadline: item?.deadline || '',
    description: item?.description || '', link: item?.link || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title) { showToast('Title is required', 'error'); return; }
    setSaving(true);
    const payload = { ...form, deadline: form.deadline || null };
    const { error } = item ? await supabase.from('opportunities').update(payload).eq('id', item.id) : await supabase.from('opportunities').insert(payload);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast(item ? 'Updated' : 'Created', 'success');
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-dark-surface w-full max-w-[440px] rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-navy-800 dark:text-dark-text">{item ? 'Edit' : 'New'} Opportunity</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-navy-100 dark:bg-dark-surface2 flex items-center justify-center text-navy-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'scholarship' | 'internship' | 'volunteer' | 'competition' | 'grant' })} className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500">
            <option value="scholarship">Scholarship</option><option value="internship">Internship</option><option value="volunteer">Volunteer</option><option value="competition">Competition</option><option value="grant">Grant</option>
          </select>
          <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
          <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="Application link" className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={4} className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500 resize-none" />
          <button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-transform">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
