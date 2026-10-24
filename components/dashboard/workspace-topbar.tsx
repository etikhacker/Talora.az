"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Bell, ArrowUpRight } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { useLanguage } from "@/lib/i18n/language-context";
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
  const isAz = language === "az";
  const key = pathname.includes("/tasks/")
    ? "tasks"
    : pathname.split("/")[2] || "dashboard";
  return (
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
          className="icon-button"
          aria-label={isAz ? "Bildirişlər" : "Notifications"}
        >
          <Bell size={17} />
        </Link>
      </div>
    </header>
  );
}
