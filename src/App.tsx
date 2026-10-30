import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NavProvider, useNav } from '@/contexts/NavContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { PhoneShell } from '@/components/PhoneShell';
import { BottomTabs } from '@/components/BottomTabs';

import { SplashScreen } from '@/screens/SplashScreen';
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { RegisterScreen } from '@/screens/RegisterScreen';
import { ForgotPasswordScreen } from '@/screens/ForgotPasswordScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { NewsScreen } from '@/screens/NewsScreen';
import { NewsDetailScreen } from '@/screens/NewsDetailScreen';
import { StudyScreen } from '@/screens/StudyScreen';
import { StudyQuizScreen } from '@/screens/StudyQuizScreen';
import { StudyAdminScreen } from '@/screens/StudyAdminScreen';
import { StudyAdminSubjectScreen } from '@/screens/StudyAdminSubjectScreen';
import { LibraryScreen } from '@/screens/LibraryScreen';
import { LibraryDetailScreen } from '@/screens/LibraryDetailScreen';
import { EventsScreen } from '@/screens/EventsScreen';
import { EventDetailScreen } from '@/screens/EventDetailScreen';
import { OpportunitiesScreen } from '@/screens/OpportunitiesScreen';
import { OpportunityDetailScreen } from '@/screens/OpportunityDetailScreen';
import { CalendarScreen } from '@/screens/CalendarScreen';
import { SUGScreen } from '@/screens/SUGScreen';
import { AnonymousScreen } from '@/screens/AnonymousScreen';
import { ConnectScreen } from '@/screens/ConnectScreen';
import { ChatScreen } from '@/screens/ChatScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { AboutScreen } from '@/screens/AboutScreen';
import { SearchScreen } from '@/screens/SearchScreen';
import { AdminScreen } from '@/screens/AdminScreen';
import { AdminAnonymousScreen } from '@/screens/AdminAnonymousScreen';
import { NotificationsScreen } from '@/screens/NotificationsScreen';
import { EditProfileScreen } from '@/screens/EditProfileScreen';
import { PrivacyPolicyScreen } from '@/screens/PrivacyPolicyScreen';
import { AdminQuotesScreen } from '@/screens/AdminQuotesScreen';

import type { ScreenName } from '@/types';

const NO_NAV_SCREENS: ScreenName[] = [
  'splash', 'onboarding', 'login', 'register', 'forgot', 'studyQuiz',
];

function ScreenRouter() {
  const { screen } = useNav();
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <PhoneShell showBottomNav={false}>
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-navy-900 via-navy-800 to-brand-900 text-white min-h-screen">
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-400/40 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-brand-400 text-2xl font-black">360</span>
            </div>
            <p className="text-sm font-medium text-white/70">Loading...</p>
          </div>
        </div>
      </PhoneShell>
    );
  }

  const isAuthScreen = screen === 'login' || screen === 'register' || screen === 'forgot';

  if (!session && !isAuthScreen && screen !== 'splash' && screen !== 'onboarding') {
    return <LoginScreen />;
  }

  const renderScreen = () => {
    switch (screen) {
      case 'splash': return <SplashScreen />;
      case 'onboarding': return <OnboardingScreen />;
      case 'login': return <LoginScreen />;
      case 'register': return <RegisterScreen />;
      case 'forgot': return <ForgotPasswordScreen />;
      case 'home': return <HomeScreen />;
      case 'news': return <NewsScreen />;
      case 'newsDetail': return <NewsDetailScreen />;
      case 'study': return <StudyScreen />;
      case 'studyQuiz': return <StudyQuizScreen />;
      case 'studyAdmin': return <StudyAdminScreen />;
      case 'studyAdminSubject': return <StudyAdminSubjectScreen />;
      case 'library': return <LibraryScreen />;
      case 'libraryDetail': return <LibraryDetailScreen />;
      case 'events': return <EventsScreen />;
      case 'eventDetail': return <EventDetailScreen />;
      case 'opportunities': return <OpportunitiesScreen />;
      case 'opportunityDetail': return <OpportunityDetailScreen />;
      case 'calendar': return <CalendarScreen />;
      case 'sug': return <SUGScreen />;
      case 'anonymous': return <AnonymousScreen />;
      case 'connect': return <ConnectScreen />;
      case 'chat': return <ChatScreen />;
      case 'profile': return <ProfileScreen />;
      case 'settings': return <SettingsScreen />;
      case 'about': return <AboutScreen />;
      case 'search': return <SearchScreen />;
      case 'admin': return <AdminScreen />;
      case 'adminAnonymous': return <AdminAnonymousScreen />;
      case 'notifications': return <NotificationsScreen />;
      case 'editProfile': return <EditProfileScreen />;
      case 'privacyPolicy': return <PrivacyPolicyScreen />;
      case 'adminQuotes': return <AdminQuotesScreen />;
      default: return <HomeScreen />;
    }
  };

  const showBottomNav = !NO_NAV_SCREENS.includes(screen);
  const wrapped = renderScreen();

  // These screens already include their own PhoneShell wrapper
  const selfWrapped: ScreenName[] = [
    'splash', 'onboarding', 'login', 'register', 'forgot',
    'settings', 'about', 'admin', 'adminAnonymous', 'notifications',
    'newsDetail', 'libraryDetail', 'eventDetail', 'opportunityDetail',
    'chat', 'search', 'privacyPolicy',
  ];

  if (selfWrapped.includes(screen)) {
    return <>{wrapped}</>;
  }

  return (
    <PhoneShell showBottomNav={showBottomNav}>
      {wrapped}
    </PhoneShell>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <NavProvider>
              <ScreenRouter />
            </NavProvider>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
