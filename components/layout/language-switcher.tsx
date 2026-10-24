'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/language-context';
import { cn } from '@/lib/utils';

/**
 * Compact AZ / EN toggle.
 *
 * Rendered on pages that sit outside the public Navbar (auth screens), so the
 * visitor can switch the interface language without navigating back to a page
 * that already carries a switcher. Purely presentational — the selection state
 * and persistence live in LanguageProvider.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();

  const options = [
    { code: 'az' as const, label: t('languageAzLabel') },
    { code: 'en' as const, label: t('languageEnLabel') },
  ];

  return (
    <div
      role="group"
      aria-label={t('authLangLabel')}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-100/70 p-0.5',
        className
      )}
    >
      {options.map((option) => {
        const isActive = language === option.code;
        return (
          <button
            key={option.code}
            type="button"
            lang={option.code}
            aria-pressed={isActive}
            onClick={() => setLanguage(option.code)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all',
              isActive
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            {option.code === 'az' ? 'AZ' : 'EN'}
          </button>
        );
      })}
    </div>
  );
}
