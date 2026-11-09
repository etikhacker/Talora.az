"use client";
import { useEffect } from "react";
import { AuthProvider } from "@/lib/auth/auth-context";
import { StudentPresence } from "./student-presence";
import { LanguageProvider } from "@/lib/i18n/language-context";
import { initializeTheme } from "@/lib/theme";
export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeTheme();
  }, []);
  return (
    <LanguageProvider>
      <AuthProvider><StudentPresence />{children}</AuthProvider>
    </LanguageProvider>
  );
}
