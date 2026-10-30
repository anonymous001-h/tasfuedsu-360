import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { AppNotification } from '@/types';

interface NotifPrefs {
  enabled: boolean;
  news: boolean;
  events: boolean;
  messages: boolean;
  opportunities: boolean;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  prefs: NotifPrefs;
  setPrefs: (prefs: NotifPrefs) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

const PREFS_KEY = 'tasfuedsu_notif_prefs';

const defaultPrefs: NotifPrefs = {
  enabled: true,
  news: true,
  events: true,
  messages: true,
  opportunities: true,
};

function loadPrefs(): NotifPrefs {
  if (typeof window === 'undefined') return defaultPrefs;
  try {
    const saved = localStorage.getItem(PREFS_KEY);
    return saved ? { ...defaultPrefs, ...JSON.parse(saved) } : defaultPrefs;
  } catch {
    return defaultPrefs;
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [prefs, setPrefsState] = useState<NotifPrefs>(loadPrefs);

  const setPrefs = (newPrefs: NotifPrefs) => {
    setPrefsState(newPrefs);
    localStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
  };

  const refresh = useCallback(async () => {
    if (!session?.user?.id) { setNotifications([]); return; }
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications((data as AppNotification[]) || []);
  }, [session?.user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime subscription for new notifications
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel(`notifications:${session.user.id}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as AppNotification;
          setNotifications((prev) => [newNotif, ...prev]);
          if (prefs.enabled) {
            const typeMatch =
              (newNotif.type === 'news' && prefs.news) ||
              (newNotif.type === 'event' && prefs.events) ||
              (newNotif.type === 'message' && prefs.messages) ||
              (newNotif.type === 'opportunity' && prefs.opportunities) ||
              newNotif.type === 'system';
            if (typeMatch) {
              showToast(newNotif.title, 'info');
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id, prefs, showToast]);

  const markAsRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!session?.user?.id) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [notifications, session?.user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, prefs, setPrefs, markAsRead, markAllAsRead, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
