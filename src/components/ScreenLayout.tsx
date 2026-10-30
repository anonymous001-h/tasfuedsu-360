import type { ReactNode } from 'react';
import { AppHeader } from '@/components/AppHeader';

interface ScreenLayoutProps {
  title: string;
  children: ReactNode;
  showBack?: boolean;
  rightAction?: ReactNode;
}

export function ScreenLayout({ title, children, showBack = true, rightAction }: ScreenLayoutProps) {
  return (
    <>
      <AppHeader title={title} showBack={showBack} rightAction={rightAction} />
      <div className="px-4 py-4 pb-20">
        {children}
      </div>
    </>
  );
}

export function ScreenWrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export { AppHeader };
