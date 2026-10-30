import type { ReactNode } from 'react';
import { ChevronLeft, Bell } from 'lucide-react';
import { useNav } from '@/contexts/NavContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { APP_NAME } from '@/lib/constants';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: ReactNode;
}

export function AppHeader({ title, showBack = true, rightAction }: AppHeaderProps) {
  const { goBack, navigate, canGoBack } = useNav();
  const { unreadCount } = useNotifications();

  return (
    <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 bg-white/80 dark:bg-navy-900/80 backdrop-blur-xl border-b border-navy-100 dark:border-dark-border">
      <div className="flex items-center gap-3 px-4 h-14">
        {showBack && canGoBack() ? (
          <button
            onClick={goBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-navy-600 dark:text-dark-text hover:bg-navy-100 dark:hover:bg-dark-surface active:scale-90 transition-all flex-shrink-0"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
            360
          </div>
        )}

        <h1 className="flex-1 text-sm font-bold text-navy-800 dark:text-dark-text truncate text-center">{title}</h1>

        <div className="flex items-center gap-2 flex-shrink-0">
          {rightAction}
          <button
            onClick={() => navigate('notifications')}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-navy-600 dark:text-dark-muted hover:bg-navy-100 dark:hover:bg-dark-surface active:scale-90 transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-brand-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

export function HeaderSpacer() {
  return <div className="h-14 flex-shrink-0" />;
}
