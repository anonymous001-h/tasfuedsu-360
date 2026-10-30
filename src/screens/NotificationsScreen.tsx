import { Bell, Newspaper, Calendar, MessageSquare, Briefcase, Settings, CheckCircle, Circle, Trash2 } from 'lucide-react';
import { PhoneShell } from '@/components/PhoneShell';
import { AppHeader } from '@/components/AppHeader';
import { EmptyState } from '@/components/States';
import { useNav } from '@/contexts/NavContext';
import { useNotifications } from '@/contexts/NotificationContext';
import type { AppNotification } from '@/types';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  news: <Newspaper className="w-5 h-5" />,
  event: <Calendar className="w-5 h-5" />,
  message: <MessageSquare className="w-5 h-5" />,
  opportunity: <Briefcase className="w-5 h-5" />,
  system: <Settings className="w-5 h-5" />,
};

const TYPE_COLORS: Record<string, string> = {
  news: 'bg-brand-500', event: 'bg-amber-500', message: 'bg-teal-500', opportunity: 'bg-purple-500', system: 'bg-navy-500',
};

export function NotificationsScreen() {
  const { navigate } = useNav();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleClick = (notif: AppNotification) => {
    markAsRead(notif.id);
    if (notif.link_screen) navigate(notif.link_screen as never, notif.link_params as never);
  };

  return (
    <PhoneShell showBottomNav={false}>
      <AppHeader
        title="Notifications"
        showBack
        rightAction={unreadCount > 0 ? (
          <button onClick={markAllAsRead} className="text-xs font-bold text-brand-600 px-2 py-1 rounded-lg bg-brand-50 dark:bg-brand-900/20 active:scale-95 transition-transform">
            Mark all
          </button>
        ) : undefined}
      />
      <div className="pb-20">
        {notifications.length === 0 ? (
          <EmptyState icon={<Bell className="w-8 h-8" />} title="No Notifications" message="You're all caught up! New notifications will appear here." />
        ) : (
          <div className="px-4 py-3 space-y-2">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full rounded-2xl border p-4 flex items-start gap-3 text-left active:scale-[0.98] transition-transform ${
                  notif.read
                    ? 'bg-white dark:bg-dark-surface border-navy-100 dark:border-dark-border'
                    : 'bg-brand-50 dark:bg-brand-900/10 border-brand-200 dark:border-brand-800/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[notif.type] || 'bg-navy-500'}`}>
                  {TYPE_ICONS[notif.type] || <Bell className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-bold text-navy-800 dark:text-dark-text truncate">{notif.title}</h3>
                    {!notif.read && <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-navy-500 dark:text-dark-muted leading-relaxed line-clamp-2">{notif.body}</p>
                  <p className="text-[10px] text-navy-400 dark:text-dark-muted mt-1">
                    {new Date(notif.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                  </p>
                </div>
                {notif.read ? <CheckCircle className="w-4 h-4 text-navy-300 flex-shrink-0 mt-1" /> : <Circle className="w-4 h-4 text-brand-400 flex-shrink-0 mt-1" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </PhoneShell>
  );
}
