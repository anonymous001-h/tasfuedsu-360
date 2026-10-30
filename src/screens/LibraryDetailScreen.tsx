import { FileText, ExternalLink, Video, File, Download, Calendar } from 'lucide-react';
import { PhoneShell } from '@/components/PhoneShell';
import { AppHeader } from '@/components/AppHeader';
import { useNav } from '@/contexts/NavContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';
import type { LibraryResource } from '@/types';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-8 h-8" />,
  document: <File className="w-8 h-8" />,
  link: <ExternalLink className="w-8 h-8" />,
  video: <Video className="w-8 h-8" />,
};

export function LibraryDetailScreen() {
  const { params, goBack } = useNav();
  const { session } = useAuth();
  const { showToast } = useToast();
  const resource = params.resource as LibraryResource | undefined;

  if (!resource) {
    return (
      <PhoneShell showBottomNav={false}>
        <AppHeader title="Resource" showBack />
        <div className="flex-1 flex items-center justify-center text-navy-500 dark:text-dark-muted">
          <button onClick={goBack} className="text-brand-600 font-bold text-sm">Go back</button>
        </div>
      </PhoneShell>
    );
  }

  const handleAction = async () => {
    if (resource.type === 'link') {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    } else {
      if (session?.user?.id) {
        await supabase.from('download_log').insert({ user_id: session.user.id, resource_id: resource.id });
      }
      window.open(resource.url, '_blank', 'noopener,noreferrer');
      showToast('Download started', 'success');
    }
  };

  return (
    <PhoneShell showBottomNav={false}>
      <AppHeader title="Resource Details" showBack />
      <div className="pb-20 px-5 py-6 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-4">
          {TYPE_ICONS[resource.type] || <File className="w-8 h-8" />}
        </div>
        <h2 className="text-xl font-bold text-navy-900 dark:text-dark-text text-center mb-2">{resource.title}</h2>
        <p className="text-xs text-navy-400 dark:text-dark-muted text-center mb-4">{resource.category} · {resource.type.toUpperCase()}</p>
        <p className="text-sm text-navy-600 dark:text-dark-muted leading-relaxed text-center mb-6">{resource.description || 'No description available.'}</p>

        <div className="bg-navy-50 dark:bg-dark-surface rounded-2xl p-4 mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-navy-400 dark:text-dark-muted">Type</span>
            <span className="font-semibold text-navy-700 dark:text-dark-text uppercase">{resource.type}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-navy-400 dark:text-dark-muted">Category</span>
            <span className="font-semibold text-navy-700 dark:text-dark-text">{resource.category}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-navy-400 dark:text-dark-muted">Added</span>
            <span className="font-semibold text-navy-700 dark:text-dark-text flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {new Date(resource.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {resource.type === 'video' && resource.url ? (
          <div className="mb-4">
            {resource.url.includes('youtube') || resource.url.includes('youtu.be') ? (
              <iframe
                src={resource.url.replace('watch?v=', 'embed/')}
                className="w-full aspect-video rounded-2xl"
                allowFullScreen
                title={resource.title}
              />
            ) : (
              <video src={resource.url} controls className="w-full rounded-2xl" />
            )}
          </div>
        ) : null}

        <button
          onClick={handleAction}
          className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3.5 rounded-xl text-center active:scale-95 transition-transform shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2"
        >
          {resource.type === 'link' ? <ExternalLink className="w-5 h-5" /> : <Download className="w-5 h-5" />}
          {resource.type === 'link' ? 'Open Link' : 'Download Resource'}
        </button>
      </div>
    </PhoneShell>
  );
}
