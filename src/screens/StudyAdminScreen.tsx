import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, ChevronRight, BookOpen } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/States';
import { useNav } from '@/contexts/NavContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import type { StudySubject } from '@/types';

export function StudyAdminScreen() {
  const { navigate } = useNav();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<StudySubject | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('study_subjects').select('*').order('name', { ascending: true });
    if (error) setError(error.message); else setSubjects((data ?? []) as StudySubject[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (profile?.role !== 'admin') {
    return (
      <>
        <AppHeader title="Manage Study" showBack />
        <div className="px-4 pt-6"><ErrorState message="Only administrators can manage study content." /></div>
      </>
    );
  }

  const handleDelete = async (subject: StudySubject) => {
    if (!window.confirm(`Delete "${subject.name}" and all of its questions? Student results for it will also be removed.`)) return;
    const { error } = await supabase.from('study_subjects').delete().eq('id', subject.id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Subject deleted', 'success');
    load();
  };

  return (
    <>
      <AppHeader
        title="Manage Study"
        showBack
        rightAction={
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            aria-label="Add subject"
            className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center active:scale-90 transition-transform"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />
      <div className="pb-24 px-4 pt-4 space-y-3 animate-fade-in">
        <p className="text-xs text-navy-500 dark:text-dark-muted">
          Subjects are what students can choose when they take a quiz. Open a subject to manage its question bank.
        </p>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState message={error} />
        ) : subjects.length === 0 ? (
          <EmptyState icon={<BookOpen className="w-12 h-12" />} title="No Subjects" message="Add a subject to start building a question bank." />
        ) : (
          subjects.map((s) => (
            <div key={s.id} className="bg-white dark:bg-dark-surface border border-navy-100 dark:border-dark-border rounded-2xl p-4 flex items-center gap-3">
              <button
                onClick={() => navigate('studyAdminSubject', { subject: s })}
                className="flex-1 min-w-0 flex items-center gap-3 text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-navy-800 dark:text-dark-text truncate">{s.name}</p>
                  {s.description && <p className="text-xs text-navy-500 dark:text-dark-muted truncate">{s.description}</p>}
                </div>
                <ChevronRight className="w-4 h-4 text-navy-300 flex-shrink-0" />
              </button>
              <button
                onClick={() => { setEditing(s); setShowForm(true); }}
                aria-label={`Edit ${s.name}`}
                className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(s)}
                aria-label={`Delete ${s.name}`}
                className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <SubjectForm
          subject={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </>
  );
}

function SubjectForm({ subject, onClose, onSaved }: { subject: StudySubject | null; onClose: () => void; onSaved: () => void }) {
  const { showToast } = useToast();
  const [name, setName] = useState(subject?.name ?? '');
  const [description, setDescription] = useState(subject?.description ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) { showToast('Subject name is required', 'error'); return; }
    setSaving(true);
    const payload = { name: trimmedName, description: description.trim() };
    const { error } = subject
      ? await supabase.from('study_subjects').update(payload).eq('id', subject.id)
      : await supabase.from('study_subjects').insert(payload);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast(subject ? 'Subject updated' : 'Subject added', 'success');
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-dark-surface w-full max-w-[440px] rounded-t-3xl sm:rounded-3xl p-5 animate-slide-up" role="dialog" aria-modal="true" aria-label={subject ? 'Edit subject' : 'New subject'} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-navy-800 dark:text-dark-text">{subject ? 'Edit' : 'New'} Subject</h3>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full bg-navy-100 dark:bg-dark-surface2 flex items-center justify-center text-navy-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Subject name (e.g. Biochemistry)"
            maxLength={120}
            className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description (optional)"
            rows={3}
            maxLength={300}
            className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500 resize-none"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
