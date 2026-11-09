"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Bell, ArrowUpRight, X } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useLanguage } from "@/lib/i18n/language-context";
import { useNotifications } from "./notification-provider";
const titles: Record<string, [string, string]> = {
  dashboard: ["Ümumi baxış", "Overview"],
  internships: ["Proqramlar", "Programs"],
  applications: ["Müraciətlərim", "My applications"],
  internship: ["Mənim təcrübəm", "My internship"],
  tasks: ["Tapşırıqlar", "Assignments"],
  submissions: ["Təqdimatlar", "Submissions"],
  certificate: ["Sertifikat", "Certificate"],
  notifications: ["Bildirişlər", "Notifications"],
  profile: ["Profil", "Profile"],
  settings: ["Parametrlər", "Settings"],
};
export function WorkspaceTopbar() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const { unreadCount, newArrivalCount, dismissNewArrivals } = useNotifications();
  const isAz = language === "az";
  const key = pathname.includes("/tasks/")
    ? "tasks"
    : pathname.split("/")[2] || "dashboard";
  return (
    <>
    <header className="workspace-topbar">
      <div className="workspace-topbar__trail">
        <span>{isAz ? "Tələbə kabineti" : "Student portal"}</span>
        <ChevronRight size={14} />
        <strong>{(titles[key] || titles.dashboard)[isAz ? 0 : 1]}</strong>
      </div>
      <div className="workspace-topbar__tools">
        <Link href="/internships">
          <span>{isAz ? "Proqramlar" : "Programs"}</span>
          <ArrowUpRight size={16} />
        </Link>
        <LanguageSwitcher />
        <ThemeToggle />
        <Link
          href="/dashboard/notifications"
          className="icon-button relative"
          onClick={dismissNewArrivals}
          aria-label={`${isAz ? "Bildirişlər, oxunmamış:" : "Notifications, unread:"} ${unreadCount}`}
        >
          <Bell size={17} />
          {unreadCount > 0 && <span className="notification-count" aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </Link>
      </div>
    </header>
    {newArrivalCount > 0 && !pathname.startsWith("/dashboard/notifications") && (
      <div role="status" aria-live="polite"
        className="fixed right-4 top-20 z-[90] flex max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border border-blue-300 bg-white p-4 text-slate-900 shadow-xl sm:w-80">
        <Bell size={19} className="mt-0.5 shrink-0 text-blue-600" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">
            {isAz
              ? newArrivalCount + " yeni bildiriş var"
              : newArrivalCount + " new notification" + (newArrivalCount === 1 ? "" : "s")}
          </p>
          <Link href="/dashboard/notifications" onClick={dismissNewArrivals}
            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline">
            {isAz ? "Bildirişlərə bax" : "Open notifications"} <ArrowUpRight size={14} />
          </Link>
        </div>
        <button type="button" onClick={dismissNewArrivals}
          aria-label={isAz ? "Bildirişi bağla" : "Dismiss notification"}
          className="rounded-md p-1 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-500">
          <X size={17} />
        </button>
      </div>
    )}
    </>
  );
}
