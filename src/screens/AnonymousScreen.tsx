import { useState } from 'react';
import { Ghost, Send, Search, Tag, CheckCircle, Loader2, Gavel } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { LoadingSpinner } from '@/components/States';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import type { AnonymousSubmission } from '@/types';

const CATEGORIES = ['Complaint', 'Suggestion', 'Feedback', 'Report', 'Appreciation'];

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: <Send className="w-3 h-3" /> },
  under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700', icon: <Loader2 className="w-3 h-3" /> },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="w-3 h-3" /> },
  closed: { label: 'Closed', color: 'bg-navy-200 text-navy-600', icon: <Gavel className="w-3 h-3" /> },
};

export function AnonymousScreen() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<'submit' | 'track'>('submit');
  const [category, setCategory] = useState('Complaint');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [trackCode, setTrackCode] = useState('');
  const [trackResult, setTrackResult] = useState<AnonymousSubmission | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');

  const generateTrackingCode = () => 'TAS' + Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) { showToast('Please enter a message', 'error'); return; }
    setSubmitting(true);
    const code = generateTrackingCode();
    const { error } = await supabase.from('anonymous_submissions').insert({ category: category.toLowerCase(), message: message.trim(), tracking_code: code, status: 'submitted' });
    setSubmitting(false);
    if (error) { showToast(error.message, 'error'); return; }
    setTrackingCode(code); setSubmitted(true); setMessage(''); setCategory('Complaint');
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackCode.trim()) { showToast('Enter your tracking code', 'error'); return; }
    setTrackLoading(true); setTrackError(''); setTrackResult(null);
    const { data, error } = await supabase.from('anonymous_submissions').select('*').eq('tracking_code', trackCode.trim().toUpperCase()).maybeSingle();
    setTrackLoading(false);
    if (error) { setTrackError('Unable to search. Please try again.'); return; }
    if (!data) { setTrackError('No submission found with that tracking code.'); return; }
    setTrackResult(data as AnonymousSubmission);
  };

  return (
    <>
      <AppHeader title="Anonymous Desk" showBack />
      <p className="px-4 pt-2 text-xs text-navy-500 dark:text-dark-muted">Submit complaints, suggestions, or feedback completely anonymously. Your identity is never recorded.</p>

      <div className="px-4 pt-4 mb-4 flex gap-2">
        <button onClick={() => setTab('submit')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${tab === 'submit' ? 'bg-brand-600 text-white' : 'bg-navy-100 dark:bg-dark-surface text-navy-600 dark:text-dark-muted'}`}>
          <Send className="inline mr-1.5 w-3.5 h-3.5" /> Submit
        </button>
        <button onClick={() => setTab('track')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${tab === 'track' ? 'bg-brand-600 text-white' : 'bg-navy-100 dark:bg-dark-surface text-navy-600 dark:text-dark-muted'}`}>
          <Search className="inline mr-1.5 w-3.5 h-3.5" /> Track
        </button>
      </div>

      {tab === 'submit' ? (
        submitted ? (
          <div className="px-4 py-6 text-center">
            <div className="w-20 h-20 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 flex items-center justify-center mx-auto mb-4 animate-scale-in"><Send className="w-8 h-8" /></div>
            <h3 className="text-lg font-bold text-navy-800 dark:text-dark-text mb-2">Submission Received</h3>
            <p className="text-sm text-navy-500 dark:text-dark-muted mb-4">Your message has been sent to the SUG admin team anonymously. Save your tracking code to check the status later.</p>
            <div className="bg-navy-50 dark:bg-dark-surface border border-navy-200 dark:border-dark-border rounded-2xl p-4 mb-4">
              <p className="text-xs text-navy-500 dark:text-dark-muted mb-1">Your Tracking Code</p>
              <p className="text-2xl font-black text-brand-600 tracking-wider">{trackingCode}</p>
              <p className="text-[10px] text-navy-400 mt-1">Keep this code to track your submission status</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setSubmitted(false); setTab('track'); setTrackCode(trackingCode); }} className="flex-1 bg-navy-100 dark:bg-dark-surface text-navy-700 dark:text-dark-text font-bold py-3 rounded-xl active:scale-95 transition-transform text-sm">Track Now</button>
              <button onClick={() => setSubmitted(false)} className="flex-1 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3 rounded-xl active:scale-95 transition-transform text-sm">Submit Another</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-4 space-y-4 pb-20">
            <div>
              <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button key={cat} type="button" onClick={() => setCategory(cat)} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${category === cat ? 'bg-brand-600 text-white' : 'bg-navy-100 dark:bg-dark-surface text-navy-600 dark:text-dark-muted'}`}>{cat}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Message</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message here..." rows={8} className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500 resize-none" />
            </div>
            <div className="bg-brand-50 dark:bg-dark-surface rounded-xl p-3 flex items-center gap-2 border border-brand-100 dark:border-dark-border">
              <Ghost className="text-brand-600 w-4 h-4 flex-shrink-0" />
              <p className="text-xs text-brand-700 dark:text-brand-400">Your submission is 100% anonymous. No personal data is collected. You'll receive a tracking code to check status.</p>
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3.5 rounded-xl active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <LoadingSpinner text="" /> : <><Send className="w-4 h-4" /> Submit Anonymously</>}
            </button>
          </form>
        )
      ) : (
        <div className="px-4 space-y-4 pb-20">
          <form onSubmit={handleTrack} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Enter Your Tracking Code</label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400 w-4 h-4" />
                <input value={trackCode} onChange={(e) => setTrackCode(e.target.value)} placeholder="e.g. TASAB12CD" className="w-full pl-10 pr-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500 uppercase tracking-wider font-mono" />
              </div>
            </div>
            <button type="submit" disabled={trackLoading} className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3.5 rounded-xl active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
              {trackLoading ? <LoadingSpinner text="" /> : <><Search className="w-4 h-4" /> Check Status</>}
            </button>
          </form>

          {trackError && <div className="bg-red-50 dark:bg-dark-surface border border-red-200 dark:border-dark-border rounded-xl p-4 text-center"><p className="text-sm text-red-600 dark:text-red-400">{trackError}</p></div>}

          {trackResult && (
            <div className="bg-white dark:bg-dark-surface border border-navy-100 dark:border-dark-border rounded-2xl p-4 animate-scale-in">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-brand-100 text-brand-700">{trackResult.category}</span>
                {(() => { const meta = STATUS_META[trackResult.status] || STATUS_META.submitted; return <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${meta.color}`}>{meta.icon} {meta.label}</span>; })()}
              </div>
              <p className="text-sm text-navy-700 dark:text-dark-text leading-relaxed whitespace-pre-wrap mb-3">{trackResult.message}</p>
              {trackResult.admin_response && (
                <div className="bg-brand-50 dark:bg-dark-surface2 rounded-xl p-3 mb-3 border border-brand-100 dark:border-dark-border">
                  <p className="text-[10px] font-bold text-brand-600 uppercase mb-1">Admin Response</p>
                  <p className="text-xs text-navy-700 dark:text-dark-text leading-relaxed">{trackResult.admin_response}</p>
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-navy-400 dark:text-dark-muted">
                <span>Code: <span className="font-mono font-bold text-brand-600">{trackResult.tracking_code}</span></span>
                <span>{new Date(trackResult.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
