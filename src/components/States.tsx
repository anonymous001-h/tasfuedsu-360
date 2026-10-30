import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ text = 'Loading...', className = '' }: { text?: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
      <Loader2 className="w-6 h-6 text-brand-500 animate-spin mb-3" />
      {text && <p className="text-sm text-navy-500 dark:text-dark-muted">{text}</p>}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-navy-100 dark:border-dark-border overflow-hidden">
      <div className="skeleton h-36 w-full" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-3 w-3/4 rounded" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

export function EmptyState({ icon, title, message }: { icon: ReactNode; title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-navy-100 dark:bg-dark-surface flex items-center justify-center mb-4 text-brand-400">
        {icon}
      </div>
      <h3 className="text-base font-bold text-navy-700 dark:text-dark-text mb-1">{title}</h3>
      <p className="text-sm text-navy-400 dark:text-dark-muted max-w-xs">{message}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <span className="text-2xl text-red-500 font-bold">!</span>
      </div>
      <p className="text-sm text-navy-600 dark:text-dark-muted">{message}</p>
    </div>
  );
}
