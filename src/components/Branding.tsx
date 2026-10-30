import { TAGLINE, DEVELOPED_BY, CABINET_CREDIT, FOUNDER_NAME, FOUNDER_LINK } from '@/lib/constants';

export function Tagline({ className = '' }: { className?: string }) {
  return (
    <p className={`text-[10px] leading-relaxed text-navy-400 dark:text-dark-muted text-center px-4 ${className}`}>
      {TAGLINE}
    </p>
  );
}

export function Footer({ className = '' }: { className?: string }) {
  return null;
}

export function DevelopedByFooter({ light = false, className = '' }: { light?: boolean; className?: string }) {
  const baseText = light ? 'text-white/50' : 'text-navy-400 dark:text-dark-muted';
  const cabinetText = light ? 'text-white/40' : 'text-navy-400 dark:text-dark-muted';
  return (
    <div className={`flex flex-col items-center gap-1.5 py-4 px-6 text-center ${className}`}>
      <a
        href={FOUNDER_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-[10px] font-medium ${light ? 'text-brand-300 hover:text-brand-200' : 'text-brand-600 dark:text-brand-400 hover:text-brand-700'} transition-colors active:scale-95`}
      >
        {DEVELOPED_BY}
      </a>
      <p className={`text-[9px] leading-relaxed italic ${cabinetText} max-w-[280px]`}>
        {CABINET_CREDIT}
      </p>
      <p className={`text-[10px] font-bold ${baseText}`}>
        &copy; {new Date().getFullYear()} {FOUNDER_NAME}
      </p>
    </div>
  );
}
