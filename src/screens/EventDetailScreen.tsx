import { Clock, MapPin, Calendar } from 'lucide-react';
import { PhoneShell } from '@/components/PhoneShell';
import { AppHeader } from '@/components/AppHeader';
import { EngagementBar } from '@/components/EngagementBar';
import { useNav } from '@/contexts/NavContext';

import type { EventItem } from '@/types';

export function EventDetailScreen() {
  const { params, goBack } = useNav();
  const event = params.event as EventItem | undefined;

  if (!event) {
    return (
      <PhoneShell showBottomNav={false}>
        <AppHeader title="Event" showBack />
        <div className="flex-1 flex items-center justify-center text-navy-500 dark:text-dark-muted">
          <button onClick={goBack} className="text-brand-600 font-bold text-sm">Go back</button>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell showBottomNav={false}>
      <AppHeader title="Event Details" showBack />
      <div className="pb-20 animate-fade-in">
        {event.image_url && (
          <div className="relative h-56 overflow-hidden">
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        <div className="px-5 py-5">
          <h1 className="text-xl font-bold text-navy-900 dark:text-dark-text mb-4">{event.title}</h1>
          <div className="space-y-2.5 mb-4">
            {event.event_date && (
              <div className="flex items-center gap-3 text-sm text-navy-600 dark:text-dark-muted">
                <Calendar className="w-4 h-4 text-brand-500" />
                <span>{new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}{event.event_time ? ` at ${event.event_time}` : ''}</span>
              </div>
            )}
            {event.venue && (
              <div className="flex items-center gap-3 text-sm text-navy-600 dark:text-dark-muted">
                <MapPin className="w-4 h-4 text-brand-500" /><span>{event.venue}</span>
              </div>
            )}
          </div>
          <p className="text-sm text-navy-600 dark:text-dark-muted leading-relaxed whitespace-pre-wrap">{event.description}</p>

          <EngagementBar targetType="event" targetId={event.id} autoShowComments />
        </div>
      </div>
    </PhoneShell>
  );
}
