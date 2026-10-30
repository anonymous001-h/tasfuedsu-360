import { useState } from 'react';
import {
  UserCircle, Pencil, Settings, LogOut, Shield, X, Check, AlertTriangle,
  Camera, Lock, Eye, EyeOff,
} from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { DevelopedByFooter } from '@/components/Branding';
import { ConfirmModal } from '@/components/ConfirmModal';
import { FileUpload } from '@/components/FileUpload';
import { useNav } from '@/contexts/NavContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';

export function ProfileScreen() {
  const { navigate } = useNav();
  const { profile, session, signOut, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [form, setForm] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    department: profile?.department || '',
    avatar_url: profile?.avatar_url || '',
    cover_photo_url: profile?.cover_photo_url || '',
  });

  const handleSave = async () => {
    const { error } = await updateProfile(form);
    if (error) { showToast(error, 'error'); return; }
    showToast('Profile updated successfully', 'success');
    setEditing(false);
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    await signOut();
    navigate('login');
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <>
      <AppHeader title="Profile" showBack={false} />
      <div className="pb-20">
        {/* Profile header with cover */}
        <div className="relative">
          <div className="h-32 bg-gradient-to-br from-navy-800 via-navy-700 to-brand-800 relative overflow-hidden">
            {profile?.cover_photo_url && (
              <img src={profile.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="px-5 -mt-12 relative">
            <div className="w-24 h-24 rounded-full bg-brand-100 dark:bg-dark-surface border-4 border-white dark:border-dark-bg flex items-center justify-center text-4xl overflow-hidden shadow-lg">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircle className="w-12 h-12 text-navy-300" />
              )}
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-navy-900 dark:text-dark-text">{profile?.display_name || 'Student'}</h2>
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <Shield className="w-2.5 h-2.5" /> ADMIN
                  </span>
                )}
              </div>
              {profile?.department && <p className="text-sm text-navy-500 dark:text-dark-muted">{profile.department}</p>}
              {profile?.bio && <p className="text-xs text-navy-400 dark:text-dark-muted mt-1">{profile.bio}</p>}
            </div>
          </div>
        </div>

        {/* Action items */}
        {/* Edit form */}
        {editing && (
          <div className="px-5 mt-5">
            <div className="bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border p-4 space-y-3 animate-scale-in">
              <FileUpload label="Cover Photo" currentUrl={form.cover_photo_url} onUploaded={(url) => setForm({ ...form, cover_photo_url: url })} folder="covers" />
              <FileUpload label="Avatar" currentUrl={form.avatar_url} onUploaded={(url) => setForm({ ...form, avatar_url: url })} folder="avatars" />
              <div>
                <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted block mb-1.5">Full Name</label>
                <input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted block mb-1.5">Department</label>
                <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Computer Science" className="w-full px-4 py-2.5 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted block mb-1.5">Bio</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Tell us about yourself..." rows={2} className="w-full px-4 py-2.5 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500 resize-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} className="flex-1 bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"><Check className="w-4 h-4" /> Save</button>
                <button onClick={() => setEditing(false)} className="px-4 bg-navy-100 dark:bg-dark-surface2 text-navy-600 dark:text-dark-muted font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"><X className="w-4 h-4" /> Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Action items */}
        <div className="px-5 mt-5 space-y-2">
          <ActionItem icon={<Pencil className="w-4 h-4" />} label="Edit Profile" onClick={() => navigate('editProfile')} />
          <ActionItem icon={<Lock className="w-4 h-4" />} label="Change Password" onClick={() => setShowChangePwd(true)} />
          <ActionItem icon={<Settings className="w-4 h-4" />} label="Settings" onClick={() => navigate('settings')} />
          <ActionItem icon={<Shield className="w-4 h-4" />} label={`About ${'TASFUEDSU 360'}`} onClick={() => navigate('about')} />
          {isAdmin && <ActionItem icon={<Shield className="w-4 h-4" />} label="Admin Console" onClick={() => navigate('admin')} highlight />}
          <ActionItem icon={<LogOut className="w-4 h-4" />} label="Logout" onClick={() => setShowLogoutConfirm(true)} danger />
        </div>

        <div className="px-5 mt-6">
          <DevelopedByFooter />
        </div>
      </div>

      <ConfirmModal
        open={showLogoutConfirm}
        title="Log Out?"
        message="Are you sure you want to log out of your account? You'll need to sign in again to access the app."
        confirmText="Log Out"
        cancelText="Stay"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
        danger
        icon={<AlertTriangle className="w-6 h-6" />}
      />

      {showChangePwd && (
        <ChangePasswordModal onClose={() => setShowChangePwd(false)} />
      )}
    </>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { showToast } = useToast();
  const { session } = useAuth();
  const [form, setForm] = useState({ old: '', new: '', confirm: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.old) { showToast('Current password is required', 'error'); return; }
    if (!form.new || form.new.length < 6) { showToast('New password must be at least 6 characters', 'error'); return; }
    if (form.new !== form.confirm) { showToast('Passwords do not match', 'error'); return; }

    setSaving(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session?.user?.email || '',
      password: form.old,
    });
    if (signInError) {
      setSaving(false);
      showToast('Current password is incorrect', 'error');
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: form.new });
    setSaving(false);
    if (updateError) { showToast(updateError.message, 'error'); return; }
    showToast('Password updated successfully', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-dark-surface w-full max-w-[440px] rounded-t-3xl sm:rounded-3xl p-5 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-navy-800 dark:text-dark-text">Change Password</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-navy-100 dark:bg-dark-surface2 flex items-center justify-center text-navy-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Current Password</label>
            <div className="relative">
              <input type={showPwd ? 'text' : 'password'} value={form.old} onChange={(e) => setForm({ ...form, old: e.target.value })} placeholder="Enter current password" className="w-full pl-4 pr-10 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
              <button onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400">{showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">New Password</label>
            <input type={showPwd ? 'text' : 'password'} value={form.new} onChange={(e) => setForm({ ...form, new: e.target.value })} placeholder="At least 6 characters" className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-navy-600 dark:text-dark-muted mb-1.5 block">Confirm New Password</label>
            <input type={showPwd ? 'text' : 'password'} value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="Re-enter new password" className="w-full px-4 py-3 rounded-xl border border-navy-200 dark:border-dark-border bg-white dark:bg-dark-bg text-navy-800 dark:text-dark-text text-sm outline-none focus:border-brand-500" />
          </div>
          <button onClick={handleSubmit} disabled={saving} className="w-full bg-gradient-to-r from-brand-600 to-brand-700 text-white font-bold py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-transform">{saving ? 'Updating...' : 'Update Password'}</button>
        </div>
      </div>
    </div>
  );
}

function ActionItem({ icon, label, onClick, danger, highlight }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; highlight?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border p-4 flex items-center gap-3 active:scale-[0.98] transition-transform hover:shadow-sm ${
        danger ? 'text-red-500' : highlight ? 'text-brand-700 dark:text-brand-400' : 'text-navy-700 dark:text-dark-text'
      }`}
    >
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm ${
        danger ? 'bg-red-50 dark:bg-red-900/20' : highlight ? 'bg-brand-50 dark:bg-brand-900/20' : 'bg-navy-50 dark:bg-dark-surface2'
      }`}>{icon}</span>
      <span className="text-sm font-semibold flex-1 text-left">{label}</span>
    </button>
  );
}
