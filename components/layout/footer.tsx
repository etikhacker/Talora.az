"use client";
import Link from "next/link";
import { TaloraLogo } from "./talora-logo";
import { useLanguage } from "@/lib/i18n/language-context";
export function Footer() {
  const { language } = useLanguage();
  const isAz = language === "az";
  return (
    <footer className="site-footer">
      <div className="content-width site-footer__main">
        <TaloraLogo />
        <p>
          {isAz
            ? "Təcrübə ilə böyü. Öz yolunu qur."
            : "Grow through experience. Find your own path."}
        </p>
        <nav aria-label={isAz ? "Alt naviqasiya" : "Footer navigation"}>
          <Link href="/terms">{isAz ? "İstifadə şərtləri" : "Terms"}</Link>
          <Link href="/privacy">{isAz ? "Məxfilik" : "Privacy"}</Link>
          <Link href="/contact">{isAz ? "Əlaqə" : "Contact"}</Link>
        </nav>
      </div>
      <div className="content-width site-footer__bottom">
        <small>© {new Date().getFullYear()} Talora.</small>
        <Link href="/admin/login">
          {isAz ? "İnzibatçı girişi" : "Administrator sign in"}
        </Link>
      </div>
    </footer>
  );
}
