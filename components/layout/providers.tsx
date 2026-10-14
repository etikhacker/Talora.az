'use client';

import React, { useEffect } from 'react';
import { AuthProvider } from '@/lib/auth/auth-context';
import { LanguageProvider } from '@/lib/i18n/language-context';

const THEME_STORAGE_KEY = 'intern-az-theme';

function applyStoredTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    const root = document.documentElement;
    const theme = saved === 'dark' ? 'dark' : saved === 'light' ? 'light' : null;
    if (!theme) return;
    root.classList.remove(theme === 'dark' ? 'light' : 'dark');
    root.classList.add(theme);
  } catch {
    /* localStorage may be unavailable — non-fatal */
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Apply the visitor's saved theme on every route.
  //
  // `app/layout.tsx` renders `<html className="light">` so the server markup is
  // deterministic, and `ThemeToggle` re-applies the saved value — but the auth
  // screens (/login, /register, /admin/login) have no toggle, so a visitor who
  // picked the dark theme on the rest of the site landed on a light auth screen
  // while the auth stylesheet had already been made theme-aware. Doing it here
  // covers every route, including ones that render no toggle.
  useEffect(() => {
    applyStoredTheme();
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </LanguageProvider>
  );
}