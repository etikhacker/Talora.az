'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { useLanguage, Language } from '@/lib/i18n/language-context';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { GraduationCap, Menu, X, ArrowRight, User, Globe, LogOut } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: t('navHome') },
    { href: '/internships', label: t('navInternships') },
    { href: '/how-it-works', label: t('navHowItWorks') },
    { href: '/about', label: t('navAbout') },
    { href: '/contact', label: t('navContact') },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-[#0B1220]/95 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_35px_rgba(2,6,23,0.18)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-slate-950 shadow-[0_0_28px_rgba(52,211,153,0.28)] group-hover:rotate-3 group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block leading-tight">
                Intern<span className="text-blue-400">.az</span>
              </span>
              <span className="text-[10px] tracking-[0.16em] text-slate-400 uppercase font-medium">
                Təcrübə Portalı
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors hover:text-blue-300 ${
                    isActive ? 'text-blue-300 font-semibold' : ''
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Area: Language Switcher & Auth Actions */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            {/* Language Switcher AZ / EN */}
            <div className="flex items-center bg-slate-100/70 p-0.5 rounded-lg text-xs font-semibold text-slate-400 border border-slate-200/80">
              <button
                type="button"
                  onClick={() => setLanguage('az')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    language === 'az'
                    ? 'bg-blue-400 text-slate-950 shadow-2xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                AZ
              </button>
              <button
                type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-1 rounded-md transition-all ${
                    language === 'en'
                    ? 'bg-blue-400 text-slate-950 shadow-2xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                EN
              </button>
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    {t('navDashboard')}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="text-slate-500 hover:text-slate-800"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  {t('navLogout')}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-slate-700 font-medium">
                    {t('navLogin')}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="default" size="sm" className="gap-1.5 shadow-xs">
                    {t('navRegister')}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            {/* Quick Lang Switcher on mobile header */}
            <button
              onClick={() => setLanguage(language === 'az' ? 'en' : 'az')}
              className="text-xs font-bold px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-700 uppercase"
            >
              {language}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Dil / Language:</span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200">
              <button
                type="button"
                onClick={() => setLanguage('az')}
                className={`px-2.5 py-1 rounded-md ${
                  language === 'az' ? 'bg-white text-blue-700 shadow-2xs font-bold' : ''
                }`}
              >
                AZ
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-md ${
                  language === 'en' ? 'bg-white text-blue-700 shadow-2xs font-bold' : ''
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600"
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    {t('navDashboard')}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full justify-start text-slate-500"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('navLogout')}
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    {t('navLogin')}
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="default" className="w-full">
                    {t('navRegister')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
