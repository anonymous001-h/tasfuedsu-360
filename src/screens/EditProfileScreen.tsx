import { useState } from 'react';
import { UserCircle, Check, Camera, Loader2 } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { FileUpload } from '@/components/FileUpload';
import { DevelopedByFooter } from '@/components/Branding';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export function EditProfileScreen() {
  const { profile, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    department: profile?.department || '',
    avatar_url: profile?.avatar_url || '',
    cover_photo_url: profile?.cover_photo_url || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.display_name.trim()) { showToast('Name is required', 'error'); return; }
    setSaving(true);
    const { error } = await updateProfile(form);
    setSaving(false);
    if (error) { showToast(error, 'error'); return; }
    showToast('Profile updated successfully', 'success');
  };

  return (
    <>
      <AppHeader title="Edit Profile" showBack />
      <div className="px-5 py-5 pb-20 animate-fade-in">
        {/* Cover photo */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-2 block">Cover Photo</label>
          <FileUpload label="" currentUrl={form.cover_photo_url} onUploaded={(url) => setForm({ ...form, cover_photo_url: url })} folder="covers" />
        </div>

        {/* Avatar */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-2 block">Profile Picture</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-brand-100 dark:bg-dark-surface border-2 border-navy-100 dark:border-dark-border overflow-hidden flex items-center justify-center flex-shrink-0">
              {form.avatar_url ? (
                <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-10 h-10 text-navy-300" />
              )}
            </div>
            <FileUpload label="Upload new photo" currentUrl="" onUploaded={(url) => setForm({ ...form, avatar_url: url })} folder="avatars" />
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Full Name</label>
            <input
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              placeholder="Your full name"
              className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Department</label>
            <input
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="e.g. Computer Science"
              className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500 resize-none transition-colors"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3.5 rounded-xl active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>

        <div className="mt-8">
          <DevelopedByFooter />
        </div>
      </div>
    </>
  );
}
