import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/States';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { CalendarEntry } from '@/types';

const TYPE_COLORS: Record<string, string> = {
  event: 'bg-brand-500', holiday: 'bg-red-500', exam: 'bg-amber-500', deadline: 'bg-rose-500', meeting: 'bg-blue-500',
};

export function CalendarScreen() {
  const { showToast } = useToast();
  const { profile } = useAuth();
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const isAdmin = profile?.role === 'admin';

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('calendar_entries').select('*').order('entry_date', { ascending: true });
    if (error) setError(error.message); else setEntries(data as CalendarEntry[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const entriesByDate: Record<string, CalendarEntry[]> = {};
  entries.forEach((e) => { const k = e.entry_date; if (!entriesByDate[k]) entriesByDate[k] = []; entriesByDate[k].push(e); });

  const todayStr = new Date().toISOString().split('T')[0];
  const selectedEntries = selectedDate ? entriesByDate[selectedDate] || [] : [];
  const days: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <>
      <AppHeader title="Calendar" showBack rightAction={isAdmin ? (
        <button onClick={() => setShowForm(true)} className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center active:scale-90 transition-transform"><Plus className="w-5 h-5" /></button>
      ) : undefined} />
      <div className="pb-20">
        {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} /> : (
          <div className="px-4 pt-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="w-9 h-9 rounded-xl bg-navy-100 dark:bg-dark-surface2 flex items-center justify-center text-navy-600 dark:text-dark-muted"><ChevronLeft className="w-4 h-4" /></button>
              <h3 className="text-base font-bold text-navy-800 dark:text-dark-text">{monthName}</h3>
              <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="w-9 h-9 rounded-xl bg-navy-100 dark:bg-dark-surface2 flex items-center justify-center text-navy-600 dark:text-dark-muted"><ChevronRight className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center text-[10px] font-bold text-navy-400 dark:text-dark-muted py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                if (!day) return <div key={i} />;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasEvents = !!entriesByDate[dateStr];
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                return (
                  <button key={i} onClick={() => setSelectedDate(dateStr)}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-colors ${
                      isSelected ? 'bg-brand-600 text-white' : isToday ? 'bg-brand-50 text-brand-700 border border-brand-300' : 'text-navy-700 dark:text-dark-text hover:bg-navy-50 dark:hover:bg-dark-surface2'
                    }`}>
                    <span className="font-medium">{day}</span>
                    {hasEvents && <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : TYPE_COLORS[entriesByDate[dateStr][0].type] || 'bg-brand-500'}`} />}
                  </button>
                );
              })}
            </div>

            {selectedDate && (
              <div className="mt-5">
                <h4 className="text-sm font-bold text-navy-700 dark:text-dark-text mb-2">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h4>
                {selectedEntries.length === 0 ? <p className="text-xs text-navy-400 dark:text-dark-muted">No events on this date.</p> : (
                  <div className="space-y-2">
                    {selectedEntries.map((entry) => (
                      <div key={entry.id} className="bg-white dark:bg-dark-surface rounded-xl border border-navy-100 dark:border-dark-border p-3 flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${TYPE_COLORS[entry.type] || 'bg-brand-500'}`} />
                        <div><h5 className="text-sm font-semibold text-navy-800 dark:text-dark-text">{entry.title}</h5>
                        <p className="text-xs text-navy-500 dark:text-dark-muted capitalize">{entry.type}</p>
                        {entry.description && <p className="text-xs text-navy-400 dark:text-dark-muted mt-1">{entry.description}</p>}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              {Object.entries(TYPE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1.5"><div className={`w-2.5 h-2.5 rounded-full ${color}`} /><span className="text-[10px] text-navy-500 dark:text-dark-muted capitalize">{type}</span></div>
              ))}
            </div>
          </div>
        )}
      </div>
      {showForm && isAdmin && <CalendarForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </>
  );
}

function CalendarForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({ title: '', entry_date: '', type: 'event', description: '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title || !form.entry_date) { showToast('Title and date are required', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.from('calendar_entries').insert(form);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Calendar entry added', 'success'); onSaved();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-dark-surface w-full max-w-[440px] rounded-t-3xl sm:rounded-3xl p-5 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-navy-800 dark:text-dark-text">Add Calendar Entry</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-navy-100 dark:bg-dark-surface2 flex items-center justify-center text-navy-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
          <input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500">
            <option value="event">Event</option><option value="holiday">Holiday</option><option value="exam">Exam</option><option value="deadline">Deadline</option><option value="meeting">Meeting</option>
          </select>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" rows={3} className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500 resize-none" />
          <button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-transform">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
