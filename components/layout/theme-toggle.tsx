"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/language-context";
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const label =
    theme === "dark"
      ? language === "az"
        ? "Açıq temaya keç"
        : "Switch to light theme"
      : language === "az"
        ? "Tünd temaya keç"
        : "Switch to dark theme";
  return (
    <button
      type="button"
      className="icon-button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
