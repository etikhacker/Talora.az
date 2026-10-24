"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X, User, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useLanguage } from "@/lib/i18n/language-context";
import { TaloraLogo } from "./talora-logo";
import { ThemeToggle } from "./theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
export function Navbar() {
  const path = usePathname();
  const { user, signOut } = useAuth();
  const { language, setLanguage } = useLanguage();
  const isAz = language === "az";
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  const links = [
    ["/internships", isAz ? "Proqramlar" : "Programs"],
    ["/how-it-works", isAz ? "Necə işləyir?" : "How it works"],
    ["/about", isAz ? "Haqqımızda" : "About"],
    ["/contact", isAz ? "Əlaqə" : "Contact"],
  ];
  return (
    <header className="site-nav">
      <div className="content-width site-nav__inner">
        <TaloraLogo />
        <nav
          className="site-nav__links"
          aria-label={isAz ? "Əsas naviqasiya" : "Main navigation"}
        >
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={path.startsWith(href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="site-nav__tools">
          <ThemeToggle />
          <button
            className="language-button"
            onClick={() => setLanguage(isAz ? "en" : "az")}
            aria-label={isAz ? "Switch to English" : "Azərbaycan dilinə keç"}
          >
            {language.toUpperCase()}
          </button>
          <Link
            className={cn(
              buttonVariants({ variant: "outline" }),
              "site-nav__account",
            )}
            href={user ? "/dashboard" : "/login"}
          >
            {user ? (
              <>
                <User size={16} />
                {isAz ? "Kabinet" : "Dashboard"}
              </>
            ) : (
              <>
                {isAz ? "Daxil ol" : "Sign in"}
                <ArrowRight size={16} />
              </>
            )}
          </Link>
          <button
            className="icon-button site-nav__menu"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={isAz ? "Menyunu aç/bağla" : "Toggle navigation"}
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          className="site-nav__mobile content-width"
          id="mobile-navigation"
          aria-label={isAz ? "Mobil naviqasiya" : "Mobile navigation"}
        >
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={path.startsWith(href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
          <Link
            href={user ? "/dashboard" : "/login"}
            onClick={() => setOpen(false)}
          >
            {isAz
              ? user
                ? "Şəxsi kabinet"
                : "Daxil ol"
              : user
                ? "Dashboard"
                : "Sign in"}
          </Link>
          {!user && (
            <Link href="/register" onClick={() => setOpen(false)}>
              {isAz ? "Hesab yarat" : "Create account"}
            </Link>
          )}
          {user && (
            <button
              onClick={() => {
                void signOut();
                setOpen(false);
              }}
            >
              <LogOut size={16} />
              {isAz ? "Çıxış" : "Sign out"}
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
