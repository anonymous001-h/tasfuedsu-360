import { useEffect, useState, useCallback } from 'react';
import { Ghost, CheckCircle, Send, X, ChevronDown } from 'lucide-react';
import { PhoneShell } from '@/components/PhoneShell';
import { LoadingSpinner, EmptyState } from '@/components/States';
import { useNav } from '@/contexts/NavContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import type { AnonymousSubmission } from '@/types';

const STATUSES = ['submitted', 'under_review', 'resolved', 'closed'];
const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-700', under_review: 'bg-amber-100 text-amber-700',
  resolved: 'bg-emerald-100 text-emerald-700', closed: 'bg-navy-200 text-navy-600',
};

export function AdminAnonymousScreen() {
  const { goBack } = useNav();
  const { showToast } = useToast();
  const [submissions, setSubmissions] = useState<AnonymousSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondTo, setRespondTo] = useState<AnonymousSubmission | null>(null);
  const [response, setResponse] = useState('');
  const [statusFor, setStatusFor] = useState<AnonymousSubmission | null>(null);
  const [newStatus, setNewStatus] = useState('resolved');
  const [savingResponse, setSavingResponse] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('anonymous_submissions').select('*').order('created_at', { ascending: false });
    if (error) { showToast(error.message, 'error'); return; }
    setSubmissions(data as AnonymousSubmission[]); setLoading(false);
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const handleSaveResponse = async () => {
    if (!respondTo) return;
    if (!response.trim()) { showToast('Enter a response', 'error'); return; }
    setSavingResponse(true);
    const { error } = await supabase.from('anonymous_submissions').update({ admin_response: response.trim(), status: 'resolved', reviewed: true }).eq('id', respondTo.id);
    setSavingResponse(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Response sent', 'success'); setRespondTo(null); setResponse(''); load();
  };

  const handleUpdateStatus = async () => {
    if (!statusFor) return;
    const updates: Partial<AnonymousSubmission> = { status: newStatus as AnonymousSubmission['status'] };
    if (newStatus === 'resolved' || newStatus === 'closed') updates.reviewed = true;
    const { error } = await supabase.from('anonymous_submissions').update(updates).eq('id', statusFor.id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Status updated', 'success'); setStatusFor(null); load();
  };

  return (
    <PhoneShell showBottomNav={false}>
      <div className="flex-1 flex flex-col bg-navy-50 dark:bg-dark-bg overflow-y-auto pb-20">
        <div className="bg-gradient-to-r from-navy-800 via-navy-900 to-navy-800 text-white px-4 py-3.5 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={goBack} className="p-1.5 -ml-1.5 rounded-full hover:bg-white/10 text-white"><Ghost className="w-5 h-5" /></button>
          <h1 className="text-lg font-bold">Anonymous Submissions</h1>
        </div>

        {loading ? <LoadingSpinner text="Loading submissions..." /> : submissions.length === 0 ? (
          <EmptyState icon={<Ghost className="w-12 h-12" />} title="No Submissions" message="Anonymous feedback will appear here." />
        ) : (
          <div className="px-4 py-4 space-y-3">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-brand-100 text-brand-700">{sub.category}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[sub.status] || STATUS_STYLES.submitted}`}>{sub.status.replace('_', ' ')}</span>
                </div>
                <p className="text-sm text-navy-700 dark:text-dark-text leading-relaxed whitespace-pre-wrap mb-2">{sub.message}</p>
                {sub.tracking_code && <p className="text-[10px] text-navy-400 dark:text-dark-muted font-mono mb-2">Tracking: {sub.tracking_code}</p>}
                {sub.admin_response && (
                  <div className="bg-brand-50 dark:bg-dark-surface2 rounded-xl p-3 mb-2 border border-brand-100 dark:border-dark-border">
                    <p className="text-[10px] font-bold text-brand-600 uppercase mb-1">Admin Response</p>
                    <p className="text-xs text-navy-700 dark:text-dark-text leading-relaxed">{sub.admin_response}</p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-navy-50 dark:border-dark-border">
                  <p className="text-xs text-navy-400 dark:text-dark-muted">{new Date(sub.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <div className="flex gap-3">
                    <button onClick={() => { setRespondTo(sub); setResponse(sub.admin_response || ''); }} className="flex items-center gap-1 text-xs font-bold text-brand-600"><Send className="w-3 h-3" /> {sub.admin_response ? 'Edit Response' : 'Respond'}</button>
                    <button onClick={() => { setStatusFor(sub); setNewStatus(sub.status); }} className="flex items-center gap-1 text-xs font-bold text-blue-600">Status <ChevronDown className="w-3 h-3" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {respondTo && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in" onClick={() => setRespondTo(null)}>
          <div className="bg-white dark:bg-dark-surface w-full max-w-[440px] rounded-t-3xl sm:rounded-3xl p-5 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-navy-800 dark:text-dark-text">Respond to Submission</h3>
              <button onClick={() => setRespondTo(null)} className="w-8 h-8 rounded-full bg-navy-100 dark:bg-dark-surface2 flex items-center justify-center text-navy-500"><X className="w-4 h-4" /></button>
            </div>
            <div className="bg-navy-50 dark:bg-dark-bg rounded-xl p-3 mb-3"><p className="text-xs text-navy-500 dark:text-dark-muted leading-relaxed">{respondTo.message}</p></div>
            <textarea value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Type your response to the student..." rows={4} className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500 resize-none mb-3" />
            <button onClick={handleSaveResponse} disabled={savingResponse} className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3 rounded-xl active:scale-95 transition-transform disabled:opacity-50">{savingResponse ? 'Sending...' : 'Send Response & Mark Resolved'}</button>
          </div>
        </div>
      )}

      {statusFor && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in" onClick={() => setStatusFor(null)}>
          <div className="bg-white dark:bg-dark-surface w-full max-w-[440px] rounded-t-3xl sm:rounded-3xl p-5 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-navy-800 dark:text-dark-text">Update Status</h3>
              <button onClick={() => setStatusFor(null)} className="w-8 h-8 rounded-full bg-navy-100 dark:bg-dark-surface2 flex items-center justify-center text-navy-500"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-navy-400 dark:text-dark-muted mb-3 font-mono">Code: {statusFor.tracking_code}</p>
            <div className="space-y-2 mb-4">
              {STATUSES.map((s) => (
                <button key={s} onClick={() => setNewStatus(s)} className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${newStatus === s ? 'bg-brand-600 text-white' : 'bg-navy-100 dark:bg-dark-surface2 text-navy-600 dark:text-dark-muted'}`}>{s.replace('_', ' ')}</button>
              ))}
            </div>
            <button onClick={handleUpdateStatus} className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3 rounded-xl active:scale-95 transition-transform">Update Status</button>
          </div>
        </div>
      )}
    </PhoneShell>
  );
}
