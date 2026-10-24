"use client";
import { useEffect } from "react";
import { AuthProvider } from "@/lib/auth/auth-context";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { initializeTheme } from "@/lib/theme";
export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeTheme();
  }, []);
  return (
    <LanguageProvider>
      <AuthProvider>{children}</AuthProvider>
    </LanguageProvider>
  );
}
