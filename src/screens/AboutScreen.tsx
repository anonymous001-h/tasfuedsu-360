import { Code, Users, Heart, Zap } from 'lucide-react';
import { PhoneShell } from '@/components/PhoneShell';
import { AppHeader } from '@/components/AppHeader';
import { Tagline, DevelopedByFooter } from '@/components/Branding';
import { APP_NAME, APP_VERSION, TAGLINE } from '@/lib/constants';

export function AboutScreen() {
  return (
    <PhoneShell showBottomNav={false}>
      <AppHeader title="About" showBack />
      <div className="px-5 py-6 pb-20 animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-500/20">
            <Zap className="w-10 h-10 text-white" fill="white" />
          </div>
          <h2 className="text-2xl font-black text-navy-900 dark:text-dark-text">{APP_NAME}</h2>
          <p className="text-xs text-navy-400 dark:text-dark-muted mt-1">Version {APP_VERSION}</p>
        </div>

        <div className="bg-gradient-to-r from-brand-50 to-navy-50 dark:from-dark-surface dark:to-dark-surface border border-brand-100 dark:border-dark-border rounded-2xl p-4 mb-5 text-center">
          <p className="text-xs text-navy-700 dark:text-dark-muted leading-relaxed font-medium">{TAGLINE}</p>
        </div>

        <div className="mb-5">
          <h3 className="text-sm font-bold text-navy-800 dark:text-dark-text mb-2">About the Platform</h3>
          <p className="text-sm text-navy-600 dark:text-dark-muted leading-relaxed">
            TASFUEDSU 360 is a comprehensive student union governance and engagement platform designed to bridge the gap between the Student Union Government and the student body. It provides real-time access to news, events, library resources, opportunities, messaging, and a direct channel for anonymous feedback.
          </p>
        </div>

        <div className="space-y-2.5 mb-5">
          <FeatureRow icon={<Users className="w-5 h-5" />} title="Student Union Governance" desc="Current & past administration records" />
          <FeatureRow icon={<Code className="w-5 h-5" />} title="Real-time Messaging" desc="Connect+ for instant communication" />
          <FeatureRow icon={<Heart className="w-5 h-5" />} title="Anonymous Desk" desc="Voice your concerns safely and privately" />
        </div>

        <DevelopedByFooter />
      </div>
    </PhoneShell>
  );
}

function FeatureRow({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white dark:bg-dark-surface rounded-xl border border-navy-100 dark:border-dark-border p-3.5 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">{icon}</div>
      <div>
        <h4 className="text-sm font-semibold text-navy-800 dark:text-dark-text">{title}</h4>
        <p className="text-xs text-navy-400 dark:text-dark-muted">{desc}</p>
      </div>
    </div>
  );
}
