import { useState } from 'react';
import { CheckCircle2, XCircle, ChevronLeft, ChevronRight, Loader2, RotateCcw } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { useNav } from '@/contexts/NavContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import type { QuizQuestion, QuizResult, StudySubject } from '@/types';

type Phase = 'setup' | 'taking' | 'results';

const COUNT_OPTIONS = [5, 10, 20];

function isQuizQuestion(value: unknown): value is QuizQuestion {
  if (!value || typeof value !== 'object') return false;
  const q = value as QuizQuestion;
  return typeof q.id === 'string' && typeof q.question === 'string' && Array.isArray(q.options);
}

function isQuizResult(value: unknown): value is QuizResult {
  if (!value || typeof value !== 'object') return false;
  const r = value as QuizResult;
  return typeof r.score === 'number' && typeof r.total === 'number' && Array.isArray(r.details);
}

export function StudyQuizScreen() {
  const { params, goBack } = useNav();
  const { showToast } = useToast();
  const subject = params.subject as StudySubject | undefined;

  const [phase, setPhase] = useState<Phase>('setup');
  const [count, setCount] = useState(10);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  if (!subject) {
    return (
      <>
        <AppHeader title="Quiz" showBack />
        <div className="px-4 pt-6 text-sm text-navy-600 dark:text-dark-muted">This subject could not be found.</div>
      </>
    );
  }

  const startQuiz = async () => {
    setStarting(true);
    const { data, error } = await supabase.rpc('start_quiz', { p_subject_id: subject.id, p_count: count });
    setStarting(false);
    if (error) { showToast(error.message, 'error'); return; }
    const list = Array.isArray(data) ? data.filter(isQuizQuestion) : [];
    if (list.length === 0) { showToast('No questions have been added to this subject yet', 'error'); return; }
    setQuestions(list);
    setAnswers({});
    setCurrent(0);
    setResult(null);
    setPhase('taking');
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    const payload = questions.map((q) => ({
      question_id: q.id,
      selected_index: answers[q.id] ?? null,
    }));
    const { data, error } = await supabase.rpc('submit_quiz', { p_subject_id: subject.id, p_answers: payload });
    setSubmitting(false);
    if (error) { showToast(error.message, 'error'); return; }
    if (!isQuizResult(data)) { showToast('Could not read your results. Please try again.', 'error'); return; }
    setResult(data);
    setPhase('results');
  };

  const question = questions[current];
  const answeredCount = Object.keys(answers).length;
  const isLast = current === questions.length - 1;

  const headerTitle = phase === 'setup' ? subject.name : phase === 'taking' ? 'Quiz in progress' : 'Your results';

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader title={headerTitle} showBack />

      {phase === 'setup' && (
        <div className="px-4 pt-4 pb-28 animate-fade-in">
          <div className="bg-white dark:bg-dark-surface border border-navy-100 dark:border-dark-border rounded-3xl p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">Quiz setup</p>
            <h2 className="text-lg font-bold text-navy-800 dark:text-dark-text mt-1">{subject.name}</h2>
            {subject.description && (
              <p className="text-sm text-navy-500 dark:text-dark-muted mt-1 leading-relaxed">{subject.description}</p>
            )}

            <p className="text-sm font-semibold text-navy-700 dark:text-dark-text mt-5 mb-2">How many questions?</p>
            <div role="radiogroup" aria-label="Number of questions" className="grid grid-cols-3 gap-2">
              {COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  role="radio"
                  aria-checked={count === n}
                  onClick={() => setCount(n)}
                  className={`py-3 rounded-xl text-sm font-bold border transition-all duration-200 active:scale-95 ${
                    count === n
                      ? 'bg-brand-600 border-brand-600 text-white shadow-md'
                      : 'bg-white dark:bg-dark-bg border-navy-200 dark:border-dark-border text-navy-700 dark:text-dark-text'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-navy-500 dark:text-dark-muted mt-3">
              Questions are picked at random from the question bank. If the bank has fewer, you will get all of them.
            </p>
          </div>

          <button
            onClick={startQuiz}
            disabled={starting}
            className="mt-5 w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-2xl shadow-md disabled:opacity-60 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            {starting && <Loader2 className="w-4 h-4 animate-spin" />}
            {starting ? 'Preparing quiz...' : 'Start quiz'}
          </button>
        </div>
      )}

      {phase === 'taking' && question && (
        <div className="flex-1 flex flex-col px-4 pt-4 pb-6 animate-fade-in">
          <div className="flex items-center justify-between text-xs font-semibold text-navy-500 dark:text-dark-muted mb-2">
            <span>Question {current + 1} of {questions.length}</span>
            <span>{answeredCount} answered</span>
          </div>
          <div className="h-1.5 rounded-full bg-navy-100 dark:bg-dark-surface2 overflow-hidden mb-6" role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={current + 1}>
            <div
              className="h-full bg-brand-600 transition-all duration-300"
              style={{ width: `${((current + 1) / questions.length) * 100}%` }}
            />
          </div>

          <h2 className="text-lg font-bold text-navy-800 dark:text-dark-text leading-snug mb-5">{question.question}</h2>

          <div className="space-y-2.5" role="radiogroup" aria-label="Answer options">
            {question.options.map((opt, idx) => {
              const selected = answers[question.id] === idx;
              return (
                <button
                  key={idx}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: idx }))}
                  className={`w-full text-left p-4 rounded-2xl border flex items-center gap-3 transition-all duration-200 active:scale-[0.98] ${
                    selected
                      ? 'bg-brand-50 dark:bg-brand-900/30 border-brand-600 text-brand-700 dark:text-brand-300'
                      : 'bg-white dark:bg-dark-surface border-navy-200 dark:border-dark-border text-navy-800 dark:text-dark-text hover:border-brand-300'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-navy-300 dark:border-dark-border text-navy-500'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm font-medium leading-snug">{opt}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-auto pt-8 flex items-center gap-3">
            <button
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0}
              className="flex-1 py-3 rounded-2xl border border-navy-200 dark:border-dark-border text-navy-700 dark:text-dark-text font-semibold flex items-center justify-center gap-1 disabled:opacity-40 active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            {isLast ? (
              <button
                onClick={submitQuiz}
                disabled={submitting}
                className="flex-1 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 transition-all"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            ) : (
              <button
                onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
                className="flex-1 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold flex items-center justify-center gap-1 active:scale-95 transition-all"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {phase === 'results' && result && (
        <ResultsView
          result={result}
          subjectName={subject.name}
          onRetake={() => setPhase('setup')}
          onDone={goBack}
        />
      )}
    </div>
  );
}

function ResultsView({ result, subjectName, onRetake, onDone }: {
  result: QuizResult;
  subjectName: string;
  onRetake: () => void;
  onDone: () => void;
}) {
  const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
  const tone = pct >= 70 ? 'text-emerald-600 dark:text-emerald-400' : pct >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400';

  return (
    <div className="px-4 pt-4 pb-10 animate-fade-in">
      <div className="bg-white dark:bg-dark-surface border border-navy-100 dark:border-dark-border rounded-3xl p-6 text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-navy-500 dark:text-dark-muted">{subjectName}</p>
        <p className={`text-5xl font-black mt-2 ${tone}`}>{result.score}/{result.total}</p>
        <p className="text-sm text-navy-600 dark:text-dark-muted mt-1">{pct}% correct</p>
        <div className="flex gap-3 mt-6">
          <button onClick={onRetake} className="flex-1 py-3 rounded-2xl border border-navy-200 dark:border-dark-border text-navy-700 dark:text-dark-text font-semibold flex items-center justify-center gap-2 active:scale-95 transition-all">
            <RotateCcw className="w-4 h-4" /> New quiz
          </button>
          <button onClick={onDone} className="flex-1 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold active:scale-95 transition-all">
            Done
          </button>
        </div>
      </div>

      <h3 className="text-xs font-bold uppercase tracking-wider text-navy-500 dark:text-dark-muted mt-6 mb-3">Review</h3>
      <div className="space-y-3">
        {result.details.map((d, i) => {
          const correct = d.selected_index === d.correct_index;
          return (
            <div key={d.question_id} className="bg-white dark:bg-dark-surface border border-navy-100 dark:border-dark-border rounded-2xl p-4">
              <div className="flex items-start gap-3">
                {correct
                  ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  : <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />}
                <p className="text-sm font-semibold text-navy-800 dark:text-dark-text leading-snug">{i + 1}. {d.question}</p>
              </div>
              <div className="mt-3 space-y-1.5 pl-8">
                {d.options.map((opt, idx) => {
                  const isCorrect = idx === d.correct_index;
                  const isChosen = idx === d.selected_index;
                  return (
                    <p
                      key={idx}
                      className={`text-xs rounded-lg px-3 py-2 ${
                        isCorrect
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 font-semibold'
                          : isChosen
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300 font-semibold'
                            : 'text-navy-600 dark:text-dark-muted'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}. {opt}
                      {isCorrect && ' (correct)'}
                      {isChosen && !isCorrect && ' (your answer)'}
                    </p>
                  );
                })}
                {d.selected_index === null && (
                  <p className="text-xs text-navy-500 dark:text-dark-muted pt-1">You did not answer this question.</p>
                )}
                {d.explanation && (
                  <p className="text-xs text-navy-600 dark:text-dark-muted pt-1 leading-relaxed">{d.explanation}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
