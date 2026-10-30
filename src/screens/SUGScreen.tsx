import { useEffect, useState, useCallback } from 'react';
import { Users, Plus, Pencil, Trash2, X } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/States';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { SUGMember } from '@/types';

export function SUGScreen() {
  const { showToast } = useToast();
  const { profile } = useAuth();
  const [members, setMembers] = useState<SUGMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'current' | 'past'>('current');
  const [editing, setEditing] = useState<SUGMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const isAdmin = profile?.role === 'admin';

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('sug_members').select('*').order('created_at', { ascending: true });
    if (error) setError(error.message); else setMembers(data as SUGMember[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('sug_members').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Member removed', 'success'); load();
  };

  const filtered = members.filter((m) => m.status === tab);

  return (
    <>
      <AppHeader title="SUG Administration" showBack rightAction={isAdmin ? (
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center active:scale-90 transition-transform"><Plus className="w-5 h-5" /></button>
      ) : undefined} />

      <div className="px-4 pt-4 mb-3 flex gap-2">
        <button onClick={() => setTab('current')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${tab === 'current' ? 'bg-brand-600 text-white' : 'bg-navy-100 dark:bg-dark-surface2 text-navy-600 dark:text-dark-muted'}`}>Current</button>
        <button onClick={() => setTab('past')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${tab === 'past' ? 'bg-brand-600 text-white' : 'bg-navy-100 dark:bg-dark-surface2 text-navy-600 dark:text-dark-muted'}`}>Past</button>
      </div>

      {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} /> : filtered.length === 0 ? (
        <EmptyState icon={<Users className="w-12 h-12" />} title="No Members" message={`No ${tab} administration members.`} />
      ) : (
        <div className="px-4 space-y-3 pb-20">
          {filtered.map((member) => (
            <div key={member.id} className="bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border p-4 flex items-center gap-3 active:scale-[0.98] transition-transform">
              <div className="w-14 h-14 rounded-full bg-navy-100 dark:bg-dark-surface2 overflow-hidden flex-shrink-0">
                {member.photo_url ? <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" /> : (
                  <div className="w-full h-full flex items-center justify-center text-navy-300 dark:text-dark-muted"><Users className="w-6 h-6" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-navy-800 dark:text-dark-text truncate">{member.name}</h3>
                <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">{member.position}</p>
                {member.term && <p className="text-xs text-navy-400 dark:text-dark-muted">Term: {member.term}</p>}
              </div>
              {isAdmin && (
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => { setEditing(member); setShowForm(true); }} className="text-blue-500"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(member.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {showForm && isAdmin && <SUGForm member={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </>
  );
}

function SUGForm({ member, onClose, onSaved }: { member: SUGMember | null; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: member?.name || '', position: member?.position || '', photo_url: member?.photo_url || '',
    term: member?.term || '', status: (member?.status || 'current') as 'current' | 'past',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.position) { showToast('Name and position are required', 'error'); return; }
    setSaving(true);
    const { error } = member ? await supabase.from('sug_members').update(form).eq('id', member.id) : await supabase.from('sug_members').insert(form);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast(member ? 'Member updated' : 'Member added', 'success'); onSaved();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-dark-surface w-full max-w-[440px] rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-navy-800 dark:text-dark-text">{member ? 'Edit' : 'Add'} Member</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-navy-100 dark:bg-dark-surface2 flex items-center justify-center text-navy-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
          <input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Position" className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
          <input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="Photo URL (optional)" className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
          <input value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} placeholder="Term (e.g. 2025/2026)" className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'current' | 'past' })} className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500">
            <option value="current">Current</option><option value="past">Past</option>
          </select>
          <button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-transform">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
