import { useEffect, useState, useCallback } from 'react';
import { GraduationCap, ChevronRight, Trophy, Settings2, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { AppHeader } from '@/components/AppHeader';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/States';
import { useNav } from '@/contexts/NavContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { StudyAttempt, StudySubject } from '@/types';

export function StudyScreen() {
  const { navigate } = useNav();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [attempts, setAttempts] = useState<StudyAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    const [subjectRes, attemptRes] = await Promise.all([
      supabase.from('study_subjects').select('*').order('name', { ascending: true }),
      supabase
        .from('study_attempts')
        .select('id, subject_id, score, total, created_at, study_subjects(name)')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);
    if (subjectRes.error) { setError(subjectRes.error.message); setLoading(false); return; }
    setSubjects((subjectRes.data ?? []) as StudySubject[]);
    setAttempts(attemptRes.error ? [] : ((attemptRes.data ?? []) as unknown as StudyAttempt[]));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <AppHeader
        title="Study"
        rightAction={isAdmin ? (
          <button
            onClick={() => navigate('studyAdmin')}
            aria-label="Manage study content"
            className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center active:scale-90 transition-transform"
          >
            <Settings2 className="w-5 h-5" />
          </button>
        ) : undefined}
      />
      <div className="pb-24 animate-fade-in">
        <div className="px-4 pt-4">
          <div className="rounded-3xl bg-gradient-to-br from-navy-800 to-brand-700 p-5 text-white shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold leading-tight">Test what you know</h2>
            <p className="text-sm text-white/80 mt-1 leading-relaxed">
              Pick a subject, set up a quiz, and see your score as soon as you submit.
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="px-4 pt-4"><ErrorState message={error} /></div>
        ) : (
          <>
            <section className="px-4 pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-500 dark:text-dark-muted mb-3">Subjects</h3>
              {subjects.length === 0 ? (
                <EmptyState
                  icon={<BookOpen className="w-12 h-12" />}
                  title="No Subjects Yet"
                  message="Subjects will appear here once the admin adds them."
                />
              ) : (
                <div className="space-y-2">
                  {subjects.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => navigate('studyQuiz', { subject: s })}
                      className="w-full bg-white dark:bg-dark-surface border border-navy-100 dark:border-dark-border rounded-2xl p-4 flex items-center gap-3 text-left active:scale-[0.98] transition-all duration-200 hover:border-brand-300 dark:hover:border-brand-700"
                    >
                      <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-navy-800 dark:text-dark-text truncate">{s.name}</p>
                        {s.description && (
                          <p className="text-xs text-navy-500 dark:text-dark-muted mt-0.5 line-clamp-2">{s.description}</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-navy-300 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {attempts.length > 0 && (
              <section className="px-4 pt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy-500 dark:text-dark-muted mb-3">Recent results</h3>
                <div className="bg-white dark:bg-dark-surface border border-navy-100 dark:border-dark-border rounded-2xl divide-y divide-navy-100 dark:divide-dark-border">
                  {attempts.map((a) => {
                    const pct = a.total > 0 ? Math.round((a.score / a.total) * 100) : 0;
                    return (
                      <div key={a.id} className="flex items-center gap-3 p-4">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-navy-800 dark:text-dark-text truncate">{a.study_subjects?.name ?? 'Subject'}</p>
                          <p className="text-xs text-navy-500 dark:text-dark-muted">{format(new Date(a.created_at), 'MMM d, yyyy h:mm a')}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-black text-brand-600 dark:text-brand-400">{a.score}/{a.total}</p>
                          <p className="text-[11px] text-navy-500 dark:text-dark-muted">{pct}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
