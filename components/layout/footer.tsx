"use client";
import Link from "next/link";
import { Linkedin, Mail, ArrowUpRight } from "lucide-react";
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
      <div className="content-width site-footer__socials">
        <p>{isAz ? "Bizimlə əlaqədə qal" : "Stay connected"}</p>
        <nav
          aria-label={
            isAz ? "Sosial media və e-poçt" : "Social media and email"
          }
        >
          <a
            href="https://www.linkedin.com/company/talora-az."
            target="_blank"
            rel="noopener noreferrer"
            aria-label={
              isAz
                ? "Talora LinkedIn — yeni pəncərədə açılır"
                : "Talora LinkedIn — opens in a new tab"
            }
          >
            <Linkedin size={18} aria-hidden="true" />
            <span>LinkedIn</span>
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
          <a href="mailto:internaz.notification@gmail.com">
            <Mail size={18} aria-hidden="true" />
            <span>internaz.notification@gmail.com</span>
          </a>
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
