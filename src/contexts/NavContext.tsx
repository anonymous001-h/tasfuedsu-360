import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ScreenName, NavParams } from '@/types';

interface NavContextValue {
  screen: ScreenName;
  params: NavParams;
  activeTab: string;
  navigate: (screen: ScreenName, params?: NavParams) => void;
  goBack: () => void;
  canGoBack: () => boolean;
  setActiveTab: (tab: string) => void;
}

const NavContext = createContext<NavContextValue | undefined>(undefined);

interface HistoryEntry {
  screen: ScreenName;
  params: NavParams;
}

const TAB_MAP: Record<string, string> = {
  home: 'home',
  news: 'news',
  newsDetail: 'news',
  study: 'study',
  studyQuiz: 'study',
  studyAdmin: 'study',
  studyAdminSubject: 'study',
  library: 'library',
  libraryDetail: 'library',
  connect: 'connect',
  chat: 'connect',
  publicProfile: 'connect',
  profile: 'profile',
  settings: 'profile',
};

export function NavProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<ScreenName>('splash');
  const [params, setParams] = useState<NavParams>({});
  const [activeTab, setActiveTab] = useState('home');
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const navigate = (newScreen: ScreenName, newParams: NavParams = {}) => {
    setHistory((prev) => [...prev, { screen, params }]);
    setScreen(newScreen);
    setParams(newParams);
    const tab = TAB_MAP[newScreen];
    if (tab) setActiveTab(tab);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  };

  const goBack = () => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setScreen(last.screen);
      setParams(last.params);
      const tab = TAB_MAP[last.screen];
      if (tab) setActiveTab(tab);
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      return prev.slice(0, -1);
    });
  };

  const canGoBack = () => history.length > 0;

  return (
    <NavContext.Provider value={{ screen, params, activeTab, navigate, goBack, canGoBack, setActiveTab }}>
      {children}
    </NavContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavProvider');
  return ctx;
}
