import { useState } from 'react';
import { Newspaper, MessagesSquare, GraduationCap, Zap, ChevronRight } from 'lucide-react';
import { PhoneShell } from '@/components/PhoneShell';
import { Tagline, DevelopedByFooter } from '@/components/Branding';
import { useNav } from '@/contexts/NavContext';
import { APP_NAME } from '@/lib/constants';

const SLIDES = [
  {
    icon: <GraduationCap className="w-12 h-12" />,
    title: `Welcome to ${APP_NAME}`,
    description: 'Your all-in-one student union governance platform. Stay connected, informed, and engaged with everything happening on campus.',
  },
  {
    icon: <Newspaper className="w-12 h-12" />,
    title: 'Stay Informed',
    description: 'Get the latest news, upcoming events, opportunities, and scholarships — all in one place, updated in real-time.',
  },
  {
    icon: <MessagesSquare className="w-12 h-12" />,
    title: 'Connect & Engage',
    description: 'Access the library, chat with fellow students through Connect+, explore SUG administration, and voice your thoughts.',
  },
];

export function OnboardingScreen() {
  const [current, setCurrent] = useState(0);
  const { navigate } = useNav();
  const slide = SLIDES[current];

  const handleNext = () => {
    if (current < SLIDES.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      navigate('login');
    }
  };

  return (
    <PhoneShell showBottomNav={false} showHeader={false}>
      <div className="flex-1 flex flex-col bg-gradient-to-br from-navy-900 via-navy-800 to-brand-900 text-white px-6 py-10 min-h-screen">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <span className="text-lg font-black">{APP_NAME}</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-fade-in" key={current}>
          <div className="w-32 h-32 rounded-3xl bg-white/10 border-2 border-white/20 flex items-center justify-center shadow-xl text-brand-400">
            {slide.icon}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-3">{slide.title}</h2>
            <p className="text-sm text-white/70 leading-relaxed max-w-xs">{slide.description}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-5">
          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === current ? 'w-8 bg-brand-400' : 'w-2 bg-white/30'
                }`}
              />
            ))}
          </div>

          <Tagline className="text-white/40" />

          <button
            onClick={handleNext}
            className="w-full max-w-xs bg-white text-navy-900 font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            {current < SLIDES.length - 1 ? 'Next' : 'Get Started'}
            <ChevronRight className="w-4 h-4" />
          </button>

          {current < SLIDES.length - 1 && (
            <button onClick={() => navigate('login')} className="text-sm text-white/50 font-medium">
              Skip
            </button>
          )}

          <DevelopedByFooter light />
        </div>
      </div>
    </PhoneShell>
  );
}
