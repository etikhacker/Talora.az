'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { WorkspaceTopbar } from '@/components/dashboard/workspace-topbar';
import { StudentSidebar } from '@/components/dashboard/student-sidebar';
import { NotificationProvider } from '@/components/dashboard/notification-provider';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-xs font-medium">Verifying student session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    /* Same single-viewport shell as the admin console, so the student sidebar
       (h-[100dvh]) and the content column can never leave a dead band.

       `flex-1` is deliberately absent from the shell: body is a column flex
       container, and `flex: 1 1 0%` sets flex-basis, which wins over `height`
       — the shell then grew to the content height, the document scrolled and
       the sidebar was cut into a half-height ("yarımqıq") bar. The shell sizes
       itself with `md:h-[100dvh]`, `main` is the only scroll container. */
    <NotificationProvider key={user.id} userId={user.id}><div className="workspace-shell flex flex-col overflow-x-clip bg-slate-50 md:h-[100dvh] md:flex-row md:overflow-hidden">
      <StudentSidebar />
      <main id="main-content" className="workspace-main min-w-0 flex-1 overflow-y-auto">
        <div className="workspace-content"><WorkspaceTopbar />
          {children}
        </div>
      </main>
    </div></NotificationProvider>
  );
}
