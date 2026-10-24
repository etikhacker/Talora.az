"use client";
import React, { useEffect, useRef, useMemo, useState } from "react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  Bell,
  ChevronDown,
  Command,
  LogOut,
  Moon,
  Search,
  Sun,
  UserRound,
} from "lucide-react";
const pages = [
  {
    href: "/admin",
    az: "İcmal",
    en: "Overview",
    terms: "icmal overview dashboard",
  },
  {
    href: "/admin/internships",
    az: "Təcrübə proqramları",
    en: "Internships",
    terms: "tecrube internship proqramlar",
  },
  {
    href: "/admin/applications",
    az: "Müraciətlər",
    en: "Applications",
    terms: "muraciet applications",
  },
  {
    href: "/admin/students",
    az: "İstifadəçilər",
    en: "Users",
    terms: "telebe students users",
  },
  {
    href: "/admin/tasks",
    az: "Tapşırıqlar",
    en: "Tasks",
    terms: "task tapsiriq",
  },
  {
    href: "/admin/submissions",
    az: "Təqdimatlar",
    en: "Submissions",
    terms: "submission təqdimat",
  },
  {
    href: "/admin/certificate-orders",
    az: "Ödənişlər",
    en: "Payments",
    terms: "odenis payment qebz",
  },
  {
    href: "/admin/certificates",
    az: "Sertifikatlar",
    en: "Certificates",
    terms: "sertifikat certificate",
  },
  {
    href: "/admin/settings",
    az: "Tənzimləmələr",
    en: "Settings",
    terms: "settings tənzimləmə",
  },
  {
    href: "/admin/notifications",
    az: "Bildirişlər",
    en: "Notifications",
    terms: "bildiriş notification",
  },
];
export function AdminTopbar({
  theme,
  onThemeToggle,
  onToggleSidebar,
}: {
  theme: "light" | "dark";
  onThemeToggle: () => void;
  onToggleSidebar: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { language } = useLanguage();
  const isAz = language === "az";
  const [query, setQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node))
        setProfileOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);
  const current = useMemo(
    () =>
      [...pages]
        .sort((a, b) => b.href.length - a.href.length)
        .find(
          (p) =>
            p.href === pathname ||
            (p.href != "/admin" && pathname.startsWith(p.href + "/")),
        ) || pages[0],
    [pathname],
  );
  const matches = query.trim()
    ? pages.filter((p) =>
        (p.az + " " + p.en + " " + p.terms)
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      )
    : [];
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (matches[0]) {
      router.push(matches[0].href);
      setQuery("");
    }
  };
  return (
    <header className="workspace-topbar admin-topbar">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="hidden rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-300 hover:text-white md:inline-flex"
          aria-label={isAz ? "Yan menyunu yığ/aç" : "Collapse/expand sidebar"}
        >
          <Command className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-blue-400">
            {isAz ? "TALORA İDARƏETMƏSİ" : "TALORA CONTROL CENTER"}
          </p>
          <p className="admin-topbar__title truncate text-sm font-medium text-white">
            {isAz ? current.az : current.en}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <form onSubmit={submit} className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isAz ? "Səhifə axtar..." : "Find a page..."}
            aria-label={isAz ? "Səhifə axtar" : "Search pages"}
            className="h-10 w-44 rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-3 text-xs text-white outline-none placeholder:text-slate-500 focus:border-blue-500/60 lg:w-56"
          />
          {matches.length > 0 && (
            <div className="absolute right-0 top-12 z-40 w-60 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 p-1 shadow-2xl">
              {matches.slice(0, 5).map((p) => (
                <button
                  type="button"
                  key={p.href}
                  onClick={() => {
                    router.push(p.href);
                    setQuery("");
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  {isAz ? p.az : p.en}
                </button>
              ))}
            </div>
          )}
        </form>
        <button
          onClick={onThemeToggle}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
          aria-label={theme === "dark" ? "Açıq rejimə keç" : "Tünd rejimə keç"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
        <Link
          href="/admin/notifications"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
          aria-label={isAz ? "Bildirişlər" : "Notifications"}
        >
          <Bell className="h-4 w-4" />
        </Link>
        <LanguageSwitcher />
        <div ref={menuRef} className="relative">
          <button
            aria-label={isAz ? "Hesab menyusu" : "Account menu"}
            onClick={() => setProfileOpen((v) => !v)}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-2.5 text-slate-200 hover:border-slate-700"
            aria-expanded={profileOpen}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">
              <UserRound className="h-4 w-4" />
            </span>
            <span className="hidden max-w-28 truncate text-xs font-medium lg:block">
              {profile?.full_name || "Administrator"}
            </span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-slate-500 sm:block" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-12 z-40 w-52 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl">
              <div className="border-b border-slate-800 px-2 pb-2">
                <p className="truncate text-xs font-semibold text-white">
                  {profile?.full_name || "Administrator"}
                </p>
                <p className="truncate text-[10px] text-slate-400">
                  {profile?.email}
                </p>
              </div>
              <button
                onClick={() => signOut()}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-red-300 hover:bg-red-950/40"
              >
                <LogOut className="h-4 w-4" />
                {isAz ? "Çıxış et" : "Sign out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
