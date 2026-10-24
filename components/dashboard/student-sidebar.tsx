"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useLanguage, type Translations } from "@/lib/i18n/language-context";
import { TaloraLogo } from "@/components/layout/talora-logo";
import { Avatar } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Search,
  FileText,
  Briefcase,
  CheckSquare,
  UploadCloud,
  Award,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
const items: { key: keyof Translations; href: string; icon: typeof User }[] = [
  { key: "sideDashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "sideInternships", href: "/dashboard/internships", icon: Search },
  {
    key: "sideMyApplications",
    href: "/dashboard/applications",
    icon: FileText,
  },
  { key: "sideMyInternship", href: "/dashboard/internship", icon: Briefcase },
  { key: "sideTasks", href: "/dashboard/tasks", icon: CheckSquare },
  { key: "sideSubmissions", href: "/dashboard/submissions", icon: UploadCloud },
  { key: "sideCertificate", href: "/dashboard/certificate", icon: Award },
  { key: "sideNotifications", href: "/dashboard/notifications", icon: Bell },
  { key: "sideProfile", href: "/dashboard/profile", icon: User },
  { key: "sideSettings", href: "/dashboard/settings", icon: Settings },
];
export function StudentSidebar() {
  const path = usePathname();
  const { profile, signOut } = useAuth();
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const content = (
    <div className="workspace-sidebar">
      <div className="workspace-sidebar__brand">
        <TaloraLogo compact />
        <small>{t("sideStudentPortal")}</small>
      </div>
      <div className="workspace-sidebar__profile">
        <Avatar
          src={profile?.avatar_url}
          fallback={profile?.full_name || "ST"}
          size="md"
        />
        <div className="min-w-0">
          <p className="truncate">
            {profile?.full_name || t("sideStudentFallback")}
          </p>
          <small className="block truncate">
            {profile?.university || t("sideStudentUniversityFallback")}
          </small>
        </div>
      </div>
      <nav aria-label={t("sideStudentMenu")}>
        {items.map((item, index) => {
          const Icon = item.icon;
          const active =
            path === item.href ||
            (item.href === "/dashboard/tasks" && path.includes("/tasks/"));
          return (
            <div key={item.href}>
              {index === 0 && (
                <p className="eyebrow px-3 py-3">
                  {language === "az" ? "İNKİŞAF YOLUN" : "YOUR JOURNEY"}
                </p>
              )}
              {index === 7 && (
                <p className="eyebrow px-3 pt-6 pb-3">
                  {language === "az" ? "ŞƏXSİ KABİNET" : "YOUR ACCOUNT"}
                </p>
              )}
              <Link
                className="workspace-nav-link"
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />
                <span>{t(item.key)}</span>
                {active && <ChevronRight size={14} />}
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="workspace-sidebar__footer">
        <button onClick={() => void signOut()}>
          <LogOut size={18} />
          {t("sideStudentSignOut")}
        </button>
      </div>
    </div>
  );
  return (
    <>
      <div className="workspace-mobile-bar">
        <TaloraLogo compact />
        <button
          className="icon-button"
          onClick={() => setOpen(true)}
          aria-label={language === "az" ? "Menyunu aç" : "Open menu"}
          aria-expanded={open}
        >
          <Menu size={20} />
        </button>
      </div>
      <aside className="sticky top-0 hidden md:block w-[272px] shrink-0 h-[100dvh]">
        {content}
      </aside>
      {open && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t("sideStudentMenu")}
        >
          <button
            className="workspace-drawer-backdrop"
            onClick={() => setOpen(false)}
            aria-label={language === "az" ? "Menyunu bağla" : "Close menu"}
          />
          <div className="workspace-drawer">
            {content}
            <button
              ref={closeRef}
              className="icon-button workspace-drawer-close"
              onClick={() => setOpen(false)}
              aria-label={language === "az" ? "Menyunu bağla" : "Close menu"}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
