import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, CheckCircle2, BookOpen } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { StudyQuestionForm } from '@/components/StudyQuestionForm';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/States';
import { useNav } from '@/contexts/NavContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import type { StudyQuestion, StudySubject } from '@/types';

export function StudyAdminSubjectScreen() {
  const { params } = useNav();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const subject = params.subject as StudySubject | undefined;
  const [questions, setQuestions] = useState<StudyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<StudyQuestion | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    if (!subject) return;
    const { data, error } = await supabase
      .from('study_questions')
      .select('*')
      .eq('subject_id', subject.id)
      .order('created_at', { ascending: true });
    if (error) setError(error.message); else setQuestions((data ?? []) as StudyQuestion[]);
    setLoading(false);
  }, [subject]);

  useEffect(() => { load(); }, [load]);

  if (!subject) {
    return (
      <>
        <AppHeader title="Question Bank" showBack />
        <div className="px-4 pt-6"><ErrorState message="This subject could not be found." /></div>
      </>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <>
        <AppHeader title="Question Bank" showBack />
        <div className="px-4 pt-6"><ErrorState message="Only administrators can manage questions." /></div>
      </>
    );
  }

  const handleDelete = async (q: StudyQuestion) => {
    if (!window.confirm('Delete this question from the bank?')) return;
    const { error } = await supabase.from('study_questions').delete().eq('id', q.id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Question deleted', 'success');
    load();
  };

  return (
    <>
      <AppHeader
        title={subject.name}
        showBack
        rightAction={
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            aria-label="Add question"
            className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center active:scale-90 transition-transform"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />
      <div className="pb-24 px-4 pt-4 space-y-3 animate-fade-in">
        <p className="text-xs text-navy-500 dark:text-dark-muted">
          {questions.length} question{questions.length === 1 ? '' : 's'} in the bank. Students get random questions from here when they start a quiz.
        </p>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState message={error} />
        ) : questions.length === 0 ? (
          <EmptyState icon={<BookOpen className="w-12 h-12" />} title="No Questions" message="Add questions and their answers to build this subject's bank." />
        ) : (
          questions.map((q, i) => (
            <div key={q.id} className="bg-white dark:bg-dark-surface border border-navy-100 dark:border-dark-border rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-xs font-black text-brand-400 flex-shrink-0 mt-0.5">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy-800 dark:text-dark-text leading-snug">{q.question}</p>
                  <div className="mt-2 space-y-1">
                    {q.options.map((opt, idx) => (
                      <p
                        key={idx}
                        className={`text-xs flex items-center gap-1.5 ${idx === q.correct_index ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-navy-500 dark:text-dark-muted'}`}
                      >
                        {idx === q.correct_index && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />}
                        <span className="truncate">{String.fromCharCode(65 + idx)}. {opt}</span>
                      </p>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => { setEditing(q); setShowForm(true); }}
                    aria-label="Edit question"
                    className="w-7 h-7 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(q)}
                    aria-label="Delete question"
                    className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <StudyQuestionForm
          subjectId={subject.id}
          question={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </>
  );
}
