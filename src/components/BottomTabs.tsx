import { Home, Newspaper, GraduationCap, BookOpen, MessagesSquare, User } from 'lucide-react';
import { useNav } from '@/contexts/NavContext';

const TABS = [
  { key: 'home', label: 'Home', icon: Home, screen: 'home' as const },
  { key: 'news', label: 'News', icon: Newspaper, screen: 'news' as const },
  { key: 'study', label: 'Study', icon: GraduationCap, screen: 'study' as const },
  { key: 'library', label: 'Library', icon: BookOpen, screen: 'library' as const },
  { key: 'connect', label: 'Connect+', icon: MessagesSquare, screen: 'connect' as const },
  { key: 'profile', label: 'Profile', icon: User, screen: 'profile' as const },
];

export function BottomTabs() {
  const { activeTab, navigate, setActiveTab } = useNav();

  const handleTab = (tab: typeof TABS[number]) => {
    setActiveTab(tab.key);
    navigate(tab.screen);
  };

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/90 dark:bg-navy-900/90 backdrop-blur-xl border-t border-navy-100 dark:border-dark-border z-50">
      <div className="flex items-center justify-around px-1 py-2 pb-[env(safe-area-inset-bottom)]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTab(tab)}
              className="flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all duration-200 w-16"
              aria-label={tab.label}
            >
              <div className={`transition-all duration-200 ${active ? 'scale-110' : 'scale-100'}`}>
                <Icon
                  className={`w-5 h-5 ${active ? 'text-brand-600 dark:text-brand-400' : 'text-navy-400 dark:text-dark-muted'}`}
                  strokeWidth={active ? 2.5 : 2}
                />
              </div>
              <span className={`text-[10px] font-semibold transition-colors ${active ? 'text-brand-600 dark:text-brand-400' : 'text-navy-400 dark:text-dark-muted'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
