import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { PhoneShell } from '@/components/PhoneShell';
import { Tagline, DevelopedByFooter } from '@/components/Branding';
import { APP_NAME } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useNav } from '@/contexts/NavContext';

export function SplashScreen() {
  const [countdown, setCountdown] = useState(3);
  const { session } = useAuth();
  const { navigate } = useNav();

  useEffect(() => {
    if (countdown <= 0) {
      navigate(session ? 'home' : 'onboarding');
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, session, navigate]);

  return (
    <PhoneShell showBottomNav={false} showHeader={false}>
      <div className="flex-1 flex flex-col items-center justify-between bg-gradient-to-br from-navy-900 via-navy-800 to-brand-900 text-white px-6 py-10 min-h-screen">
        <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
          <div className="w-44 h-44 rounded-3xl bg-white/10 border-2 border-white/20 flex items-center justify-center shadow-2xl">
            <div className="w-20 h-20 rounded-2xl bg-brand-500 flex items-center justify-center shadow-xl">
              <Zap className="w-10 h-10 text-white" fill="white" />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight">{APP_NAME}</h1>
            <div className="w-16 h-1 bg-brand-400 mx-auto mt-2 rounded-full" />
          </div>

          <Tagline className="text-white/60" />
        </div>

        <div className="flex flex-col items-center gap-3 w-full">
          <div className="bg-white/10 backdrop-blur-sm rounded-full px-5 py-2.5">
            <p className="text-sm font-medium text-white/90">
              Taking you to the app in... <span className="text-brand-400 font-bold">{countdown}s</span>
            </p>
          </div>
          <DevelopedByFooter light />
        </div>
      </div>
    </PhoneShell>
  );
}
