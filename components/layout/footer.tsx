'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/language-context';
import { GraduationCap, Mail, MapPin } from 'lucide-react';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="w-full bg-[#0B1220] text-slate-300 text-sm border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-slate-950 shadow-[0_0_24px_rgba(52,211,153,0.2)]">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Intern<span className="text-blue-300">.az</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              {t('footerDesc')}
            </p>
            <div className="text-xs text-slate-400 flex items-center gap-2 pt-1">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>{t('footerBaku')}</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">
              {t('footerPlatform')}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/internships" className="hover:text-blue-400 transition-colors">
                  {t('navInternships')}
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-blue-400 transition-colors">
                  {t('navHowItWorks')}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-blue-400 transition-colors">
                  {t('navAbout')}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-400 transition-colors">
                  {t('navContact')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">
              Tələbələr üçün
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/register" className="hover:text-blue-400 transition-colors">
                  {t('navRegister')}
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-blue-400 transition-colors">
                  {t('navLogin')}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-blue-400 transition-colors">
                  Tələbə Portalı
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-blue-400" />
                  <span>Dəstək və Əlaqə</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Intern.az. {t('footerRights')}</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>{t('privacy')}</span>
            <span>•</span>
            <span>{t('terms')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
