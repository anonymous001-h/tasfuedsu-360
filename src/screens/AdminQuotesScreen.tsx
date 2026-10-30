import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Quote as QuoteIcon, Check, Loader2 } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/States';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import type { Quote } from '@/types';

export function AdminQuotesScreen() {
  const { showToast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Quote | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('quotes').select('*').order('created_at', { ascending: true });
    if (error) setError(error.message); else setQuotes(data as Quote[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Quote deleted', 'success'); load();
  };

  const toggleActive = async (q: Quote) => {
    const { error } = await supabase.from('quotes').update({ is_active: !q.is_active }).eq('id', q.id);
    if (error) { showToast(error.message, 'error'); return; }
    load();
  };

  return (
    <>
      <AppHeader title="Manage Quotes" showBack rightAction={
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center active:scale-90 transition-transform">
          <Plus className="w-5 h-5" />
        </button>
      } />
      <div className="pb-20">
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs text-navy-500 dark:text-dark-muted">{quotes.length} quotes in the system. One is shown each day on the dashboard.</p>
        </div>
        {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} /> : quotes.length === 0 ? (
          <EmptyState icon={<QuoteIcon className="w-12 h-12" />} title="No Quotes" message="Add motivational quotes to display on the dashboard." />
        ) : (
          <div className="px-4 space-y-2">
            {quotes.map((q, i) => (
              <div key={q.id} className={`bg-white dark:bg-dark-surface rounded-2xl border p-4 ${q.is_active ? 'border-navy-100 dark:border-dark-border' : 'border-navy-50 dark:border-dark-border opacity-60'}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xs font-black text-brand-300 flex-shrink-0 mt-0.5">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-navy-800 dark:text-dark-text leading-relaxed italic">"{q.text}"</p>
                    <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mt-1">— {q.author}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button onClick={() => toggleActive(q)} className={`w-7 h-7 rounded-lg flex items-center justify-center ${q.is_active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-navy-100 text-navy-400 dark:bg-dark-surface2'}`}>
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { setEditing(q); setShowForm(true); }} className="w-7 h-7 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(q.id)} className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showForm && <QuoteForm quote={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </>
  );
}

function QuoteForm({ quote, onClose, onSaved }: { quote: Quote | null; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({ text: quote?.text || '', author: quote?.author || '', is_active: quote?.is_active ?? true });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.text.trim()) { showToast('Quote text is required', 'error'); return; }
    if (!form.author.trim()) { showToast('Author is required', 'error'); return; }
    setSaving(true);
    const { error } = quote ? await supabase.from('quotes').update(form).eq('id', quote.id) : await supabase.from('quotes').insert(form);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast(quote ? 'Quote updated' : 'Quote added', 'success'); onSaved();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-dark-surface w-full max-w-[440px] rounded-t-3xl sm:rounded-3xl p-5 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-navy-800 dark:text-dark-text">{quote ? 'Edit' : 'New'} Quote</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-navy-100 dark:bg-dark-surface2 flex items-center justify-center text-navy-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Quote text..." rows={3} className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500 resize-none" />
          <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Author" className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded accent-brand-600" />
            <span className="text-xs text-navy-600 dark:text-dark-muted font-medium">Active (shown on dashboard)</span>
          </label>
          <button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-transform flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
