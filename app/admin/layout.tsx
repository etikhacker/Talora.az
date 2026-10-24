"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { isSoleAdminEmail } from "@/lib/auth/admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { Loader2 } from "lucide-react";
import "./admin-theme.css";
import { useTheme } from "@/lib/theme";
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const isAdmin = isSoleAdminEmail(user?.email);
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  useEffect(() => {
    if (pathname === "/admin/login") return;
    if (!isLoading) {
      if (!user) router.push("/admin/login");
      else if (!isAdmin) router.push("/dashboard");
    }
  }, [user, isAdmin, isLoading, router, pathname]);
  if (pathname === "/admin/login") return <>{children}</>;
  if (isLoading)
    return (
      <div className="admin-shell workspace-shell flex min-h-screen items-center justify-center bg-slate-900 p-12 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          <p className="text-xs font-medium">Admin icazələri yoxlanılır...</p>
        </div>
      </div>
    );
  if (!user || !isAdmin)
    return (
      <div className="admin-shell workspace-shell flex min-h-screen items-center justify-center bg-slate-900 p-12 text-slate-400">
        <p className="text-center text-xs">
          Səlahiyyətli panelə yönləndirilirsiniz...
        </p>
      </div>
    );
  return (
    <div
      className="admin-shell workspace-shell flex min-h-screen flex-col overflow-x-clip bg-slate-950 text-slate-100 md:h-[100dvh] md:flex-row md:overflow-hidden"
      data-admin-theme={theme}
    >
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />
      <main
        id="main-content"
        className="workspace-main min-w-0 flex-1 overflow-y-auto px-4 pb-6 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-[1400px]">
          <AdminTopbar
            theme={theme}
            onThemeToggle={toggleTheme}
            onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
          />
          {children}
        </div>
      </main>
    </div>
  );
}
