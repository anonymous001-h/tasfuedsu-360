import type { ReactNode } from 'react';
import { BottomTabs } from '@/components/BottomTabs';

interface PhoneShellProps {
  children: ReactNode;
  header?: ReactNode;
  showBottomNav?: boolean;
  showHeader?: boolean;
}

export function PhoneShell({ children, header, showBottomNav = true, showHeader = true }: PhoneShellProps) {
  return (
    <div className="min-h-screen bg-navy-50 dark:bg-dark-bg flex flex-col">
      <div className="w-full max-w-[480px] mx-auto bg-white dark:bg-dark-bg min-h-screen flex flex-col relative sm:shadow-2xl">
        {header}
        <main className={`flex-1 ${showBottomNav ? 'pb-16' : ''} ${showHeader ? 'pt-14' : ''} animate-page-enter`}>
          {children}
        </main>
        {showBottomNav && <BottomTabs />}
      </div>
    </div>
  );
}
