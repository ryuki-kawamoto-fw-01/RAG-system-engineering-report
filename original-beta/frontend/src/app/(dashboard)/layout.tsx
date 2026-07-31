import { cookies } from 'next/headers';
import React from 'react';
import AppSidebar from '../_components/layout/app-sidebar';
import Header from '../_components/ui/header';
import { SidebarProvider } from '../_components/ui/sidebar';
import { Toaster } from '../_components/ui/sonner';
import DashboardClientLayout from './dashboard-client-layout';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  // "false"以外はtrue、開いた状態とする
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <DashboardClientLayout>
        <div className="flex h-screen w-screen flex-col overflow-hidden">
          <Header className="shrink-0" />

          <div className="flex h-[calc(100vh-48px)] flex-1">
            <AppSidebar />
            <main className="flex-1 overflow-hidden">{children}</main>
          </div>
        </div>
        <Toaster />
      </DashboardClientLayout>
    </SidebarProvider>
  );
}
