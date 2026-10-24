"use client";
import Link from "next/link";
import { useState } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";
export function DevelopmentNotice() {
  const [visible, setVisible] = useState(true);
  const { language } = useLanguage();
  if (!visible) return null;
  return (
    <aside
      className="development-banner"
      aria-label={
        language === "az" ? "Platforma haqqında bildiriş" : "Platform notice"
      }
    >
      <div className="content-width">
        <p>
          {language === "az"
            ? "Talora inkişaf mərhələsindədir. Rəyin bizim üçün önəmlidir."
            : "Talora is still growing. Your feedback matters."}{" "}
          <Link href="/contact">
            {language === "az" ? "Problem bildir" : "Report an issue"}
          </Link>
        </p>
        <button
          onClick={() => setVisible(false)}
          aria-label={language === "az" ? "Bildirişi bağla" : "Dismiss notice"}
        >
          <X size={14} />
        </button>
      </div>
    </aside>
  );
}
