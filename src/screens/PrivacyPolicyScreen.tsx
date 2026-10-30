import { Shield, Lock, Database, Mail, Eye, UserCheck } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { DevelopedByFooter } from '@/components/Branding';
import { APP_NAME } from '@/lib/constants';

export function PrivacyPolicyScreen() {
  return (
    <>
      <AppHeader title="Privacy Policy" showBack />
      <div className="px-5 py-5 pb-20 animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-16 mt-11 h-16 rounded-2xl bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-navy-900 dark:text-dark-text">Privacy Policy</h2>
          <p className="text-xs text-navy-400 dark:text-dark-muted mt-1">Last updated: October 2026</p>
        </div>

        <div className="space-y-5 mt-3">
          <Section icon={<Lock className="w-4 h-4" />} title="1. Information We Collect">
            <p>{APP_NAME} collects the following information when you create an account:</p>
            <ul className="list-disc pl-4 mt-2 space-y-1">
              <li>Your full name and department (provided during registration)</li>
              <li>Your email address (used for authentication and password resets)</li>
              <li>Profile photo and cover image (optional, uploaded by you)</li>
              <li>Content you post, including comments, messages, and anonymous submissions</li>
            </ul>
          </Section>

          <Section icon={<Database className="w-4 h-4" />} title="2. How We Use Your Information">
            <p>Your information is used solely for platform functionality:</p>
            <ul className="list-disc pl-4 mt-2 space-y-1">
              <li>To display your profile to other students and administrators</li>
              <li>To send push notifications about news, events, and messages</li>
              <li>To enable Connect+ messaging and student search</li>
              <li>To authenticate your identity and secure your account</li>
            </ul>
            <p className="mt-2">We do not sell, rent, or share your data with third parties.</p>
          </Section>

          <Section icon={<Eye className="w-4 h-4" />} title="3. Anonymous Desk">
            <p>The Anonymous Desk is designed to protect your identity. Submissions made through this feature contain no personally identifiable information. Your name, email, and user ID are never attached to anonymous submissions. You receive a tracking code to check the status of your submission independently.</p>
          </Section>

          <Section icon={<UserCheck className="w-4 h-4" />} title="4. Data Security">
            <p>All data is stored securely using Supabase's encrypted infrastructure. Passwords are hashed and never stored in plain text. Row-level security policies ensure that users can only access their own private data. Administrative access is restricted to authorized SUG officials.</p>
          </Section>

          <Section icon={<Mail className="w-4 h-4" />} title="5. Your Rights">
            <p>You have the right to:</p>
            <ul className="list-disc pl-4 mt-2 space-y-1">
              <li>Update or edit your profile information at any time</li>
              <li>Change your password through Settings</li>
              <li>Log out and terminate your session</li>
              <li>Request data deletion by contacting the SUG administration</li>
            </ul>
          </Section>

          <Section icon={<Shield className="w-4 h-4" />} title="6. Changes to This Policy">
            <p>We may update this Privacy Policy from time to time. Any changes will be communicated through the platform. Continued use of the app after changes constitutes acceptance of the updated policy.</p>
          </Section>

          <div className="bg-brand-50 dark:bg-dark-surface rounded-2xl p-4 border border-brand-100 dark:border-dark-border">
            <p className="text-xs text-navy-600 dark:text-dark-muted leading-relaxed">
              For questions about this Privacy Policy, contact the SUG administration at <span className="font-bold text-brand-600">speedbolt@tasfuedsu.edu.ng</span>
            </p>
          </div>
        </div>

        <div className="mt-8">
          <DevelopedByFooter />
        </div>
      </div>
    </>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-dark-surface rounded-2xl border border-navy-100 dark:border-dark-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <h3 className="text-sm font-bold text-navy-800 dark:text-dark-text">{title}</h3>
      </div>
      <div className="text-xs text-navy-600 dark:text-dark-muted leading-relaxed pl-10">
        {children}
      </div>
    </div>
  );
}
