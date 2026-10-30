import { Calendar, ExternalLink } from 'lucide-react';
import { PhoneShell } from '@/components/PhoneShell';
import { AppHeader } from '@/components/AppHeader';
import { useNav } from '@/contexts/NavContext';
import type { Opportunity } from '@/types';

export function OpportunityDetailScreen() {
  const { params, goBack } = useNav();
  const opp = params.opportunity as Opportunity | undefined;

  if (!opp) {
    return (
      <PhoneShell showBottomNav={false}>
        <AppHeader title="Opportunity" showBack />
        <div className="flex-1 flex items-center justify-center">
          <button onClick={goBack} className="text-brand-600 font-bold text-sm">Go back</button>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell showBottomNav={false}>
      <AppHeader title="Opportunity" showBack />
      <div className="px-5 py-6 pb-20 animate-fade-in">
        <span className="inline-block text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 mb-3">{opp.type}</span>
        <h2 className="text-xl font-bold text-navy-900 dark:text-dark-text mb-3">{opp.title}</h2>
        {opp.deadline && (
          <div className="flex items-center gap-2 text-sm text-red-500 mb-4">
            <Calendar className="w-4 h-4" /><span>Deadline: {new Date(opp.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        )}
        <p className="text-sm text-navy-600 dark:text-dark-muted leading-relaxed whitespace-pre-wrap mb-6">{opp.description}</p>
        {opp.link && (
          <a href={opp.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3.5 rounded-xl active:scale-95 transition-transform shadow-lg shadow-brand-500/20">
            <ExternalLink className="w-5 h-5" /> Apply Now
          </a>
        )}
      </div>
    </PhoneShell>
  );
}
