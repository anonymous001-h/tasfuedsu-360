import { useState, useEffect, useRef } from 'react';
import { X, Plus, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import type { StudyQuestion } from '@/types';

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

interface StudyQuestionFormProps {
  subjectId: string;
  question: StudyQuestion | null;
  onClose: () => void;
  onSaved: () => void;
}

export function StudyQuestionForm({ subjectId, question, onClose, onSaved }: StudyQuestionFormProps) {
  const { showToast } = useToast();
  const [text, setText] = useState(question?.question ?? '');
  const [options, setOptions] = useState<string[]>(
    question?.options ?? ['', '', '', ''],
  );
  const [correctIndex, setCorrectIndex] = useState(question?.correct_index ?? 0);
  const [explanation, setExplanation] = useState(question?.explanation ?? '');
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>('textarea, input')?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const updateOption = (idx: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? value : o)));
  };

  const removeOption = (idx: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== idx));
    setCorrectIndex((c) => (c === idx ? 0 : c > idx ? c - 1 : c));
  };

  const handleSave = async () => {
    const trimmedText = text.trim();
    const trimmedOptions = options.map((o) => o.trim());
    if (!trimmedText) { showToast('Write the question first', 'error'); return; }
    if (trimmedOptions.some((o) => !o)) { showToast('Every answer option needs text', 'error'); return; }
    if (new Set(trimmedOptions.map((o) => o.toLowerCase())).size !== trimmedOptions.length) {
      showToast('Answer options must be different from each other', 'error');
      return;
    }

    const payload = {
      subject_id: subjectId,
      question: trimmedText,
      options: trimmedOptions,
      correct_index: correctIndex,
      explanation: explanation.trim(),
    };

    setSaving(true);
    const { error } = question
      ? await supabase.from('study_questions').update(payload).eq('id', question.id)
      : await supabase.from('study_questions').insert(payload);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast(question ? 'Question updated' : 'Question added', 'success');
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={question ? 'Edit question' : 'New question'}
        className="bg-white dark:bg-dark-surface w-full max-w-[480px] max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-navy-800 dark:text-dark-text">{question ? 'Edit' : 'New'} Question</h3>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full bg-navy-100 dark:bg-dark-surface2 flex items-center justify-center text-navy-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type the question..."
            rows={3}
            maxLength={1000}
            className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500 resize-none"
          />

          <div>
            <p className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-2">Answers (tap the circle for the correct one)</p>
            <div className="space-y-2" role="radiogroup" aria-label="Answer options">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={correctIndex === idx}
                    aria-label={`Mark option ${String.fromCharCode(65 + idx)} as correct`}
                    onClick={() => setCorrectIndex(idx)}
                    className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-colors ${correctIndex === idx ? 'border-emerald-500 bg-emerald-500' : 'border-navy-300 dark:border-dark-border'}`}
                  />
                  <input
                    value={opt}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    maxLength={300}
                    className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500"
                  />
                  {options.length > MIN_OPTIONS && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      aria-label={`Remove option ${String.fromCharCode(65 + idx)}`}
                      className="w-8 h-8 rounded-lg text-red-500 bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < MAX_OPTIONS && (
              <button
                type="button"
                onClick={() => setOptions((prev) => [...prev, ''])}
                className="mt-2 text-xs font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1 active:scale-95 transition-transform"
              >
                <Plus className="w-3.5 h-3.5" /> Add option
              </button>
            )}
          </div>

          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Explanation shown after the quiz (optional)"
            rows={2}
            maxLength={1000}
            className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500 resize-none"
          />

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save question'}
          </button>
        </div>
      </div>
    </div>
  );
}
