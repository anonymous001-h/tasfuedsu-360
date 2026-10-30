import { useEffect, useState, useCallback } from 'react';
import { Clock, MapPin, Calendar, Plus, Pencil, Trash2, X, Heart, MessageCircle } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { LoadingSpinner, EmptyState, ErrorState, SkeletonList } from '@/components/States';
import { FileUpload } from '@/components/FileUpload';
import { useEngagementCounts } from '@/hooks/useEngagementCounts';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNav } from '@/contexts/NavContext';
import { supabase } from '@/lib/supabase';
import type { EventItem } from '@/types';

export function EventsScreen() {
  const { navigate } = useNav();
  const { showToast } = useToast();
  const { profile } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const isAdmin = profile?.role === 'admin';

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('events').select('*').order('event_date', { ascending: true });
    if (error) setError(error.message);
    else setEvents(data as EventItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const targetIds = events.map((e) => e.id);
  const { counts } = useEngagementCounts('event', targetIds);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Event deleted', 'success');
    load();
  };

  const now = new Date();
  const upcoming = events.filter((e) => !e.event_date || new Date(e.event_date) >= now);
  const past = events.filter((e) => e.event_date && new Date(e.event_date) < now);

  return (
    <>
      <AppHeader
        title="Events"
        showBack={false}
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
        ) : events.length === 0 ? (
          <EmptyState icon={<Clock className="w-8 h-8" />} title="No Events" message="Upcoming events will appear here." />
        ) : (
          <div className="px-4 space-y-4 pt-4">
            {upcoming.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500" /> Upcoming
                </h3>
                <div className="space-y-2.5">
                  {upcoming.map((event) => (
                    <EventCard key={event.id} event={event} likeCount={counts[event.id]?.likes || 0} commentCount={counts[event.id]?.comments || 0} onClick={() => navigate('eventDetail', { event })} isAdmin={isAdmin} onEdit={() => { setEditing(event); setShowForm(true); }} onDelete={() => handleDelete(event.id)} />
                  ))}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-navy-400 dark:text-dark-muted uppercase tracking-wide mb-2">Past Events</h3>
                <div className="space-y-2.5">
                  {past.map((event) => (
                    <EventCard key={event.id} event={event} likeCount={counts[event.id]?.likes || 0} commentCount={counts[event.id]?.comments || 0} onClick={() => navigate('eventDetail', { event })} isAdmin={isAdmin} onEdit={() => { setEditing(event); setShowForm(true); }} onDelete={() => handleDelete(event.id)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && isAdmin && <EventForm event={editing} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load(); }} />}
    </>
  );
}

function EventCard({ event, likeCount, commentCount, onClick, isAdmin, onEdit, onDelete }: { event: EventItem; likeCount: number; commentCount: number; onClick: () => void; isAdmin: boolean; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border overflow-hidden active:scale-[0.98] transition-transform hover:shadow-md">
      <button onClick={onClick} className="w-full text-left">
        {event.image_url && (
          <div className="relative">
            <img src={event.image_url} alt={event.title} className="w-full h-32 object-cover" />
            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 text-white text-[10px] font-bold">
              {event.event_date && new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </div>
        )}
        <div className="p-3.5">
          {!event.image_url && event.event_date && (
            <div className="flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 mb-1.5 font-medium">
              <Calendar className="w-3 h-3" />
              <span>{new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              {event.event_time && <><span className="text-navy-300">·</span><Clock className="w-3 h-3 ml-0.5" /><span>{event.event_time}</span></>}
            </div>
          )}
          <h3 className="text-sm font-bold text-navy-800 dark:text-dark-text mb-1">{event.title}</h3>
          {event.venue && <p className="text-xs text-navy-500 dark:text-dark-muted flex items-center gap-1"><MapPin className="w-3 h-3" /> {event.venue}</p>}
        </div>
      </button>
      <div className="flex items-center gap-4 px-3.5 pb-3 pt-1 border-t border-navy-50 dark:border-dark-border/50">
        <span className="flex items-center gap-1.5 text-[11px] text-navy-400 dark:text-dark-muted">
          <Heart className="w-3 h-3 text-red-400" /> {likeCount}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-navy-400 dark:text-dark-muted">
          <MessageCircle className="w-3 h-3 text-brand-500" /> {commentCount}
        </span>
        {isAdmin && (
          <div className="flex gap-3 ml-auto">
            <button onClick={onEdit} className="flex items-center gap-1 text-[11px] text-brand-600 font-medium"><Pencil className="w-3 h-3" /> Edit</button>
            <button onClick={onDelete} className="flex items-center gap-1 text-[11px] text-red-500 font-medium"><Trash2 className="w-3 h-3" /> Delete</button>
          </div>
        )}
      </div>
    </div>
  );
}

function EventForm({ event, onClose, onSaved }: { event: EventItem | null; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    title: event?.title || '',
    event_date: event?.event_date || '',
    event_time: event?.event_time || '',
    venue: event?.venue || '',
    description: event?.description || '',
    image_url: event?.image_url || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title) { showToast('Title is required', 'error'); return; }
    setSaving(true);
    const payload = { ...form, event_date: form.event_date || null };
    const { error } = event ? await supabase.from('events').update(payload).eq('id', event.id) : await supabase.from('events').insert(payload);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast(event ? 'Event updated' : 'Event created', 'success');
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-dark-surface w-full max-w-[440px] rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-navy-800 dark:text-dark-text">{event ? 'Edit Event' : 'New Event'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-navy-100 dark:bg-dark-surface2 flex items-center justify-center text-navy-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Event Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event title" className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Date</label>
              <input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Time</label>
              <input value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} placeholder="e.g. 10AM" className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Venue</label>
            <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="Venue" className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
          </div>
          <FileUpload label="Event Image" currentUrl={form.image_url} onUploaded={(url) => setForm({ ...form, image_url: url })} folder="events" />
          <div>
            <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={4} className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500 resize-none" />
          </div>
          <button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-transform">{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
